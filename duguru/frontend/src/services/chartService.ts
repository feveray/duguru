/**
 * frontend/src/services/chartService.ts
 *
 * Servico de mapa natal: chama GET /api/chart/natal no backend.
 */
import { api } from "./api";

/* --- Tipos espelhando o backend NatalChartResult ------------------------------ */

export type SignName =
  | "aries" | "taurus" | "gemini" | "cancer" | "leo" | "virgo"
  | "libra" | "scorpio" | "sagittarius" | "capricorn" | "aquarius" | "pisces";

export type PlanetName =
  | "sun" | "moon" | "mercury" | "venus" | "mars"
  | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto";

export type AspectType =
  | "conjunction" | "sextile" | "square" | "trine" | "quincunx" | "opposition";

export interface PlanetRow {
  name:       PlanetName;
  longitude:  number;
  latitude:   number;
  speed:      number;
  sign:       SignName;
  signIndex:  number;
  degree:     number;
  minute:     number;
  retrograde: boolean;
  house:      number;
}

export interface HouseData {
  cusps:     number[];
  ascendant: number;
  mc:        number;
}

export interface Aspect {
  planet1:  PlanetName;
  planet2:  PlanetName;
  type:     AspectType;
  angle:    number;
  orb:      number;
  applying: boolean;
}

export interface NatalChartResult {
  planets:         PlanetRow[];
  houses:          HouseData;
  aspects:         Aspect[];
  interpretations: {
    planetSign:  Record<string, string>;
    planetHouse: Record<string, string>;
  };
}

/* --- API ---------------------------------------------------------------------- */

export async function fetchNatalChart(): Promise<NatalChartResult> {
  const res = await api.get<{ ok: boolean; data: NatalChartResult }>("/chart/natal");
  return res.data.data;
}
