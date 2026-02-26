/**
 * T057 — Testes unitários: módulo ephemeris (Swiss Ephemeris wrapper)
 *
 * Regras:
 * - 100% puro — nenhum I/O, nenhum mock
 * - Tolerância posicional < 1° para posições aproximadas conhecidas
 * - Tolerância de consistência = 0 (mesma entrada → mesma saída exata)
 */
import { describe, it, expect } from "vitest";
import {
  dateToJulianDay,
  calcPlanet,
  calcHouses,
  calcAspects,
  getPlanetHouse,
  PLANET_IDS,
  SIGN_NAMES,
} from "../../../src/astro/ephemeris";

/* ─── Datas de referência ──────────────────────────────────────────────────── */
// J2000.0 = 1 Jan 2000 12:00 UT ≈ JD 2451545.0
const JD_J2000 = dateToJulianDay(2000, 1, 1, 12);
// Solstício de verão 2000 ≈ 21 Jun 2000 01:48 UT
const JD_SOLSTICE = dateToJulianDay(2000, 6, 21, 2);
// Equinócio de primavera 2000 ≈ 20 Mar 2000 07:35 UT
const JD_EQUINOX = dateToJulianDay(2000, 3, 20, 7.6);

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
const TOL = 1.0; // 1° de tolerância para fixtures aproximadas

function expectLonClose(actual: number, expected: number, tolerance = TOL) {
  // Diferença mínima em círculo
  const diff = Math.abs(((actual - expected + 540) % 360) - 180);
  expect(diff).toBeLessThanOrEqual(tolerance);
}

/* ─── dateToJulianDay ────────────────────────────────────────────────────────── */
describe("dateToJulianDay", () => {
  it("J2000.0 deve retornar ~2451545.0", () => {
    expect(JD_J2000).toBeCloseTo(2451545.0, 1);
  });

  it("valores monotonicamente crescentes para datas crescentes", () => {
    expect(JD_SOLSTICE).toBeGreaterThan(JD_J2000);
    expect(JD_EQUINOX).toBeGreaterThan(JD_J2000);
    expect(JD_SOLSTICE).toBeGreaterThan(JD_EQUINOX);
  });
});

/* ─── calcPlanet ─────────────────────────────────────────────────────────────── */
describe("calcPlanet", () => {
  it("retorna estrutura completa para o Sol em J2000.0", () => {
    const sun = calcPlanet(JD_J2000, "sun");
    expect(sun.name).toBe("sun");
    expect(typeof sun.longitude).toBe("number");
    expect(typeof sun.latitude).toBe("number");
    expect(typeof sun.speed).toBe("number");
    expect(typeof sun.retrograde).toBe("boolean");
    expect(sun.longitude).toBeGreaterThanOrEqual(0);
    expect(sun.longitude).toBeLessThan(360);
    expect(sun.sign).toBeDefined();
    expect(sun.signIndex).toBeGreaterThanOrEqual(0);
    expect(sun.signIndex).toBeLessThanOrEqual(11);
    expect(sun.degree).toBeGreaterThanOrEqual(0);
    expect(sun.degree).toBeLessThan(30);
  });

  it("Sol deve estar em Capricórnio em 1 Jan 2000 (~280°)", () => {
    const sun = calcPlanet(JD_J2000, "sun");
    expectLonClose(sun.longitude, 280.46);
    expect(sun.sign).toBe("capricorn");
  });

  it("Sol deve estar em Câncer no solstício de verão (~90°)", () => {
    const sun = calcPlanet(JD_SOLSTICE, "sun");
    expect(sun.sign).toBe("cancer");
    expect(sun.longitude).toBeGreaterThanOrEqual(88);
    expect(sun.longitude).toBeLessThanOrEqual(92);
  });

  it("Sol deve estar próximo de 0° Áries no equinócio de primavera", () => {
    const sun = calcPlanet(JD_EQUINOX, "sun");
    expect(sun.sign).toBe("aries");
    expect(sun.degree).toBeLessThanOrEqual(5);
  });

  it("Lua em J2000.0 (~218°, Escorpião)", () => {
    const moon = calcPlanet(JD_J2000, "moon");
    expectLonClose(moon.longitude, 218.3);
    expect(moon.sign).toBe("scorpio");
    expect(moon.retrograde).toBe(false); // A Lua nunca é retrógrada
  });

  it("calcula os 10 planetas sem erro", () => {
    const planetKeys = Object.keys(PLANET_IDS) as (keyof typeof PLANET_IDS)[];
    for (const key of planetKeys) {
      const planet = calcPlanet(JD_J2000, key);
      expect(planet.longitude).toBeGreaterThanOrEqual(0);
      expect(planet.longitude).toBeLessThan(360);
    }
  });

  it("resultado deterministico — mesma entrada retorna mesma saída", () => {
    const a = calcPlanet(JD_J2000, "sun");
    const b = calcPlanet(JD_J2000, "sun");
    expect(a.longitude).toBe(b.longitude);
    expect(a.latitude).toBe(b.latitude);
  });

  it("signo calculado a partir da longitude é consistente", () => {
    const planets = (Object.keys(PLANET_IDS) as (keyof typeof PLANET_IDS)[]).map((k) =>
      calcPlanet(JD_J2000, k),
    );
    for (const p of planets) {
      const expectedSignIndex = Math.floor(p.longitude / 30);
      expect(p.signIndex).toBe(expectedSignIndex);
      expect(p.sign).toBe(SIGN_NAMES[expectedSignIndex]);
    }
  });

  it("velocidade negativa indica retrogradação", () => {
    // Pluto frequentemente retrógrado — teste com data conhecida
    // 1 Aug 2000: Plutão estava retrógrado
    const jd = dateToJulianDay(2000, 8, 1, 12);
    const pluto = calcPlanet(jd, "pluto");
    if (pluto.retrograde) {
      expect(pluto.speed).toBeLessThan(0);
    } else {
      expect(pluto.speed).toBeGreaterThanOrEqual(0);
    }
  });
});

