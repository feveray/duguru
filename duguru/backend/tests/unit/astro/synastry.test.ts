/**
 * T060 + T106 — Testes unitários: synastry.ts
 * Valida aspectos entre dois mapas natais.
 * T106: orbes diferenciados (8°/6°/4°), campo intensity, calcSynastryScore.
 */
import { describe, it, expect } from "vitest";
import { calcSynastryAspects, calcSynastryScore } from "../../../src/astro/synastry";
import { calcPlanet, dateToJulianDay, PLANET_IDS } from "../../../src/astro/ephemeris";

const JD_A = dateToJulianDay(1990, 3, 15, 12); // Mapa A
const JD_B = dateToJulianDay(1988, 8, 20, 12); // Mapa B

function getPlanets(jd: number) {
  return (Object.keys(PLANET_IDS) as (keyof typeof PLANET_IDS)[]).map((k) =>
    calcPlanet(jd, k),
  );
}

/* Helper: posição sintética */
function makePos(name: string, lon: number) {
  return {
    name:       name as never,
    longitude:  lon,
    latitude:   0,
    speed:      1,
    sign:       "aries" as const,
    signIndex:  0,
    degree:     Math.floor(lon % 30),
    minute:     0,
    retrograde: false,
  };
}

describe("calcSynastryAspects", () => {
  it("retorna array de aspectos de sinastria", () => {
    const map1 = getPlanets(JD_A);
    const map2 = getPlanets(JD_B);
    const aspects = calcSynastryAspects(map1, map2);
    expect(Array.isArray(aspects)).toBe(true);
  });

  it("aspectos têm estrutura correta incluindo intensity e influence", () => {
    const map1 = getPlanets(JD_A);
    const map2 = getPlanets(JD_B);
    const aspects = calcSynastryAspects(map1, map2);
    for (const asp of aspects) {
      expect(typeof asp.planet1).toBe("string");
      expect(typeof asp.planet2).toBe("string");
      expect(typeof asp.orb).toBe("number");
      expect(asp.orb).toBeGreaterThanOrEqual(0);
      expect(["conjunction","sextile","square","trine","quincunx","opposition"]).toContain(asp.type);
      expect(typeof asp.intensity).toBe("number");
      expect(asp.intensity).toBeGreaterThanOrEqual(0);
      expect(asp.intensity).toBeLessThanOrEqual(100);
      expect(typeof asp.influence).toBe("string");
      expect(asp.influence.length).toBeGreaterThan(0);
    }
  });

  it("planetas com mesma longitude geram conjunção", () => {
    const type = "sun" as const;
    const pos = calcPlanet(JD_A, type);
    const map1 = [pos];
    // Posiciona planeta B a 2° de distância → dentro do orbe de conjunção (8°)
    const fakePos = { ...pos, name: "moon" as const, longitude: (pos.longitude + 2) % 360 };
    const map2 = [fakePos];
    const aspects = calcSynastryAspects(map1, map2);
    expect(aspects.some((a) => a.type === "conjunction")).toBe(true);
  });

  it("planetas a 180° geram oposição", () => {
    const pos1 = makePos("sun",  0);
    const pos2 = makePos("moon", 180);
    const aspects = calcSynastryAspects([pos1], [pos2]);
    expect(aspects.some((a) => a.type === "opposition")).toBe(true);
  });

  it("sem aspectos para planetas fora dos orbes", () => {
    const pos1 = makePos("sun",  0);
    // 45° não é um aspecto padrão dos 5 principais da sinastria
    const pos2 = makePos("moon", 45);
    const aspects = calcSynastryAspects([pos1], [pos2]);
    expect(aspects.length).toBe(0);
  });

  it("resultado determinístico", () => {
    const map1 = getPlanets(JD_A);
    const map2 = getPlanets(JD_B);
    const a = calcSynastryAspects(map1, map2);
    const b = calcSynastryAspects(map1, map2);
    expect(a.length).toBe(b.length);
  });

  // ── T106: orbes diferenciados 8°/6°/4° ───────────────────────────────────

  it("T106: Sol–Lua (luminários) aceita orbe até 8°", () => {
    const p1 = makePos("sun",  0);
    const p2 = makePos("moon", 7.5); // 7.5° de orbe — dentro de 8°
    const aspects = calcSynastryAspects([p1], [p2]);
    expect(aspects.some((a) => a.type === "conjunction")).toBe(true);
  });

  it("T106: Sol–Lua rejeita orbe acima de 8°", () => {
    const p1 = makePos("sun",  0);
    const p2 = makePos("moon", 9); // 9° além de 8° de orbe
    const aspects = calcSynastryAspects([p1], [p2]);
    expect(aspects.some((a) => a.type === "conjunction")).toBe(false);
  });

  it("T106: Mercúrio–Vênus (pessoais) aceita orbe até 6°", () => {
    const p1 = makePos("mercury", 0);
    const p2 = makePos("venus",   5.8); // 5.8° — dentro de 6°
    const aspects = calcSynastryAspects([p1], [p2]);
    expect(aspects.some((a) => a.type === "conjunction")).toBe(true);
  });

  it("T106: Mercúrio–Vênus rejeita orbe acima de 6°", () => {
    const p1 = makePos("mercury", 0);
    const p2 = makePos("venus",   6.5); // 6.5° além de 6° de orbe
    const aspects = calcSynastryAspects([p1], [p2]);
    expect(aspects.some((a) => a.type === "conjunction")).toBe(false);
  });

  it("T106: Júpiter–Saturno (transpessoais) aceita orbe até 4°", () => {
    const p1 = makePos("jupiter", 0);
    const p2 = makePos("saturn",  3.9); // 3.9° — dentro de 4°
    const aspects = calcSynastryAspects([p1], [p2]);
    expect(aspects.some((a) => a.type === "conjunction")).toBe(true);
  });

  it("T106: Júpiter–Saturno rejeita orbe acima de 4°", () => {
    const p1 = makePos("jupiter", 0);
    const p2 = makePos("saturn",  4.5); // 4.5° além de 4° de orbe
    const aspects = calcSynastryAspects([p1], [p2]);
    expect(aspects.some((a) => a.type === "conjunction")).toBe(false);
  });

  it("T106: par Sol (luminary) + Saturno (transpersonal) usa orbe 8° (max dos dois)", () => {
    const p1 = makePos("sun",    0);
    const p2 = makePos("saturn", 7.5); // Sol=8°, Saturno=4° → max=8° → deve aceitar
    const aspects = calcSynastryAspects([p1], [p2]);
    expect(aspects.some((a) => a.type === "conjunction")).toBe(true);
  });

  it("T106: intensity é 100 para orbe exato e diminui com orbe maior", () => {
    const p1 = makePos("sun",  0);
    const p2exact = makePos("moon", 0); // orbe 0 → intensity 100
    const p2far  = makePos("moon", 6); // orbe 6 → intensity menor

    const [exactAsp] = calcSynastryAspects([p1], [p2exact]);
    const [farAsp]   = calcSynastryAspects([p1], [p2far]);

    expect(exactAsp?.intensity).toBe(100);
    expect((farAsp?.intensity ?? 0)).toBeLessThan(100);
  });

  it("T106: fixture Mapa A (1990-03-15) e Mapa B (1988-08-20) — ao menos 3 aspectos", () => {
    const map1 = getPlanets(JD_A);
    const map2 = getPlanets(JD_B);
    const aspects = calcSynastryAspects(map1, map2);
    expect(aspects.length).toBeGreaterThanOrEqual(3);
  });
});

