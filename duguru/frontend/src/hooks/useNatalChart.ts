/**
 * frontend/src/hooks/useNatalChart.ts
 *
 * Hook que busca o mapa natal do usuario autenticado.
 * Nao usa react-query: usa useState + useEffect para simplicidade.
 */
import { useState, useEffect, useCallback } from "react";
import { fetchNatalChart, type NatalChartResult } from "../services/chartService";

interface UseNatalChartReturn {
  data:    NatalChartResult | null;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

export function useNatalChart(): UseNatalChartReturn {
  const [data,    setData]    = useState<NatalChartResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tick,    setTick]    = useState(0);

  const refetch = useCallback(() => { setTick((t) => t + 1); }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchNatalChart()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : "Erro ao buscar mapa natal";
          setError(msg);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [tick]);

  return { data, loading, error, refetch };
}
