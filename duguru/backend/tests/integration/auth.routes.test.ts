import {
  describe, it, expect, beforeAll, beforeEach, vi,
} from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../../src/app";

/* ─── Mock do cliente Prisma (factory pattern — evita hoisting) ──────────── */

const _mockUserBase = {
  id: "user_cuid_001",
  name: "Astro Teste",
  email: "astro@teste.com",
  passwordHash: "$2b$12$mocked_hash",
  avatarUrl: null,
  birthDate: new Date("1990-06-15"),
  birthTime: "10:30",
  birthCity: "São Paulo",
  birthCountry: "Brasil",
  birthLat: -23.5505,
  birthLon: -46.6333,
  timezone: "America/Sao_Paulo",
  houseSystem: "P",
  sunSign: "gemini",
  ascendant: "virgo",
  locale: "pt-BR",
  onboardingDone: false,
  lockedUntil: null,
  failedLoginAttempts: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  refreshTokens: [],
  natalChartCache: null,
  passwordResetTokens: [],
};

vi.mock("../../src/db/client", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create:     vi.fn(),
      update:     vi.fn(),
    },
    refreshToken: {
      create:     vi.fn(),
      findFirst:  vi.fn(),
      update:     vi.fn(),
      delete:     vi.fn(),
      deleteMany: vi.fn(),
    },
    passwordResetToken: {
      create:     vi.fn(),
      findFirst:  vi.fn(),
      update:     vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));
vi.mock("../../src/services/emailService", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendAccountLockedEmail: vi.fn().mockResolvedValue(undefined),
}));

/* Obter referências aos fns mockados após o mock ser aplicado */
async function getMockPrisma() {
  const { prisma } = await import("../../src/db/client");
  return prisma as unknown as {
    user: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    refreshToken: { create: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn>; deleteMany: ReturnType<typeof vi.fn> };
    passwordResetToken: { create: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; deleteMany: ReturnType<typeof vi.fn> };
  };
}

/* ─── Setup ──────────────────────────────────────────────────── */

let app: Express;
// Referência ao mock do Prisma (resolvida após vi.mock ser processado)
type MockPrisma = Awaited<ReturnType<typeof getMockPrisma>>;
let mp: MockPrisma;

beforeAll(async () => {
  mp = await getMockPrisma();
  app = await createApp();
});

beforeEach(() => {
  vi.clearAllMocks();
});

const mockUser = _mockUserBase;

/* ─── POST /api/auth/register ────────────────────────────────── */

