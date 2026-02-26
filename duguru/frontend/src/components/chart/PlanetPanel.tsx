/**
 * frontend/src/components/chart/PlanetPanel.tsx
 *
 * Painel lateral com detalhes do planeta selecionado e seus aspectos.
 */
import { useTranslation } from "react-i18next";
import { useChartStore } from "../../stores/chartStore";
import { PLANET_GLYPHS, SIGN_GLYPHS, PLANET_COLORS } from "../../lib/zodiacSymbols";
import type { NatalChartResult, PlanetRow } from "../../services/chartService";

interface Props {
  chart: NatalChartResult;
}

export function PlanetPanel({ chart }: Props) {
  const { t } = useTranslation("chart");
  const { selectedPlanet, selectPlanet } = useChartStore();

  const planet: PlanetRow | undefined = chart.planets.find(
    (p) => p.name === selectedPlanet,
  );

  if (!planet) {
    return (
      <div className="rounded-lg bg-[var(--color-surface)] p-4 text-center text-sm text-[var(--color-text-muted)]">
        {t("selectPlanetHint", "Clique em um planeta para ver seus detalhes.")}
      </div>
    );
  }

  const glyph    = PLANET_GLYPHS[planet.name] ?? "?";
  const signGlyph = SIGN_GLYPHS[planet.sign] ?? "";
  const color    = PLANET_COLORS[planet.name] ?? "#fff";

  const relevantAspects = chart.aspects.filter(
    (a) => a.planet1 === planet.name || a.planet2 === planet.name,
  );

  const interpretation =
    chart.interpretations.planetSign[planet.name] ?? "";

  return (
    <div className="rounded-lg bg-[var(--color-surface)] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" style={{ color }}>{glyph}</span>
          <div>
            <div className="font-semibold text-[var(--color-headline)]">
              {t(`planets.${planet.name}`)}
              {planet.retrograde && (
                <span className="ml-1 text-xs text-amber-400">℞</span>
              )}
            </div>
            <div className="text-sm text-[var(--color-text-muted)]">
              {signGlyph} {t(`signs.${planet.sign}`)}{" "}
              {planet.degree}°{String(planet.minute).padStart(2, "0")}′
              &nbsp;— {t("table.house")} {planet.house}
            </div>
          </div>
        </div>
        <button
          onClick={() => { selectPlanet(null); }}
          className="text-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          aria-label="Fechar painel"
        >
          ×
        </button>
      </div>

      {/* Interpretacao */}
      {interpretation && (
        <p className="text-sm text-[var(--color-text)] leading-relaxed">
          {interpretation}
        </p>
      )}

      {/* Aspectos do planeta */}
      {relevantAspects.length > 0 && (
        <div>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
            {t("aspectsLabel", "Aspectos")}
          </h3>
          <ul className="space-y-1">
            {relevantAspects.map((asp, i) => {
              const other = asp.planet1 === planet.name ? asp.planet2 : asp.planet1;
              return (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-20 text-[var(--color-text-muted)]">
                    {t(`aspect.${asp.type}`)}
                  </span>
                  <span>{PLANET_GLYPHS[other] ?? other}</span>
                  <span className="text-[var(--color-text)]">
                    {t(`planets.${other}`)}
                  </span>
                  <span className="ml-auto text-xs text-[var(--color-text-muted)]">
                    {asp.orb.toFixed(1)}° {asp.applying ? "A" : "S"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
