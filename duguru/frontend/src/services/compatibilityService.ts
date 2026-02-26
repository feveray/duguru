/**
 * frontend/src/services/compatibilityService.ts
 *
 * Serviço de API para compatibilidade e sinastria.
 */
import { api } from "./api";

/* ─── Tipos ──────────────────────────────────────────────────────────────── */

export interface CompatibilityScore {
  sign1:      string;
  sign2:      string;
  romance:    number;
  friendship: number;
  work:       number;
  updatedAt:  string;
}

export interface SynastryAspect {
  planet1:   string;
  planet2:   string;
  type:      "conjunction" | "sextile" | "square" | "trine" | "opposition" | "quincunx";
  orb:       number;
  applying:  boolean;
  intensity: number;
  influence: string;
}

export interface SynastryScore {
  overall:    number;
  romance:    number;
  friendship: number;
  work:       number;
}

export interface SynastryResult {
  aspects: SynastryAspect[];
  score:   SynastryScore;
  person1: { birthDate: string; birthTime: string; lat: number; lon: number };
  person2: { birthDate: string; birthTime: string; lat: number; lon: number };
}

export interface BirthData {
  birthDate: string; // "YYYY-MM-DD"
  birthTime?: string; // "HH:MM"
  lat: number;
  lon: number;
}

/* ─── API Calls ─────────────────────────────────────────────────────────── */

/** Busca score de compatibilidade entre dois signos (cache no Neon) */
export async function getCompatibilityScore(
  sign1: string,
  sign2: string,
): Promise<CompatibilityScore> {
  const res = await api.get<{ ok: boolean; data: CompatibilityScore }>(
    `/compatibility?sign1=${sign1}&sign2=${sign2}`,
  );
  return res.data.data;
}

/** Calcula aspectos de sinastria entre dois conjuntos de dados de nascimento */
export async function postSynastry(
  person1: BirthData,
  person2: BirthData,
): Promise<SynastryResult> {
  const res = await api.post<{ ok: boolean; data: SynastryResult }>(
    "/synastry",
    { person1, person2 },
  );
  return res.data.data;
}
