/**
 * frontend/src/components/chart/ChartTable.tsx
 *
 * Tabela de posicoes planetarias (planeta, signo, grau, casa, R).
 */
import { useTranslation } from "react-i18next";
import { useChartStore } from "../../stores/chartStore";
import { PLANET_GLYPHS, SIGN_GLYPHS, PLANET_COLORS } from "../../lib/zodiacSymbols";
import type { NatalChartResult } from "../../services/chartService";

interface Props {
  chart: NatalChartResult;
}

export function ChartTable({ chart }: Props) {
  const { t } = useTranslation("chart");
  const { selectedPlanet, selectPlanet } = useChartStore();

  return (
    <div className="overflow-x-auto rounded-lg bg-[var(--color-surface)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            <th className="px-3 py-2">{t("table.planet")}</th>
            <th className="px-3 py-2">{t("table.sign")}</th>
            <th className="px-3 py-2">{t("table.degree")}</th>
            <th className="px-3 py-2">{t("table.house")}</th>
            <th className="px-3 py-2 text-center">{t("table.retrograde")}</th>
          </tr>
        </thead>
        <tbody>
          {chart.planets.map((planet) => {
            const isSelected = selectedPlanet === planet.name;
            const color      = PLANET_COLORS[planet.name] ?? "#fff";
            return (
              <tr
                key={planet.name}
                onClick={() => {
                  selectPlanet(isSelected ? null : planet.name);
                }}
                className={[
                  "cursor-pointer border-b border-[var(--color-border)] transition-colors",
                  "hover:bg-[var(--color-border)]",
                  isSelected ? "bg-[var(--color-border)] font-semibold" : "",
                ].join(" ")}
              >
                {/* Planeta */}
                <td className="px-3 py-2">
                  <span className="mr-1" style={{ color }}>
                    {PLANET_GLYPHS[planet.name] ?? ""}
                  </span>
                  {t(`planet.${planet.name}`)}
                </td>
                {/* Signo */}
                <td className="px-3 py-2">
                  <span className="mr-1">{SIGN_GLYPHS[planet.sign] ?? ""}</span>
                  {t(`sign.${planet.sign}`)}
                </td>
                {/* Grau */}
                <td className="px-3 py-2 font-mono text-xs">
                  {planet.degree}°{String(planet.minute).padStart(2, "0")}′
                </td>
                {/* Casa */}
                <td className="px-3 py-2">{planet.house}</td>
                {/* Retrogrado */}
                <td className="px-3 py-2 text-center text-amber-400">
                  {planet.retrograde ? "℞" : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