describe("calcSynastryScore — T106", () => {
  it("retorna scores 0–100 para campos overall, romance, friendship, work", () => {
    const map1 = getPlanets(JD_A);
    const map2 = getPlanets(JD_B);
    const aspects = calcSynastryAspects(map1, map2);
    const score   = calcSynastryScore(aspects);

    for (const key of ["overall", "romance", "friendship", "work"] as const) {
      expect(score[key]).toBeGreaterThanOrEqual(0);
      expect(score[key]).toBeLessThanOrEqual(100);
    }
  });

  it("retorna 50 para aspect list vazia", () => {
    const score = calcSynastryScore([]);
    expect(score.overall).toBe(50);
    expect(score.romance).toBe(50);
    expect(score.friendship).toBe(50);
    expect(score.work).toBe(50);
  });

  it("aspectos harmônicos geram score maior que 50", () => {
    const p1 = makePos("sun",  0);
    const p2 = makePos("moon", 120); // trígono — aspecto harmônico
    const aspects = calcSynastryAspects([p1], [p2]);
    const score   = calcSynastryScore(aspects);
    expect(score.overall).toBeGreaterThan(50);
  });

  it("aspectos desafiadores geram score menor que 75", () => {
    const p1 = makePos("sun",  0);
    const p2 = makePos("moon", 90); // quadratura — aspecto desafiador
    const aspects = calcSynastryAspects([p1], [p2]);
    const score   = calcSynastryScore(aspects);
    expect(score.overall).toBeLessThan(75);
  });

  it("resultado determinístico", () => {
    const map1 = getPlanets(JD_A);
    const map2 = getPlanets(JD_B);
    const aspects = calcSynastryAspects(map1, map2);
    const s1 = calcSynastryScore(aspects);
    const s2 = calcSynastryScore(aspects);
    expect(s1).toEqual(s2);
  });
});
