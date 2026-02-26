/**
 * T061 — Teste de integração: chart.routes.ts
 * GET /api/chart/natal — cache miss/hit, auth obrigatória
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import supertest from "supertest";
import { createApp } from "../../src/app";
import type { Express } from "express";

/* ─── Mock do Prisma (factory pattern — evita hoisting) ──────────────────── */
const mockUser = {
  id: "user-chart-001",
  name: "Astro Teste",
  email: "astro@test.com",
  passwordHash: "hash",
  birthDate: new Date("1990-03-15T12:00:00Z"),
  birthTime: "12:00",
  birthCity: "São Paulo",
  birthCountry: "Brazil",
  birthLat: -23.55,
  birthLon: -46.63,
  timezone: "America/Sao_Paulo",
  houseSystem: "P",
  sunSign: "pisces",
  ascendant: null,
  avatarUrl: null,
  locale: "pt-BR",
  onboardingDone: false,
  lockedUntil: null,
  failedLoginAttempts: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

vi.mock("../../src/db/client", () => ({
  prisma: {
    user: {
      findUnique:        vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update:            vi.fn(),
    },
    natalChartCache: {
      findUnique: vi.fn(),
      upsert:     vi.fn(),
      delete:     vi.fn(),
    },
    refreshToken: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    $disconnect: vi.fn(),
  },
}));

type MockPrisma = {
  user: { findUnique: ReturnType<typeof vi.fn>; findUniqueOrThrow: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  natalChartCache: { findUnique: ReturnType<typeof vi.fn>; upsert: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
  refreshToken: { findUnique: ReturnType<typeof vi.fn> };
};

/* ─── Helper: gera token de acesso válido ─────────────────────────────────── */
async function makeAccessToken(userId: string): Promise<string> {
  const { signAccessToken } = await import("../../src/auth/jwtService");
  return signAccessToken(userId);
}

let app: Express;
let mp: MockPrisma;

beforeAll(async () => {
  const { prisma } = await import("../../src/db/client");
  mp = prisma as unknown as MockPrisma;
  app = await createApp();
});

beforeEach(() => {
  vi.clearAllMocks();
});

/* ─── GET /api/chart/natal ──────────────────────────────────────────────────── */
describe("GET /api/chart/natal", () => {
  it("401 sem token de auth", async () => {
    const res = await supertest(app).get("/api/chart/natal");
    expect(res.status).toBe(401);
  });

  it("401 com token inválido", async () => {
    const res = await supertest(app)
      .get("/api/chart/natal")
      .set("Authorization", "Bearer token_invalido");
    expect(res.status).toBe(401);
  });

  it("200 com cache hit — retorna payload armazenado", async () => {
    mp.user.findUnique.mockResolvedValue(mockUser);
    mp.user.findUniqueOrThrow.mockResolvedValue(mockUser);

    const cachedPayload = {
      planets: [],
      houses: { cusps: [], ascendant: 0, mc: 0 },
      aspects: [],
      interpretations: { planetSign: {}, planetHouse: {} },
    };

    mp.natalChartCache.findUnique.mockResolvedValue({
      id: "cache-1",
      userId: mockUser.id,
      cacheKey: "1990-03-15:-23.55:-46.63:P",
      payload: cachedPayload,
      calculatedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000), // Válido por 24h
    });

    const token = await makeAccessToken(mockUser.id);
    const res = await supertest(app)
      .get("/api/chart/natal")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("planets");
    expect(res.body.data).toHaveProperty("houses");
    expect(res.body.data).toHaveProperty("aspects");
  });

  it("200 com cache miss — calcula e persiste", async () => {
    mp.user.findUnique.mockResolvedValue(mockUser);
    mp.user.findUniqueOrThrow.mockResolvedValue(mockUser);
    mp.natalChartCache.findUnique.mockResolvedValue(null); // Cache miss
    mp.natalChartCache.upsert.mockResolvedValue({});

    const token = await makeAccessToken(mockUser.id);
    const res = await supertest(app)
      .get("/api/chart/natal")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("planets");
    expect(Array.isArray(res.body.data.planets)).toBe(true);
    expect(res.body.data.planets.length).toBeGreaterThanOrEqual(10); // 10+ planetas
    expect(mp.natalChartCache.upsert).toHaveBeenCalledOnce();
  });

  it("200 com cache expirado — recalcula", async () => {
    mp.user.findUnique.mockResolvedValue(mockUser);
    mp.user.findUniqueOrThrow.mockResolvedValue(mockUser);
    mp.natalChartCache.findUnique.mockResolvedValue({
      id: "cache-old",
      userId: mockUser.id,
      cacheKey: "old-key",
      payload: { planets: [], houses: {}, aspects: [], interpretations: {} },
      calculatedAt: new Date(Date.now() - 86400000 * 2),
      expiresAt: new Date(Date.now() - 3600000), // Expirado há 1h
    });
    mp.natalChartCache.upsert.mockResolvedValue({});

    const token = await makeAccessToken(mockUser.id);
    const res = await supertest(app)
      .get("/api/chart/natal")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(mp.natalChartCache.upsert).toHaveBeenCalled();
  });

  it("resposta inclui interpretações de planeta-signo e planeta-casa", async () => {
    mp.user.findUnique.mockResolvedValue(mockUser);
    mp.user.findUniqueOrThrow.mockResolvedValue(mockUser);
    mp.natalChartCache.findUnique.mockResolvedValue(null);
    mp.natalChartCache.upsert.mockResolvedValue({});

    const token = await makeAccessToken(mockUser.id);
    const res = await supertest(app)
      .get("/api/chart/natal")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.interpretations).toBeDefined();
    expect(typeof res.body.data.interpretations.planetSign).toBe("object");
    expect(typeof res.body.data.interpretations.planetHouse).toBe("object");
  });
});
