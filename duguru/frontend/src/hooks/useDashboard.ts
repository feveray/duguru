/**
 * frontend/src/hooks/useDashboard.ts
 *
 * Busca o conteúdo diário do dashboard via API e gerencia
 * estado de loading/error com invalidação ao mudar de dia.
 */
import { useState, useEffect, useCallback } from "react";
import { getDailyContent, type DailyContent } from "@/services/dashboardService";

interface UseDashboardReturn {
  data:    DailyContent | null;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData]       = useState<DailyContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const content = await getDailyContent();
      setData(content);
    } catch {
      setError("Não foi possível carregar o conteúdo do dia. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
