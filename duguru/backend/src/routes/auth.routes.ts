import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../db/client";
import { hashPassword, verifyPassword } from "../auth/passwordService";
import {
  signAccessToken,
  signRefreshToken,
} from "../auth/jwtService";
import {
  saveRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
} from "../auth/tokenStore";
import { loginRateLimiter } from "../middleware/rateLimiter";
import { requireAuth } from "../auth/authMiddleware";
import { createError } from "../middleware/errorHandler";
import {
  sendPasswordResetEmail,
  sendAccountLockedEmail,
} from "../services/emailService";

export const authRouter = Router();

/* ─── Schemas de validação (Zod) ────────────────────────────── */

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres.").max(100),
  email: z.string().email("E-mail inválido."),
  password: z
    .string()
    .min(8, "Senha deve ter ao menos 8 caracteres.")
    .regex(/[A-Z]/, "Senha deve conter ao menos uma letra maiúscula.")
    .regex(/[0-9]/, "Senha deve conter ao menos um número."),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data no formato YYYY-MM-DD."),
  birthTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Horário no formato HH:MM.")
    .nullish(),
  birthCity: z.string().min(1),
  birthCountry: z.string().min(1),
  birthLat: z.number().min(-90).max(90),
  birthLon: z.number().min(-180).max(180),
  timezone: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "Senha obrigatória."),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido."),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
});

/* ─── Helpers ───────────────────────────────────────────────── */

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_TOKEN_DAYS = 7;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 min
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "strict",
    path: "/api/auth",
  });
}

function sanitizeUser(user: {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  sunSign?: string | null;
  ascendant?: string | null;
  onboardingDone: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    sunSign: user.sunSign ?? null,
    ascendant: user.ascendant ?? null,
    onboardingDone: user.onboardingDone,
  };
}

function zodError(err: z.ZodError): ReturnType<typeof createError> {
  const message = err.errors.map((e) => e.message).join(" | ");
  return createError(422, "VALIDATION_ERROR", message);
}

/* ─── POST /api/auth/register ───────────────────────────────── */

authRouter.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return next(zodError(parsed.error));

    const {
      name, email, password,
      birthDate, birthTime, birthCity, birthCountry,
      birthLat, birthLon, timezone,
    } = parsed.data;

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return next(createError(409, "AUTH_EMAIL_ALREADY_EXISTS", "Este e-mail já está cadastrado."));
      }

      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          name, email, passwordHash,
          birthDate: new Date(birthDate),
          birthTime: birthTime ?? null,
          birthCity, birthCountry, birthLat, birthLon, timezone,
        },
      });

      const accessToken = await signAccessToken(user.id);
      const family = uuidv4();
      const refreshToken = await signRefreshToken(user.id, family);
      const refreshExpiry = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

      await saveRefreshToken({ userId: user.id, token: refreshToken, expiresAt: refreshExpiry });

      setRefreshCookie(res, refreshToken);
      return res.status(201).json({ accessToken, user: sanitizeUser(user) });
    } catch (err) {
      return next(err);
    }
  },
);

/* ─── POST /api/auth/login ──────────────────────────────────── */

authRouter.post(
  "/login",
  loginRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return next(zodError(parsed.error));

    const { email, password } = parsed.data;
    const INVALID = createError(401, "AUTH_INVALID_CREDENTIALS", "E-mail ou senha incorretos.");

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return next(INVALID);

      // Conta bloqueada?
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        return next(createError(403, "AUTH_ACCOUNT_LOCKED", "Conta bloqueada. Tente novamente mais tarde."));
      }

      const valid = await verifyPassword(password, user.passwordHash);

      if (!valid) {
        const newAttempts = user.failedLoginAttempts + 1;
        const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: newAttempts,
            lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : null,
          },
        });

        if (shouldLock) {
          void sendAccountLockedEmail(user.email, user.name).catch(() => null);
        }

        return next(INVALID);
      }

      // Sucesso — resetar tentativas
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });

      const accessToken = await signAccessToken(user.id);
      const family = uuidv4();
      const refreshToken = await signRefreshToken(user.id, family);
      const refreshExpiry = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

      await saveRefreshToken({ userId: user.id, token: refreshToken, expiresAt: refreshExpiry });

      setRefreshCookie(res, refreshToken);
      return res.json({ accessToken, user: sanitizeUser(user) });
    } catch (err) {
      return next(err);
    }
  },
);

/* ─── POST /api/auth/refresh ────────────────────────────────── */

authRouter.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction) => {
    const token = (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE_NAME];

    if (!token) {
      return next(createError(401, "AUTH_MISSING_REFRESH_TOKEN", "Refresh token ausente."));
    }

    try {
      const payload = await rotateRefreshToken(token);

      const accessToken = await signAccessToken(payload.sub);
      const newRefreshToken = await signRefreshToken(payload.sub, payload.family);
      const refreshExpiry = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

      await saveRefreshToken({
        userId: payload.sub,
        token: newRefreshToken,
        expiresAt: refreshExpiry,
      });

      setRefreshCookie(res, newRefreshToken);
      return res.json({ accessToken });
    } catch (err) {
      return next(err);
    }
  },
);

/* ─── POST /api/auth/logout ─────────────────────────────────── */

authRouter.post(
  "/logout",
  async (req: Request, res: Response, next: NextFunction) => {
    const token = (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE_NAME];

    try {
      if (token) {
        await revokeRefreshToken(token).catch(() => null);
      }
      clearRefreshCookie(res);
      return res.sendStatus(204);
    } catch (err) {
      return next(err);
    }
  },
);

/* ─── POST /api/auth/forgot-password ───────────────────────── */

authRouter.post(
  "/forgot-password",
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) return next(zodError(parsed.error));

    const { email } = parsed.data;

    // Sempre 200 para evitar user enumeration
    const OK = () => res.json({ message: "Se este e-mail existir, você receberá as instruções em breve." });

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return OK();

      // Revoga tokens anteriores do usuário
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

      const rawToken = uuidv4();
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      void sendPasswordResetEmail(user.email, user.name, rawToken).catch(() => null);

      return OK();
    } catch (err) {
      return next(err);
    }
  },
);

/* ─── POST /api/auth/reset-password ─────────────────────────── */

authRouter.post(
  "/reset-password",
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) return next(zodError(parsed.error));

    const { token, password } = parsed.data;

    try {
      const tokenHash = createHash("sha256").update(token).digest("hex");

      const record = await prisma.passwordResetToken.findFirst({
        where: {
          tokenHash,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (!record) {
        return next(createError(400, "AUTH_INVALID_RESET_TOKEN", "Token inválido ou expirado."));
      }

      const passwordHash = await hashPassword(password);

      await prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
      });

      await prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });

      // Revogar todos os refresh tokens do usuário
      await prisma.refreshToken.deleteMany({ where: { userId: record.userId } });

      return res.json({ message: "Senha redefinida com sucesso." });
    } catch (err) {
      return next(err);
    }
  },
);

/* ─── GET /api/auth/me ───────────────────────────────────────── */

authRouter.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true, name: true, email: true, avatarUrl: true,
          sunSign: true, ascendant: true, onboardingDone: true,
          birthDate: true, birthTime: true, birthCity: true,
          birthCountry: true, birthLat: true, birthLon: true,
          timezone: true, houseSystem: true, locale: true,
          createdAt: true,
        },
      });

      if (!user) {
        return next(createError(404, "USER_NOT_FOUND", "Usuário não encontrado."));
      }

      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  },
);