/* ─── calcHouses ─────────────────────────────────────────────────────────────── */
describe("calcHouses", () => {
  // Local: São Paulo, lat=-23.55, lon=-46.63
  const LAT = -23.55;
  const LON = -46.63;

  it("retorna 12 cúspides de casas para Placidus", () => {
    const houses = calcHouses(JD_J2000, LAT, LON, "P");
    expect(houses.cusps.length).toBe(12);
    for (const cusp of houses.cusps) {
      expect(cusp).toBeGreaterThanOrEqual(0);
      expect(cusp).toBeLessThan(360);
    }
  });

  it("retorna ascendante (ASC) e meio-do-céu (MC)", () => {
    const houses = calcHouses(JD_J2000, LAT, LON, "P");
    expect(houses.ascendant).toBeGreaterThanOrEqual(0);
    expect(houses.ascendant).toBeLessThan(360);
    expect(houses.mc).toBeGreaterThanOrEqual(0);
    expect(houses.mc).toBeLessThan(360);
  });

  it("sistema Whole Sign — cúspide 1 = ASC truncado ao início do signo", () => {
    const houses = calcHouses(JD_J2000, LAT, LON, "W");
    // No Whole Sign, cada casa = 30° exato
    expect((houses.cusps[1]! - houses.cusps[0]! + 360) % 360).toBeCloseTo(30, 0);
  });

  it("resultado deterministico", () => {
    const a = calcHouses(JD_J2000, LAT, LON, "P");
    const b = calcHouses(JD_J2000, LAT, LON, "P");
    expect(a.ascendant).toBe(b.ascendant);
  });
});

/* ─── getPlanetHouse ─────────────────────────────────────────────────────────── */
describe("getPlanetHouse", () => {
  it("planeta na cusp 1 está na casa 1", () => {
    const cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    expect(getPlanetHouse(15, cusps)).toBe(1);
  });

  it("planeta próximo de 360° com wrap está na casa 12", () => {
    const cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    expect(getPlanetHouse(340, cusps)).toBe(12);
  });

  it("retorna valor entre 1 e 12 para qualquer longitude", () => {
    const cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    for (let lon = 0; lon < 360; lon += 7) {
      const house = getPlanetHouse(lon, cusps);
      expect(house).toBeGreaterThanOrEqual(1);
      expect(house).toBeLessThanOrEqual(12);
    }
  });
});

/* ─── calcAspects ─────────────────────────────────────────────────────────────── */
describe("calcAspects", () => {
  it("retorna array de aspectos", () => {
    const planets = (Object.keys(PLANET_IDS) as (keyof typeof PLANET_IDS)[]).map((k) =>
      calcPlanet(JD_J2000, k),
    );
    const aspects = calcAspects(planets);
    expect(Array.isArray(aspects)).toBe(true);
  });

  it("aspectos têm estrutura correta", () => {
    const planets = (Object.keys(PLANET_IDS) as (keyof typeof PLANET_IDS)[]).map((k) =>
      calcPlanet(JD_J2000, k),
    );
    const aspects = calcAspects(planets);
    for (const asp of aspects) {
      expect(typeof asp.planet1).toBe("string");
      expect(typeof asp.planet2).toBe("string");
      expect(["conjunction", "sextile", "square", "trine", "quincunx", "opposition"]).toContain(asp.type);
      expect(asp.orb).toBeGreaterThanOrEqual(0);
      expect(typeof asp.applying).toBe("boolean");
    }
  });

  it("conjunção detectada para planetas com mesma longitude", () => {
    const fakePlanets = [
      { name: "sun" as const, longitude: 100, latitude: 0, speed: 1, sign: "cancer" as const, signIndex: 3, degree: 10, minute: 0, retrograde: false },
      { name: "moon" as const, longitude: 103, latitude: 0, speed: 13, sign: "cancer" as const, signIndex: 3, degree: 13, minute: 0, retrograde: false },
    ];
    const aspects = calcAspects(fakePlanets);
    expect(aspects.some((a) => a.type === "conjunction")).toBe(true);
  });

  it("oposição detectada para planetas a 180°", () => {
    const fakePlanets = [
      { name: "sun" as const, longitude: 0, latitude: 0, speed: 1, sign: "aries" as const, signIndex: 0, degree: 0, minute: 0, retrograde: false },
      { name: "moon" as const, longitude: 180, latitude: 0, speed: 13, sign: "libra" as const, signIndex: 6, degree: 0, minute: 0, retrograde: false },
    ];
    const aspects = calcAspects(fakePlanets);
    expect(aspects.some((a) => a.type === "opposition")).toBe(true);
  });
});
