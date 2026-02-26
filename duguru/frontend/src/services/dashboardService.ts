/**
 * frontend/src/services/dashboardService.ts
 *
 * Serviço de API para o dashboard (conteúdo diário).
 */
import { api } from "./api";

/* ─── Tipos ──────────────────────────────────────────────────────────────── */

export interface MoonPhaseData {
  name:         string;
  elongation:   number;
  illumination: number;
  nextNewMoon:  number;  // Julian Day
  nextFullMoon: number;  // Julian Day
}

export interface AstrologicalAlert {
  event:     string;
  startDate: string;
  endDate:   string;
  signs:     string[];
  tip:       string;
}

export interface CompatTop3Item {
  sign:       string;
  romance:    number;
  friendship: number;
  work:       number;
  summary:    string;
}

export interface DailyContent {
  date:               string;
  planet:             string;
  planetInfluence:    string;
  moonPhase:          MoonPhaseData;
  inspirationalQuote: string;
  alerts:             AstrologicalAlert[];
  compatTop3:         CompatTop3Item[];
}

/* ─── API ─────────────────────────────────────────────────────────────────── */

export async function getDailyContent(): Promise<DailyContent> {
  const res = await api.get<{ ok: boolean; data: DailyContent }>("/daily");
  return res.data.data;
}
