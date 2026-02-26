/**
 * T059 — Testes unitários: transits.ts
 * T093 — Complemento: validação de textos de transits-by-sign.json
 */
import { describe, it, expect } from "vitest";
import { getActiveTransits } from "../../../src/astro/transits";
import { calcPlanet, dateToJulianDay, PLANET_IDS, SIGN_NAMES } from "../../../src/astro/ephemeris";
import transitsBySign from "../../../src/astro/interpretations/transits-by-sign.json";
import { getHoroscope } from "../../../src/services/horoscopeService";

const JD_NOW = dateToJulianDay(2000, 6, 15, 12);
const JD_NATAL = dateToJulianDay(1990, 3, 15, 12);

function getPlanets(jd: number) {
  return (Object.keys(PLANET_IDS) as (keyof typeof PLANET_IDS)[]).map((k) =>
    calcPlanet(jd, k),
  );
}

describe("getActiveTransits", () => {
  it("retorna array de trânsitos", () => {
    const natalPositions = getPlanets(JD_NATAL);
    const transits = getActiveTransits(JD_NOW, natalPositions);
    expect(Array.isArray(transits)).toBe(true);
  });

  it("trânsitos têm estrutura correta", () => {
    const natalPositions = getPlanets(JD_NATAL);
    const transits = getActiveTransits(JD_NOW, natalPositions);
    for (const t of transits) {
      expect(typeof t.transitPlanet).toBe("string");
      expect(typeof t.natalPlanet).toBe("string");
      expect(typeof t.type).toBe("string");
      expect(typeof t.orb).toBe("number");
      expect(t.orb).toBeGreaterThanOrEqual(0);
    }
  });

  it("resultado deterministico", () => {
    const natalPositions = getPlanets(JD_NATAL);
    const a = getActiveTransits(JD_NOW, natalPositions);
    const b = getActiveTransits(JD_NOW, natalPositions);
    expect(a.length).toBe(b.length);
  });
});

/* ─── T093: transits-by-sign.json — validação de estrutura e seleção ─────── */

type TransitEntry = {
  love: string;
  work: string;
  health: string;
  finance: string;
  advice: string;
};
type TransitsBySign = Record<string, TransitEntry>;
const TRANSITS_DATA = transitsBySign as TransitsBySign;

const PLANET_NAMES = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"] as const;
const SECTIONS = ["love", "work", "health", "finance", "advice"] as const;

describe("transits-by-sign.json — estrutura", () => {
  it("contém exatamente 120 chaves (12 signos × 10 planetas)", () => {
    const keys = Object.keys(TRANSITS_DATA);
    expect(keys).toHaveLength(120);
  });

  it("todas as chaves seguem o padrão {signo}_{planeta}_transit", () => {
    for (const key of Object.keys(TRANSITS_DATA)) {
      // e.g. "aries_sun_transit"
      const parts = key.split("_");
      expect(parts.length).toBeGreaterThanOrEqual(3);
      expect(parts[parts.length - 1]).toBe("transit");
    }
  });

  it("cada entrada tem as 5 seções obrigatórias com texto não-vazio", () => {
    for (const [key, entry] of Object.entries(TRANSITS_DATA)) {
      for (const section of SECTIONS) {
        expect(entry[section], `${key}.${section} deve ser string não-vazia`)
          .toBeTypeOf("string");
        expect(entry[section].length, `${key}.${section} deve ter conteúdo`)
          .toBeGreaterThan(10);
      }
    }
  });

  it("cobre todos os 12 signos", () => {
    const signs = new Set<string>();
    for (const key of Object.keys(TRANSITS_DATA)) {
      const sign = key.split("_").slice(0, -2).join("_");
      signs.add(sign);
    }
    for (const sign of SIGN_NAMES) {
      expect(signs.has(sign), `Signo "${sign}" deve estar em transits-by-sign.json`).toBe(true);
    }
  });

  it("cobre todos os 10 planetas para aries", () => {
    for (const planet of PLANET_NAMES) {
      const key = `aries_${planet}_transit`;
      expect(TRANSITS_DATA[key], `Chave "${key}" deve existir`).toBeDefined();
    }
  });
});

/* ─── T093: getHoroscope — seleção de texto para signo/período ───────────── */

describe("getHoroscope — seleção de texto de transits-by-sign.json", () => {
  it("retorna HoroscopeResult com 5 seções para aries, periodo=day", async () => {
    const result = await getHoroscope("aries", "day", new Date("2000-06-15"));
    expect(result.sign).toBe("aries");
    expect(result.period).toBe("day");
    expect(result.date).toBe("2000-06-15");
    for (const section of SECTIONS) {
      expect(result[section]).toBeTypeOf("string");
      expect(result[section].length).toBeGreaterThan(10);
    }
  });

  it("retorna texto não-vazio mesmo quando nenhum planeta está no signo (fallback)", async () => {
    // "capricorn" em 2000-06-15: Saturno provavelmente não está neste signo
    const result = await getHoroscope("capricorn", "day", new Date("2000-06-15"));
    for (const section of SECTIONS) {
      expect(result[section].length).toBeGreaterThan(10);
    }
  });

  it("resultado cached é idêntico na segunda chamada", async () => {
    const ref = new Date("2000-06-15");
    const first  = await getHoroscope("taurus", "week", ref);
    const second = await getHoroscope("taurus", "week", ref);
    expect(first).toStrictEqual(second);
  });

  it("signos diferentes produzem conteúdo potencialmente diferente", async () => {
    const ref = new Date("2000-06-15");
    const aries  = await getHoroscope("aries",  "month", ref);
    const scorpio = await getHoroscope("scorpio", "month", ref);
    // Signos distintos; ao menos um campo deve diferir (ou ambos usam fallback diferente)
    const allSame = SECTIONS.every((s) => aries[s] === scorpio[s]);
    // Não necessariamente true que sejam diferentes (ambos podem cair em fallback idêntico),
    // mas os signos devem ser diferentes
    expect(aries.sign).toBe("aries");
    expect(scorpio.sign).toBe("scorpio");
    expect(allSame).toBe(false); // a menos que todos os campos caiam no mesmo fallback
  });
});
