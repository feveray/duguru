/**
 * T081 — Teste de integração: dashboard.routes.ts
 * GET /api/daily — retorna planeta, fase lunar, frase, alertas, top3
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import supertest from "supertest";
import { createApp } from "../../src/app";
import type { Express } from "express";

/* ─── Mock do Prisma via factory (evita hoisting) ────────────────────────── */
vi.mock("../../src/db/client", () => {
  const mockUser = {
    id: "user-dash-001",
    name: "Dash Teste",
    email: "dash@test.com",
    passwordHash: "hash",
    birthDate: new Date("1990-03-15"),
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

  return {
    prisma: {
      user: {
        findUnique:         vi.fn().mockResolvedValue(mockUser),
        findUniqueOrThrow:  vi.fn().mockResolvedValue(mockUser),
        update:             vi.fn(),
      },
      dailyContent: {
        count:    vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        upsert:   vi.fn(),
      },
      compatibilityScore: {
        findMany: vi.fn().mockResolvedValue([
          { id: "c1", sign1: "pisces", sign2: "cancer",    romance: 88, friendship: 85, work: 75, updatedAt: new Date() },
          { id: "c2", sign1: "pisces", sign2: "scorpio",   romance: 90, friendship: 82, work: 70, updatedAt: new Date() },
          { id: "c3", sign1: "pisces", sign2: "capricorn", romance: 72, friendship: 78, work: 85, updatedAt: new Date() },
        ]),
      },
      natalChartCache: {
        findUnique: vi.fn(),
        upsert:     vi.fn(),
      },
      refreshToken: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      $disconnect: vi.fn(),
    },
  };
});

/* ─── Helper: token de acesso ─────────────────────────────────────────────── */
async function makeAccessToken(userId: string): Promise<string> {
  const { signAccessToken } = await import("../../src/auth/jwtService");
  return signAccessToken(userId);
}

let app: Express;

beforeEach(async () => {
  app = await createApp();
});

/* ─── GET /api/daily ──────────────────────────────────────────────────────── */
describe("GET /api/daily", () => {
  it("401 sem token de auth", async () => {
    const res = await supertest(app).get("/api/daily");
    expect(res.status).toBe(401);
  });

  it("401 com token inválido", async () => {
    const res = await supertest(app)
      .get("/api/daily")
      .set("Authorization", "Bearer token_invalido");
    expect(res.status).toBe(401);
  });

  it("200 retorna estrutura completa do dashboard", async () => {
    const token = await makeAccessToken("user-dash-001");

    const res = await supertest(app)
      .get("/api/daily")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const data = res.body.data as Record<string, unknown>;

    // Campos obrigatórios
    expect(data).toHaveProperty("date");
    expect(data).toHaveProperty("planet");
    expect(data).toHaveProperty("planetInfluence");
    expect(data).toHaveProperty("moonPhase");
    expect(data).toHaveProperty("inspirationalQuote");
    expect(data).toHaveProperty("alerts");
    expect(data).toHaveProperty("compatTop3");

    // Tipos
    expect(typeof data["date"]).toBe("string");
    expect(typeof data["planet"]).toBe("string");
    expect(typeof data["planetInfluence"]).toBe("string");
    expect(typeof data["inspirationalQuote"]).toBe("string");
    expect(Array.isArray(data["alerts"])).toBe(true);
    expect(Array.isArray(data["compatTop3"])).toBe(true);

    // data deve ser "YYYY-MM-DD"
    const dateStr = data["date"] as string;
    expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("200 moonPhase contém campos corretos", async () => {
    const token = await makeAccessToken("user-dash-001");

    const res = await supertest(app)
      .get("/api/daily")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    const moonPhase = res.body.data.moonPhase as Record<string, unknown>;
    expect(moonPhase).toHaveProperty("name");
    expect(moonPhase).toHaveProperty("illumination");
    expect(moonPhase).toHaveProperty("nextNewMoon");
    expect(moonPhase).toHaveProperty("nextFullMoon");

    // illumination deve estar entre 0 e 100
    const illum = moonPhase["illumination"] as number;
    expect(illum).toBeGreaterThanOrEqual(0);
    expect(illum).toBeLessThanOrEqual(100);
  });

  it("200 compatTop3 retorna até 3 signos", async () => {
    const token = await makeAccessToken("user-dash-001");

    const res = await supertest(app)
      .get("/api/daily")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    const compatTop3 = res.body.data.compatTop3 as Record<string, unknown>[];
    expect(compatTop3.length).toBeLessThanOrEqual(3);

    if (compatTop3.length > 0) {
      const first = compatTop3[0]!;
      expect(first).toHaveProperty("sign");
      expect(first).toHaveProperty("romance");
      expect(first).toHaveProperty("friendship");
      expect(first).toHaveProperty("work");
      expect(first).toHaveProperty("summary");
    }
  });

  it("200 frase do dia usa fallback quando banco vazio", async () => {
    const token = await makeAccessToken("user-dash-001");

    const res = await supertest(app)
      .get("/api/daily")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const quote = res.body.data.inspirationalQuote as string;
    expect(typeof quote).toBe("string");
    expect(quote.length).toBeGreaterThan(10);
  });
});