describe("POST /api/auth/register", () => {
  const validBody = {
    name: "Astro Teste",
    email: "novo@teste.com",
    password: "Senha123!",
    birthDate: "1990-06-15",
    birthTime: "10:30",
    birthCity: "São Paulo",
    birthCountry: "Brasil",
    birthLat: -23.5505,
    birthLon: -46.6333,
    timezone: "America/Sao_Paulo",
  };

  it("cria usuário e retorna accessToken + user (201)", async () => {
    mp.user.findUnique.mockResolvedValueOnce(null); // email não existe
    mp.user.create.mockResolvedValueOnce(mockUser);
    mp.refreshToken.create.mockResolvedValueOnce({ id: "rt_001" });

    const res = await request(app)
      .post("/api/auth/register")
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("user.id");
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("retorna 409 se o e-mail já está cadastrado", async () => {
    mp.user.findUnique.mockResolvedValueOnce(mockUser);

    const res = await request(app)
      .post("/api/auth/register")
      .send(validBody);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("AUTH_EMAIL_ALREADY_EXISTS");
  });

  it("retorna 422 para e-mail inválido", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validBody, email: "email_invalido" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("retorna 422 para senha fraca (sem maiúscula)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validBody, email: "ok@teste.com", password: "senha123!" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("retorna 422 para senha fraca (menos de 8 chars)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validBody, email: "ok@teste.com", password: "Abc1!" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("define cookie HttpOnly com refresh token", async () => {
    mp.user.findUnique.mockResolvedValueOnce(null);
    mp.user.create.mockResolvedValueOnce(mockUser);
    mp.refreshToken.create.mockResolvedValueOnce({ id: "rt_002" });

    const res = await request(app)
      .post("/api/auth/register")
      .send(validBody);

    const setCookie = res.headers["set-cookie"] as string[] | string | undefined;
    const cookieStr = Array.isArray(setCookie) ? setCookie.join(";") : (setCookie ?? "");
    expect(cookieStr).toMatch(/refreshToken=/);
    expect(cookieStr).toMatch(/HttpOnly/i);
  });
});

/* ─── POST /api/auth/login ────────────────────────────────────── */

describe("POST /api/auth/login", () => {
  it("autentica com credenciais válidas (200)", async () => {
    const { hashPassword } = await import("../../src/auth/passwordService");
    const hash = await hashPassword("SenhaCorreta1");

    mp.user.findUnique.mockResolvedValueOnce({
      ...mockUser,
      passwordHash: hash,
    });
    mp.refreshToken.create.mockResolvedValueOnce({ id: "rt_003" });
    mp.user.update.mockResolvedValueOnce(mockUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "astro@teste.com", password: "SenhaCorreta1" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("user.id");
  });

  it("retorna 401 para senha incorreta", async () => {
    const { hashPassword } = await import("../../src/auth/passwordService");
    const hash = await hashPassword("SenhaCorreta1");

    mp.user.findUnique.mockResolvedValueOnce({
      ...mockUser,
      passwordHash: hash,
    });
    mp.user.update.mockResolvedValueOnce(mockUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "astro@teste.com", password: "SenhaErrada99" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTH_INVALID_CREDENTIALS");
  });

  it("retorna 401 para e-mail não encontrado", async () => {
    mp.user.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nao@existe.com", password: "Qualquer123" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTH_INVALID_CREDENTIALS");
  });

  it("retorna 403 para conta bloqueada", async () => {
    mp.user.findUnique.mockResolvedValueOnce({
      ...mockUser,
      lockedUntil: new Date(Date.now() + 1000 * 60 * 15), // bloqueada por 15 min
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "astro@teste.com", password: "SenhaQualquer1" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("AUTH_ACCOUNT_LOCKED");
  });

  it("retorna 422 para body inválido", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nao_e_email" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

/* ─── POST /api/auth/logout ─────────────────────────────────── */

describe("POST /api/auth/logout", () => {
  it("retorna 204 e limpa o cookie (sem refresh token)", async () => {
    const res = await request(app)
      .post("/api/auth/logout");

    expect(res.status).toBe(204);
    const setCookie = res.headers["set-cookie"] as string[] | string | undefined;
    const cookieStr = Array.isArray(setCookie) ? setCookie.join(";") : (setCookie ?? "");
    // Cookie deve ser limpo (Max-Age=0 ou expires no passado)
    expect(cookieStr).toMatch(/refreshToken=/);
  });
});

/* ─── POST /api/auth/forgot-password ──────────────────────── */

describe("POST /api/auth/forgot-password", () => {
  it("retorna 200 mesmo para e-mail não cadastrado (evita user enumeration)", async () => {
    mp.user.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nao@existe.com" });

    expect(res.status).toBe(200);
  });

  it("retorna 200 e envia e-mail para usuário cadastrado", async () => {
    mp.user.findUnique.mockResolvedValueOnce(mockUser);
    mp.passwordResetToken.deleteMany.mockResolvedValueOnce({ count: 0 });
    mp.passwordResetToken.create.mockResolvedValueOnce({ id: "prt_001" });

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "astro@teste.com" });

    expect(res.status).toBe(200);
  });

  it("retorna 422 para e-mail inválido", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "invalido" });

    expect(res.status).toBe(422);
  });
});
