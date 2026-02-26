/**
 * frontend/src/hooks/useCompatibility.ts
 *
 * Gerencia estado de loading/error para compatibilidade de signos e sinastria.
 */
import { useState, useEffect, useCallback } from "react";
import {
  getCompatibilityScore,
  postSynastry,
  type CompatibilityScore,
  type SynastryResult,
  type BirthData,
} from "@/services/compatibilityService";

/* ─── Hook: score de compatibilidade de signos ──────────────────────────── */

interface UseCompatibilityReturn {
  data:    CompatibilityScore | null;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

export function useCompatibility(
  sign1: string,
  sign2: string,
): UseCompatibilityReturn {
  const [data, setData]       = useState<CompatibilityScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!sign1 || !sign2) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await getCompatibilityScore(sign1, sign2);
      setData(result);
    } catch {
      setError("Não foi possível carregar o score de compatibilidade.");
    } finally {
      setLoading(false);
    }
  }, [sign1, sign2]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/* ─── Hook: sinastria ───────────────────────────────────────────────────── */

interface UseSynastryReturn {
  data:      SynastryResult | null;
  loading:   boolean;
  error:     string | null;
  calculate: (person1: BirthData, person2: BirthData) => Promise<void>;
}

export function useSynastry(): UseSynastryReturn {
  const [data, setData]       = useState<SynastryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const calculate = useCallback(
    async (person1: BirthData, person2: BirthData) => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const result = await postSynastry(person1, person2);
        setData(result);
      } catch {
        setError("Não foi possível calcular a sinastria. Verifique os dados e tente novamente.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { data, loading, error, calculate };
}
