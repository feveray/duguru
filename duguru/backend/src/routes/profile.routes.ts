import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { prisma } from "../db/client";
import { requireAuth } from "../auth/authMiddleware";
import { createError } from "../middleware/errorHandler";

export const profileRouter = Router();

/* ─── Schemas ───────────────────────────────────────────────── */

const patchProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).nullish(),
  birthCity: z.string().min(1).optional(),
  birthCountry: z.string().min(1).optional(),
  birthLat: z.number().min(-90).max(90).optional(),
  birthLon: z.number().min(-180).max(180).optional(),
  timezone: z.string().min(1).optional(),
  houseSystem: z.enum(["P", "K", "W", "E", "C"]).optional(),
  locale: z.string().optional(),
});

/** Campos que invalidam o NatalChartCache quando alterados */
const CHART_INVALIDATING_FIELDS = new Set([
  "birthDate", "birthLat", "birthLon", "houseSystem",
]);

/* ─── Multer — upload em memória (máx 5 MB) ─────────────────── */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Formato de imagem não suportado. Use JPEG, PNG ou WebP."));
    }
  },
});

/* ─── Middleware de autenticação em todas as rotas ───────────── */
profileRouter.use(requireAuth);

/* ─── GET /api/profile ───────────────────────────────────────── */

profileRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true, name: true, email: true, avatarUrl: true,
          birthDate: true, birthTime: true, birthCity: true,
          birthCountry: true, birthLat: true, birthLon: true,
          timezone: true, houseSystem: true, locale: true,
          sunSign: true, ascendant: true, onboardingDone: true,
          createdAt: true, updatedAt: true,
        },
      });

      if (!user) return next(createError(404, "USER_NOT_FOUND", "Usuário não encontrado."));
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  },
);

/* ─── PATCH /api/profile ─────────────────────────────────────── */

profileRouter.patch(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = patchProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(" | ");
      return next(createError(422, "VALIDATION_ERROR", message));
    }

    const data = parsed.data;
    const userId = req.user!.userId;

    try {
      const updateData: Record<string, unknown> = { ...data };

      if (data.birthDate) {
        updateData["birthDate"] = new Date(data.birthDate);
      }

      // Invalida cache do mapa natal se campos críticos mudaram
      const invalidatesChart = Object.keys(data).some((k) =>
        CHART_INVALIDATING_FIELDS.has(k),
      );

      if (invalidatesChart) {
        await prisma.natalChartCache.deleteMany({ where: { userId } });
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData as Parameters<typeof prisma.user.update>[0]["data"],
        select: {
          id: true, name: true, email: true, avatarUrl: true,
          birthDate: true, birthTime: true, birthCity: true,
          birthCountry: true, birthLat: true, birthLon: true,
          timezone: true, houseSystem: true, locale: true,
          sunSign: true, ascendant: true, onboardingDone: true,
          updatedAt: true,
        },
      });

      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  },
);

/* ─── POST /api/profile/avatar ───────────────────────────────── */

const AVATAR_DIR = path.resolve("uploads/avatars");

profileRouter.post(
  "/avatar",
  upload.single("avatar"),
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(createError(400, "AVATAR_MISSING", "Nenhuma imagem enviada."));
    }

    try {
      await fs.mkdir(AVATAR_DIR, { recursive: true });

      const filename = `${req.user!.userId}-${Date.now()}.webp`;
      const filepath = path.join(AVATAR_DIR, filename);

      // Crop circular 256×256, converte para WebP
      await sharp(req.file.buffer)
        .resize(256, 256, { fit: "cover", position: "centre" })
        .webp({ quality: 85 })
        .toFile(filepath);

      const avatarUrl = `/uploads/avatars/${filename}`;

      await prisma.user.update({
        where: { id: req.user!.userId },
        data: { avatarUrl },
      });

      return res.json({ avatarUrl });
    } catch (err) {
      return next(err);
    }
  },
);
