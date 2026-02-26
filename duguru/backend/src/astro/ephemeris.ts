/**
 * backend/src/astro/ephemeris.ts
 *
 * Wrapper PURO sobre o Swiss Ephemeris (sweph v2):
 * - ZERO I/O (usa efem. de Moshier embutidas, sem arquivos .se1 externos)
 * - 100% deterministico para o mesmo input
 * - Precisao Moshier: +-1 arc-minute para 600 AEC - 2400 EC
 *
 * API interna sweph v2:
 *   julday(y,m,d,h, SE_GREG_CAL) -> number (JD_UT)
 *   deltat(jd_ut)               -> number (Dt em dias)
 *   calc(jd_et, planet, flags)  -> { flag, data: [lon, lat, dist, lonSpd, ...] }
 *   houses(jd_ut, lat, lon,'P') -> { flag, data: { houses:[...12], points:[asc,mc,...] } }
 *   constants.SE_SUN ... SE_PLUTO, SEFLG_MOSEPH, SEFLG_SPEED, SE_GREG_CAL
 */
import { julday, deltat, calc, houses, constants } from "sweph";

/* --- Tipos publicos ------------------------------------------------------- */

export const SIGN_NAMES = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
] as const;

export type SignName = (typeof SIGN_NAMES)[number];

export const PLANET_IDS = {
  sun:     constants.SE_SUN,
  moon:    constants.SE_MOON,
  mercury: constants.SE_MERCURY,
  venus:   constants.SE_VENUS,
  mars:    constants.SE_MARS,
  jupiter: constants.SE_JUPITER,
  saturn:  constants.SE_SATURN,
  uranus:  constants.SE_URANUS,
  neptune: constants.SE_NEPTUNE,
  pluto:   constants.SE_PLUTO,
} as const;

export type PlanetName = keyof typeof PLANET_IDS;

export interface PlanetPosition {
  name:       PlanetName;
  longitude:  number;
  latitude:   number;
  speed:      number;
  sign:       SignName;
  signIndex:  number;
  degree:     number;
  minute:     number;
  retrograde: boolean;
}

export interface HouseData {
  cusps:     number[];
  ascendant: number;
  mc:        number;
}

export type AspectType =
  | "conjunction"
  | "sextile"
  | "square"
  | "trine"
  | "quincunx"
  | "opposition";

export interface Aspect {
  planet1:  PlanetName;
  planet2:  PlanetName;
  type:     AspectType;
  angle:    number;
  orb:      number;
  applying: boolean;
}

/* --- Definicoes de aspectos ----------------------------------------------- */

interface AspectDef { type: AspectType; angle: number; orb: number }

const ASPECT_DEFS: AspectDef[] = [
  { type: "conjunction", angle: 0,   orb: 8 },
  { type: "sextile",     angle: 60,  orb: 4 },
  { type: "square",      angle: 90,  orb: 6 },
  { type: "trine",       angle: 120, orb: 8 },
  { type: "quincunx",    angle: 150, orb: 3 },
  { type: "opposition",  angle: 180, orb: 8 },
];

const LUMINARIES = new Set<PlanetName>(["sun", "moon"]);
const CALC_FLAGS = constants.SEFLG_MOSEPH | constants.SEFLG_SPEED;

/* --- Utilitarios internos ------------------------------------------------- */

function angularDiff(lon1: number, lon2: number): number {
  const d = Math.abs(lon1 - lon2) % 360;
  return d > 180 ? 360 - d : d;
}

function longitudeToSign(lon: number) {
  const n         = ((lon % 360) + 360) % 360;
  const signIndex = Math.floor(n / 30);
  const inSign    = n - signIndex * 30;
  const degree    = Math.floor(inSign);
  const minute    = Math.floor((inSign - degree) * 60);
  return { sign: SIGN_NAMES[signIndex]!, signIndex, degree, minute };
}

function getOrbBonus(p1: PlanetName, p2: PlanetName): number {
  return LUMINARIES.has(p1) || LUMINARIES.has(p2) ? 2 : 0;
}

/* --- API publica ---------------------------------------------------------- */

/**
 * Converte data civil (UT) em Dia Juliano (JD_UT).
 */
export function dateToJulianDay(
  year: number,
  month: number,
  day: number,
  hour = 0,
): number {
  return julday(year, month, day, hour, constants.SE_GREG_CAL);
}

/**
 * Calcula a posicao de um planeta em JD_UT.
 * Converte JD_UT -> JD_ET internamente com deltat().
 * Puro: mesmo input -> mesma saida.
 */
export function calcPlanet(jd_ut: number, planet: PlanetName): PlanetPosition {
  const jd_et  = jd_ut + deltat(jd_ut);
  const id     = PLANET_IDS[planet];
  const result = calc(jd_et, id, CALC_FLAGS);
  const [rawLon,, , lonSpd] = result.data;
  const longitude = ((rawLon! % 360) + 360) % 360;
  return {
    name: planet,
    longitude,
    latitude:   result.data[1]!,
    speed:      lonSpd!,
    retrograde: lonSpd! < 0,
    ...longitudeToSign(longitude),
  };
}

/**
 * Calcula as 12 cuspides de casas, ASC e MC.
 */
export function calcHouses(
  jd_ut: number,
  lat: number,
  lon: number,
  hsys: "P" | "K" | "W" | "E" | "C",
): HouseData {
  const result = houses(jd_ut, lat, lon, hsys);
  const cusps  = [...result.data.houses].map((c) => ((c % 360) + 360) % 360);
  const asc    = ((result.data.points[0]! % 360) + 360) % 360;
  const mc     = ((result.data.points[1]! % 360) + 360) % 360;
  return { cusps, ascendant: asc, mc };
}

/**
 * Retorna o numero da casa (1-12) de uma longitude ecliptica.
 */
export function getPlanetHouse(lon: number, cusps: number[]): number {
  const n = ((lon % 360) + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const start = cusps[i]!;
    const end   = cusps[(i + 1) % 12]!;
    if (start < end) {
      if (n >= start && n < end) return i + 1;
    } else {
      if (n >= start || n < end) return i + 1;
    }
  }
  return 1;
}

/**
 * Calcula aspectos entre uma lista de posicoes planetarias.
 * Puro: sem I/O.
 */
export function calcAspects(planets: PlanetPosition[]): Aspect[] {
  const aspects: Aspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1   = planets[i]!;
      const p2   = planets[j]!;
      const diff = angularDiff(p1.longitude, p2.longitude);
      for (const def of ASPECT_DEFS) {
        const maxOrb = def.orb + getOrbBonus(p1.name, p2.name);
        const orb    = Math.abs(diff - def.angle);
        if (orb <= maxOrb) {
          const futP1     = p1.longitude + p1.speed * 0.01;
          const futP2     = p2.longitude + p2.speed * 0.01;
          const futureOrb = Math.abs(angularDiff(futP1, futP2) - def.angle);
          aspects.push({
            planet1:  p1.name,
            planet2:  p2.name,
            type:     def.type,
            angle:    def.angle,
            orb:      Math.round(orb * 100) / 100,
            applying: futureOrb < orb,
          });
        }
      }
    }
  }
  return aspects;
}
