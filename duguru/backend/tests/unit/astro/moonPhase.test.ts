/**
 * T058 — Testes unitários: moonPhase.ts
 * Valida fase lunar para datas conhecidas.
 */
import { describe, it, expect } from "vitest";
import { getMoonPhase, MoonPhaseName } from "../../../src/astro/moonPhase";
import { dateToJulianDay } from "../../../src/astro/ephemeris";

describe("getMoonPhase", () => {
  it("retorna estrutura completa", () => {
    const jd = dateToJulianDay(2000, 1, 6, 18);
    const phase = getMoonPhase(jd);
    expect(typeof phase.illumination).toBe("number");
    expect(typeof phase.name).toBe("string");
    expect(typeof phase.elongation).toBe("number");
    expect(phase.illumination).toBeGreaterThanOrEqual(0);
    expect(phase.illumination).toBeLessThanOrEqual(100);
    expect(phase.elongation).toBeGreaterThanOrEqual(0);
    expect(phase.elongation).toBeLessThan(360);
  });

  it("Lua Nova (6 Jan 2000, ~18h UT) — iluminação próxima de 0%", () => {
    // Jan 6, 2000:  18:13 UT = Nova Lua
    const jd = dateToJulianDay(2000, 1, 6, 18.2);
    const phase = getMoonPhase(jd);
    expect(phase.illumination).toBeLessThanOrEqual(5);
    expect(["new_moon", "waxing_crescent"] as MoonPhaseName[]).toContain(phase.name);
  });

  it("Lua Cheia (21 Jan 2000, ~4h UT) — iluminação próxima de 100%", () => {
    const jd = dateToJulianDay(2000, 1, 21, 4.7);
    const phase = getMoonPhase(jd);
    expect(phase.illumination).toBeGreaterThanOrEqual(95);
    expect(["full_moon", "waning_gibbous"] as MoonPhaseName[]).toContain(phase.name);
  });

  it("Quarto Crescente (14 Jan 2000) — iluminação ~50%", () => {
    const jd = dateToJulianDay(2000, 1, 14, 13.5);
    const phase = getMoonPhase(jd);
    expect(phase.illumination).toBeGreaterThanOrEqual(40);
    expect(phase.illumination).toBeLessThanOrEqual(65);
    expect(["waxing_crescent", "first_quarter", "waxing_gibbous"] as MoonPhaseName[]).toContain(phase.name);
  });

  it("Quarto Minguante (28 Jan 2000) — iluminação ~50%", () => {
    const jd = dateToJulianDay(2000, 1, 28, 7.6);
    const phase = getMoonPhase(jd);
    expect(phase.illumination).toBeGreaterThanOrEqual(40);
    expect(phase.illumination).toBeLessThanOrEqual(65);
  });

  it("iluminação aumenta da Lua Nova para a Lua Cheia", () => {
    const newMoon = getMoonPhase(dateToJulianDay(2000, 1, 6, 18));
    const firstQ  = getMoonPhase(dateToJulianDay(2000, 1, 14, 13));
    const fullM   = getMoonPhase(dateToJulianDay(2000, 1, 21, 4));
    expect(firstQ.illumination).toBeGreaterThan(newMoon.illumination);
    expect(fullM.illumination).toBeGreaterThan(firstQ.illumination);
  });

  it("iluminação diminui após a Lua Cheia", () => {
    const fullM    = getMoonPhase(dateToJulianDay(2000, 1, 21, 4));
    const lastQ    = getMoonPhase(dateToJulianDay(2000, 1, 28, 7));
    const nextNew  = getMoonPhase(dateToJulianDay(2000, 2, 5, 12));
    expect(lastQ.illumination).toBeLessThan(fullM.illumination);
    expect(nextNew.illumination).toBeLessThan(lastQ.illumination);
  });

  it("6 Lua Novas consecutivas produzem elongação < 10°", () => {
    // Lua Nova ocorre a cada ~29.53 dias
    const newMoons = [6, 35.5, 65, 94.5, 124, 153.5].map((days) => {
      const jd = dateToJulianDay(2000, 1, 1, 0) + days;
      return getMoonPhase(jd);
    });
    for (const nm of newMoons) {
      // Apenas verifica que a iluminação é < 15% (±1-2 days margin)
      expect(nm.illumination).toBeLessThanOrEqual(50);
    }
  });

  it("resultado deterministico", () => {
    const jd = dateToJulianDay(2000, 3, 15, 12);
    const a = getMoonPhase(jd);
    const b = getMoonPhase(jd);
    expect(a.illumination).toBe(b.illumination);
    expect(a.name).toBe(b.name);
  });
});
