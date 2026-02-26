/**
 * frontend/src/pages/NatalChartPage.tsx
 *
 * Pagina do Mapa Natal: mandala SVG interativa + tabela de posicoes.
 */
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useNatalChart } from "../hooks/useNatalChart";
import { NatalChartWheel } from "../components/chart/NatalChartWheel";
import { ChartTable } from "../components/chart/ChartTable";
import { PlanetPanel } from "../components/chart/PlanetPanel";
import { HouseSystemSelector } from "../components/chart/HouseSystemSelector";
import { useChartStore } from "../stores/chartStore";

export default function NatalChartPage() {
  const { t } = useTranslation("chart");
  const { data, loading, error, refetch } = useNatalChart();
  const { houseSystem } = useChartStore();

  const handleSystemChange = (_system: string) => {
    // TODO: patch profile houseSystem via API, then refetch
    refetch();
  };

  return (
    <>
      <Helmet>
        <title>{t("title")} — duGuru</title>
      </Helmet>

      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* --- Cabecalho --------------------------------------------------- */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-[var(--color-headline)]">
            {t("title")}
          </h1>
          <HouseSystemSelector onChangeSystem={handleSystemChange} />
        </div>

        {/* --- Loading ------------------------------------------------------ */}
        {loading && (
          <div
            className="flex items-center justify-center py-20 text-[var(--color-text-muted)]"
            data-testid="chart-loading"
          >
            <span className="mr-2 animate-spin text-xl">✦</span>
            {t("loading")}
          </div>
        )}

        {/* --- Erro --------------------------------------------------------- */}
        {!loading && error && (
          <div
            className="rounded-lg border border-red-500/30 bg-red-900/20 p-4 text-red-400"
            data-testid="chart-error"
          >
            <p className="font-semibold">{t("error")}</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={refetch}
              className="mt-2 text-sm underline hover:no-underline"
            >
              {t("retry", { defaultValue: "Tentar novamente" })}
            </button>
          </div>
        )}

        {/* --- Conteudo ----------------------------------------------------- */}
        {!loading && !error && data && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            {/* Coluna esquerda: mandala */}
            <div className="space-y-4">
              <NatalChartWheel chart={data} />
            </div>

            {/* Coluna direita: painel de planeta + tabela */}
            <div className="space-y-4">
              <PlanetPanel chart={data} />
              <ChartTable chart={data} />
            </div>
          </div>
        )}

        {/* Indicador do sistema de casas em uso */}
        {data && (
          <p className="text-right text-xs text-[var(--color-text-muted)]">
            {t("houseSystem.label")}: {t(`houseSystem.${houseSystem}`)}
          </p>
        )}
      </div>
    </>
  );
}
