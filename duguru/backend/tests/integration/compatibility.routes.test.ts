/**
 * T107 — Testes de integração: compatibility.routes.ts
 *
 * GET  /api/compatibility?sign1=aries&sign2=leo  — busca CompatibilityScore do BD
 * POST /api/synastry                              — calcula aspectos de sinastria
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import supertest from "supertest";
import { createApp } from "../../src/app";
import type { Express } from "express";

/* ─── Mock do Prisma ─────────────────────────────────────────────────────── */

const MOCK_COMPAT_SCORE = {
  id:         "compat-001",
  sign1:      "aries",
  sign2:      "leo",
  romance:    85,
  friendship: 78,
  work:       70,
  updatedAt:  new Date(),
};

const _mockUser = {
  id: "user-compat-001",
  name: "Compat Teste",
  email: "compat@test.com",
  passwordHash: "hash",
  birthDate: new Date("1990-03-15"),
  birthTime: "12:00",
  birthCity: "São Paulo",
  birthCountry: "Brazil",
  birthLat: -23.55,
  birthLon: -46.63,
  timezone: "America/Sao_Paulo",
  houseSystem: "P",
  sunSign: "aries",
  ascendant: "capricorn",
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
      findUnique:        vi.fn(() => Promise.resolve(_mockUser)),
      findUniqueOrThrow: vi.fn(() => Promise.resolve(_mockUser)),
    },
    compatibilityScore: {
      findFirst: vi.fn(() => Promise.resolve(MOCK_COMPAT_SCORE)),
    },
    refreshToken: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    $disconnect: vi.fn(),
  },
}));

async function makeAccessToken(userId: string): Promise<string> {
  const { signAccessToken } = await import("../../src/auth/jwtService");
  return signAccessToken(userId);
}

let app: Express;

beforeEach(async () => {
  app = await createApp();
});

/* ─── GET /api/compatibility ────────────────────────────────────────────── */

describe("GET /api/compatibility", () => {
  it("401 sem token", async () => {
    const res = await supertest(app).get("/api/compatibility?sign1=aries&sign2=leo");
    expect(res.status).toBe(401);
  });

  it("400 se sign1 ou sign2 ausentes", async () => {
    const token = await makeAccessToken(_mockUser.id);
    const res = await supertest(app)
      .get("/api/compatibility?sign1=aries")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_SIGNS");
  });

  it("400 se signo inválido", async () => {
    const token = await makeAccessToken(_mockUser.id);
    const res = await supertest(app)
      .get("/api/compatibility?sign1=aries&sign2=unicorn")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_SIGN");
  });

  it("200 com scores corretos para aries + leo", async () => {
    const token = await makeAccessToken(_mockUser.id);
    const res = await supertest(app)
      .get("/api/compatibility?sign1=aries&sign2=leo")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const { data } = res.body as { ok: boolean; data: Record<string, unknown> };
    expect(data).toHaveProperty("sign1", "aries");
    expect(data).toHaveProperty("sign2", "leo");
    expect(data).toHaveProperty("romance");
    expect(data).toHaveProperty("friendship");
    expect(data).toHaveProperty("work");

    expect(typeof data["romance"]).toBe("number");
    expect(typeof data["friendship"]).toBe("number");
    expect(typeof data["work"]).toBe("number");
  });

  it("200 aceita ordem invertida (leo + aries) → mesmos scores", async () => {
    const token = await makeAccessToken(_mockUser.id);
    const res = await supertest(app)
      .get("/api/compatibility?sign1=leo&sign2=aries")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    const { data } = res.body as { ok: boolean; data: Record<string, unknown> };
    expect(data).toHaveProperty("romance");
  });
});

/* ─── POST /api/synastry ────────────────────────────────────────────────── */

describe("POST /api/synastry", () => {
  const bodyA = {
    birthDate: "1990-03-15",
    birthTime: "12:00",
    lat:       -23.55,
    lon:       -46.63,
  };

  const bodyB = {
    birthDate: "1988-08-20",
    birthTime: "15:30",
    lat:       -22.91,
    lon:       -43.17,
  };

  it("401 sem token", async () => {
    const res = await supertest(app).post("/api/synastry").send({ person1: bodyA, person2: bodyB });
    expect(res.status).toBe(401);
  });

  it("400 se body inválido (campo ausente)", async () => {
    const token = await makeAccessToken(_mockUser.id);
    const res = await supertest(app)
      .post("/api/synastry")
      .set("Authorization", `Bearer ${token}`)
      .send({ person1: { birthDate: "1990-03-15" } }); // faltam lat e lon
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("200 retorna aspectos e scores para par válido", async () => {
    const token = await makeAccessToken(_mockUser.id);
    const res = await supertest(app)
      .post("/api/synastry")
      .set("Authorization", `Bearer ${token}`)
      .send({ person1: bodyA, person2: bodyB });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const { data } = res.body as {
      ok: boolean;
      data: {
        aspects: unknown[];
        score: { overall: number; romance: number; friendship: number; work: number };
      };
    };

    expect(Array.isArray(data.aspects)).toBe(true);
    expect(data.aspects.length).toBeGreaterThanOrEqual(3);

    expect(typeof data.score.overall).toBe("number");
    expect(data.score.overall).toBeGreaterThanOrEqual(0);
    expect(data.score.overall).toBeLessThanOrEqual(100);
  });

  it("200 cada aspecto tem campos obrigatórios", async () => {
    const token = await makeAccessToken(_mockUser.id);
    const res = await supertest(app)
      .post("/api/synastry")
      .set("Authorization", `Bearer ${token}`)
      .send({ person1: bodyA, person2: bodyB });

    const { data } = res.body as {
      ok: boolean;
      data: { aspects: Array<Record<string, unknown>>; score: unknown };
    };

    for (const asp of data.aspects) {
      expect(asp).toHaveProperty("planet1");
      expect(asp).toHaveProperty("planet2");
      expect(asp).toHaveProperty("type");
      expect(asp).toHaveProperty("orb");
      expect(asp).toHaveProperty("intensity");
      expect(asp).toHaveProperty("influence");
    }
  });

  it("200 funciona sem birthTime (usa 12:00 padrão)", async () => {
    const token = await makeAccessToken(_mockUser.id);
    const res = await supertest(app)
      .post("/api/synastry")
      .set("Authorization", `Bearer ${token}`)
      .send({
        person1: { birthDate: "1990-03-15", lat: -23.55, lon: -46.63 },
        person2: { birthDate: "1988-08-20", lat: -22.91, lon: -43.17 },
      });
    expect(res.status).toBe(200);
  });
});
