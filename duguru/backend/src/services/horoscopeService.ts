/**
 * backend/src/services/horoscopeService.ts  — T097
 *
 * getHoroscope(sign, period, ascendant?): HoroscopeResult
 *
 * Estratégia:
 *  1. Determina o intervalo de datas para o período (day/week/month/year).
 *  2. Calcula os planetas em trânsito que cruzam o signo no período via transits.ts.
 *  3. Seleciona textos de transits-by-sign.json para os planetas mais relevantes.
 *  4. Compõe as 5 seções (love, work, health, finance, advice).
 *  5. Cache em memória por 1 hora (Map com chave {sign}:{period}:{dateKey}).
 */

import {
  dateToJulianDay,
  calcPlanet,
  SIGN_NAMES,
  type PlanetName,
  type SignName,
} from "../astro/ephemeris";
import transitsBySign from "../astro/interpretations/transits-by-sign.json";

/* ─── Tipos públicos ─────────────────────────────────────────────────────── */

export type HoroscopePeriod = "day" | "week" | "month" | "year";

export interface HoroscopeSection {
  love:    string;
  work:    string;
  health:  string;
  finance: string;
  advice:  string;
}

export interface HoroscopeResult extends HoroscopeSection {
  sign:   string;
  period: HoroscopePeriod;
  date:   string;  // "YYYY-MM-DD" = data de referência (início do período)
}

/* ─── Cache em memória (TTL 1 hora) ─────────────────────────────────────── */

interface CacheEntry {
  result:    HoroscopeResult;
  expiresAt: number; // timestamp ms
}

const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

function getCached(key: string): HoroscopeResult | null {
  const entry = CACHE.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    CACHE.delete(key);
    return null;
  }
  return entry.result;
}

function setCache(key: string, result: HoroscopeResult): void {
  CACHE.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function dateToJD(date: Date): number {
  return dateToJulianDay(date.getFullYear(), date.getMonth() + 1, date.getDate(), 12);
}

/**
 * Retorna o start e end do período a partir de uma data de referência.
 */
function getPeriodRange(ref: Date, period: HoroscopePeriod): { start: Date; end: Date } {
  const start = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
  let end: Date;

  switch (period) {
    case "day":
      end = new Date(start);
      break;
    case "week": {
      // Segunda-feira da semana corrente
      const dow = start.getUTCDay() === 0 ? 6 : start.getUTCDay() - 1;
      start.setUTCDate(start.getUTCDate() - dow);
      end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 6);
      break;
    }
    case "month":
      start.setUTCDate(1);
      end = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 0));
      break;
    case "year":
      start.setUTCMonth(0, 1);
      end = new Date(Date.UTC(ref.getUTCFullYear(), 11, 31));
      break;
  }

  return { start, end };
}

type TransitsBySign = Record<string, { love: string; work: string; health: string; finance: string; advice: string }>;
const TRANSITS_DATA = transitsBySign as TransitsBySign;

/* Planetas prioritários (lentos têm mais impacto em trânsito) */
const PRIORITY_PLANETS: PlanetName[] = [
  "saturn", "jupiter", "mars", "pluto", "uranus", "neptune",
  "venus", "mercury", "sun", "moon",
];

/**
 * Obtém os planetas mais influentes para o signo no período.
 * Retorna uma lista de até 3 planetas (mais relevantes por posição e velocidade).
 */
function getKeyTransitPlanets(sign: SignName, jdStart: number, jdEnd: number): PlanetName[] {
  const signIndex = SIGN_NAMES.indexOf(sign);
  const selected: PlanetName[] = [];

  // Amostra 3 pontos ao longo do período
  const steps = 3;
  const jdStep = (jdEnd - jdStart) / (steps - 1) || 1;

  const inSignCounts = new Map<PlanetName, number>();

  for (let i = 0; i < steps; i++) {
    const jd = jdStart + i * jdStep;
    for (const planet of PRIORITY_PLANETS) {
      const pos = calcPlanet(jd, planet);
      if (pos.signIndex === signIndex) {
        inSignCounts.set(planet, (inSignCounts.get(planet) ?? 0) + 1);
      }
    }
  }

  // Planetas mais frequentes no signo ao longo do período
  const sorted = [...inSignCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [planet] of sorted.slice(0, 3)) {
    selected.push(planet);
  }

  // Fallback: se nenhum planeta está no signo, use os planetas lentos atuais
  if (selected.length === 0) {
    for (const planet of PRIORITY_PLANETS.slice(0, 3)) {
      selected.push(planet);
    }
  }

  return selected;
}

/**
 * Combina os textos de múltiplos planetas para cada seção.
 * Usa o primeiro planeta com texto disponível para body + complemento do segundo.
 */
function composeSections(sign: SignName, planets: PlanetName[]): HoroscopeSection {
  const sections: (keyof HoroscopeSection)[] = ["love", "work", "health", "finance", "advice"];
  const result: HoroscopeSection = { love: "", work: "", health: "", finance: "", advice: "" };

  for (const section of sections) {
    const texts: string[] = [];
    for (const planet of planets) {
      const key = `${sign}_${planet}_transit`;
      const entry = TRANSITS_DATA[key];
      if (entry?.[section]) {
        texts.push(entry[section]);
        if (texts.length >= 2) break; // máximo 2 planetas por seção
      }
    }

    if (texts.length >= 2) {
      // Combina os dois textos com encaixe sintático
      result[section] = texts[0]! + " " + texts[1]!;
    } else if (texts.length === 1) {
      result[section] = texts[0]!;
    } else {
      // Fallback genérico
      result[section] = `Período de reflexão e ajustes. As energias planetárias convidam ${sign} a revisar suas prioridades nesta área.`;
    }
  }

  return result;
}

/* ─── API pública ────────────────────────────────────────────────────────── */

export async function getHoroscope(
  sign: SignName,
  period: HoroscopePeriod,
  ref: Date = new Date(),
): Promise<HoroscopeResult> {
  const { start, end } = getPeriodRange(ref, period);
  const dateKey = start.toISOString().substring(0, 10);
  const cacheKey = `${sign}:${period}:${dateKey}`;

  // Verifica cache
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Calcula JDs do período
  const jdStart = dateToJD(start);
  const jdEnd   = dateToJD(end);

  // Obtém planetas-chave para o signo no período
  const keyPlanets = getKeyTransitPlanets(sign, jdStart, jdEnd);

  // Compõe seções
  const sections = composeSections(sign, keyPlanets);

  const result: HoroscopeResult = {
    ...sections,
    sign,
    period,
    date: dateKey,
  };

  setCache(cacheKey, result);
  return result;
}
