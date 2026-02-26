/**
 * frontend/src/services/horoscopeService.ts  — T102
 *
 * Serviço de API para o horóscopo personalizado.
 */
import { api } from "./api";

export type HoroscopePeriod = "day" | "week" | "month" | "year";

export interface HoroscopeResult {
  sign:    string;
  period:  HoroscopePeriod;
  date:    string;
  love:    string;
  work:    string;
  health:  string;
  finance: string;
  advice:  string;
}

export async function getHoroscope(
  period: HoroscopePeriod,
  useAscendant = false,
): Promise<HoroscopeResult> {
  const params = useAscendant ? "?useAscendant=true" : "";
  const res = await api.get<{ ok: boolean; data: HoroscopeResult }>(
    `/horoscope/${period}${params}`,
  );
  return res.data.data;
}
