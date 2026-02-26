/**
 * frontend/src/components/chart/NatalChartWheel.tsx
 *
 * Mandala SVG interativa do mapa natal.
 * Usa D3 para renderizacao — integrado ao React via ref no elemento <svg>.
 */
import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useChartStore } from "../../stores/chartStore";
import { drawNatalChart, CHART_SIZE } from "../../lib/svgChart";
import { useThemeStore } from "../../stores/themeStore";
import type { NatalChartResult, PlanetRow, Aspect } from "../../services/chartService";

interface Props {
  chart: NatalChartResult;
}

export function NatalChartWheel({ chart }: Props) {
  const { t } = useTranslation("chart");
  const svgRef         = useRef<SVGSVGElement>(null);
  const { selectedPlanet, selectPlanet, selectAspect } = useChartStore();
  const { theme } = useThemeStore();

  const handlePlanetClick = (planet: PlanetRow) => {
    selectPlanet(selectedPlanet === planet.name ? null : planet.name);
  };

  const handleAspectClick = (aspect: Aspect) => {
    selectAspect(`${aspect.planet1}-${aspect.planet2}-${aspect.type}`);
  };

  useEffect(() => {
    if (!svgRef.current) return;
    drawNatalChart(svgRef.current, {
      chart,
      selectedPlanet,
      onPlanetClick: handlePlanetClick,
      onAspectClick: handleAspectClick,
      theme: theme as "light" | "dark",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart, selectedPlanet, theme]);

  return (
    <div
      className="natal-chart-wheel mx-auto w-full max-w-[560px]"
      aria-label={t("wheelAriaLabel", "Mandala interativa do mapa natal")}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
        className="h-auto w-full"
        role="img"
        aria-label={t("wheelAriaLabel", "Mandala interativa do mapa natal")}
      />
    </div>
  );
}
