/**
 * frontend/src/hooks/useHoroscope.ts  — T102
 *
 * Busca o horóscopo personalizado via API e gerencia
 * estado de loading/error com cache por período.
 */
import { useState, useEffect, useCallback } from "react";
import {
  getHoroscope,
  type HoroscopePeriod,
  type HoroscopeResult,
} from "@/services/horoscopeService";

interface UseHoroscopeReturn {
  data:           HoroscopeResult | null;
  loading:        boolean;
  error:          string | null;
  refetch:        () => void;
}

export function useHoroscope(
  period: HoroscopePeriod,
  useAscendant: boolean,
): UseHoroscopeReturn {
  const [data, setData]       = useState<HoroscopeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await getHoroscope(period, useAscendant);
      setData(result);
    } catch {
      setError("Não foi possível carregar o horóscopo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [period, useAscendant]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
