/**
 * T094 — Teste de integração: horoscope.routes.ts
 * GET /api/horoscope/:period — day, week, month, year; 5 seções
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import supertest from "supertest";
import { createApp } from "../../src/app";
import type { Express } from "express";

/* ─── Mock do Prisma via factory ─────────────────────────────────────────── */
const _mockUserBase = {
  id: "user-horo-001",
  name: "Horo Teste",
  email: "horo@test.com",
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
  ascendant: "capricorn",
  avatarUrl: null,
  locale: "pt-BR",
  onboardingDone: false,
  lockedUntil: null,
  failedLoginAttempts: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

let _currentMockUser = { ..._mockUserBase };

vi.mock("../../src/db/client", () => ({
  prisma: {
    user: {
      findUnique:        vi.fn(() => Promise.resolve(_currentMockUser)),
      findUniqueOrThrow: vi.fn(() => Promise.resolve(_currentMockUser)),
      update:            vi.fn(),
    },
    natalChartCache: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert:     vi.fn(),
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
  _currentMockUser = { ..._mockUserBase };
  app = await createApp();
});

/* ─── Helper: verifica estrutura de 5 seções ─────────────────────────────── */
function expectHoroscopeShape(data: Record<string, unknown>) {
  expect(data).toHaveProperty("sign");
  expect(data).toHaveProperty("period");
  expect(data).toHaveProperty("date");
  expect(data).toHaveProperty("love");
  expect(data).toHaveProperty("work");
  expect(data).toHaveProperty("health");
  expect(data).toHaveProperty("finance");
  expect(data).toHaveProperty("advice");

  // Todas as seções devem ter conteúdo não-vazio
  for (const section of ["love", "work", "health", "finance", "advice"] as const) {
    expect(typeof data[section]).toBe("string");
    expect((data[section] as string).length).toBeGreaterThan(10);
  }
}

/* ─── Tests ──────────────────────────────────────────────────────────────── */
describe("GET /api/horoscope/:period", () => {
  it("401 sem token", async () => {
    const res = await supertest(app).get("/api/horoscope/day");
    expect(res.status).toBe(401);
  });

  it("400 com period inválido", async () => {
    const token = await makeAccessToken(_mockUserBase.id);
    const res = await supertest(app)
      .get("/api/horoscope/bimestre")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_PERIOD");
  });

  it("422 quando usuário sem signo solar", async () => {
    _currentMockUser = { ..._mockUserBase, sunSign: null as unknown as string, ascendant: null as unknown as string };
    const token = await makeAccessToken(_mockUserBase.id);
    const res = await supertest(app)
      .get("/api/horoscope/day")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("NO_SIGN");
  });

  for (const period of ["day", "week", "month", "year"] as const) {
    it(`200 GET /horoscope/${period} — 5 seções presentes`, async () => {
      const token = await makeAccessToken(_mockUserBase.id);
      const res = await supertest(app)
        .get(`/api/horoscope/${period}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      const data = res.body.data as Record<string, unknown>;
      expectHoroscopeShape(data);
      expect(data["period"]).toBe(period);
      expect(data["sign"]).toBe("pisces");
    });
  }

  it("200 ?useAscendant=true usa ascendant quando disponível", async () => {
    const token = await makeAccessToken(_mockUserBase.id);
    const res = await supertest(app)
      .get("/api/horoscope/day?useAscendant=true")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const data = res.body.data as Record<string, unknown>;
    expect(data["sign"]).toBe("capricorn");
  });

  it("200 ?useAscendant=true usa sunSign quando ascendant é null", async () => {
    _currentMockUser = { ..._mockUserBase, ascendant: null as unknown as string };
    const token = await makeAccessToken(_mockUserBase.id);
    const res = await supertest(app)
      .get("/api/horoscope/day?useAscendant=true")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const data = res.body.data as Record<string, unknown>;
    expect(data["sign"]).toBe("pisces");
  });
});
