/**
 * backend/src/astro/moonPhase.ts
 *
 * Cálculo da fase lunar — PURO (zero I/O).
 * Baseia-se na elongação Sun→Moon (ângulo eclíptico).
 */
import { calcPlanet, dateToJulianDay } from "./ephemeris";

/* ─── Tipos ─────────────────────────────────────────────────────────────────── */

export type MoonPhaseName =
  | "new_moon"
  | "waxing_crescent"
  | "first_quarter"
  | "waxing_gibbous"
  | "full_moon"
  | "waning_gibbous"
  | "last_quarter"
  | "waning_crescent";

export interface MoonPhaseData {
  name:         MoonPhaseName;
  elongation:   number;   // 0–360° (ângulo Moon - Sun)
  illumination: number;   // 0–100% (percentual da face iluminada)
  /** JD da próxima Lua Nova */
  nextNewMoon:  number;
  /** JD da próxima Lua Cheia */
  nextFullMoon: number;
}

/* ─── Utilitários ───────────────────────────────────────────────────────────── */

function elongationToName(elong: number): MoonPhaseName {
  if (elong < 22.5)   return "new_moon";
  if (elong < 67.5)   return "waxing_crescent";
  if (elong < 112.5)  return "first_quarter";
  if (elong < 157.5)  return "waxing_gibbous";
  if (elong < 202.5)  return "full_moon";
  if (elong < 247.5)  return "waning_gibbous";
  if (elong < 292.5)  return "last_quarter";
  if (elong < 337.5)  return "waning_crescent";
  return "new_moon";
}

function elongationToIllumination(elong: number): number {
  // Fórmula de iluminação: I = (1 - cos(elong)) / 2 × 100
  const rad = (elong * Math.PI) / 180;
  return Math.round(((1 - Math.cos(rad)) / 2) * 100 * 10) / 10;
}

/**
 * Procura o JD mais próximo (após `jdStart`) em que a elongação passa por `target`.
 * Usa passo de 1 dia com bissecção final.
 */
function findNextPhase(jdStart: number, targetElong: number): number {
  const SUN_MOON_SYNODIC = 29.530588; // dias
  let jd = jdStart + 1;

  function getElong(j: number): number {
    const sun  = calcPlanet(j, "sun");
    const moon = calcPlanet(j, "moon");
    return ((moon.longitude - sun.longitude) + 360) % 360;
  }

  // Scan diário
  for (let step = 0; step < SUN_MOON_SYNODIC + 2; step++) {
    const e0 = getElong(jd);
    const e1 = getElong(jd + 1);

    // Detecta cruzamento do alvo (com wrap para 0°)
    const crossed =
      (e0 <= targetElong && e1 >= targetElong) ||
      (targetElong === 0 && e0 > 350 && e1 < 10);

    if (crossed) {
      // Bissecção para precisão de ~1 min
      let lo = jd, hi = jd + 1;
      for (let k = 0; k < 24; k++) {
        const mid = (lo + hi) / 2;
        const em  = getElong(mid);
        if (em < targetElong) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }
    jd += 1;
  }

  // Fallback: estimativa baseada em período sinódico
  return jdStart + SUN_MOON_SYNODIC;
}

/* ─── API pública ───────────────────────────────────────────────────────────── */

/**
 * Calcula dados da fase lunar para um dado JD (UT).
 * Puro: mesma entrada → mesma saída.
 */
export function getMoonPhase(jd: number): MoonPhaseData {
  const sun  = calcPlanet(jd, "sun");
  const moon = calcPlanet(jd, "moon");

  const elongation   = ((moon.longitude - sun.longitude) + 360) % 360;
  const illumination = elongationToIllumination(elongation);
  const name         = elongationToName(elongation);

  const nextNewMoon  = findNextPhase(jd, 0);
  const nextFullMoon = findNextPhase(jd, 180);

  return { name, elongation, illumination, nextNewMoon, nextFullMoon };
}

/**
 * Converte JD da próxima Lua em data legível (YYYY-MM-DD).
 */
export function julianDayToDateString(jd: number): string {
  // JD 2451545.0 = 2000-01-01 12:00 UT
  const UNIX_EPOCH_JD = 2440587.5;
  const msPerDay = 86400000;
  const date = new Date((jd - UNIX_EPOCH_JD) * msPerDay);
  return date.toISOString().substring(0, 10);
}

// Re-exporta dateToJulianDay para import conveniente
export { dateToJulianDay };
