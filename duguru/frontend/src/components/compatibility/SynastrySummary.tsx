/**
 * frontend/src/components/compatibility/SynastrySummary.tsx  — T112
 *
 * Lista de aspectos de sinastria entre dois mapas natais.
 * Cada item: planetas envolvidos + tipo de aspecto (ícone SVG inline) + orbe + influência.
 */
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import type { SynastryAspect } from "@/services/compatibilityService";

/* ─── Ícones de aspecto (SVG inline acessíveis) ──────────────────────────── */

const ASPECT_ICONS: Record<string, { symbol: string; label: string; color: string }> = {
  conjunction: { symbol: "☌",  label: "Conjunção",  color: "var(--color-headline)" },
  sextile:     { symbol: "⚹",  label: "Sextil",     color: "var(--color-tertiary)"  },
  trine:       { symbol: "△",  label: "Trígono",    color: "#4caf50" },
  square:      { symbol: "□",  label: "Quadratura", color: "var(--color-button)"    },
  opposition:  { symbol: "☍",  label: "Oposição",   color: "var(--color-secondary)" },
  quincunx:    { symbol: "⚻",  label: "Quincúncio", color: "var(--color-paragraph)" },
};

/* ─── Rótulos de planetas em pt-BR ──────────────────────────────────────── */

const PLANET_PT: Record<string, string> = {
  sun:     "Sol",
  moon:    "Lua",
  mercury: "Mercúrio",
  venus:   "Vênus",
  mars:    "Marte",
  jupiter: "Júpiter",
  saturn:  "Saturno",
  uranus:  "Urano",
  neptune: "Netuno",
  pluto:   "Plutão",
};

/* ─── Componente de aspecto individual ──────────────────────────────────── */

function AspectItem({ aspect, index }: { aspect: SynastryAspect; index: number }) {
  const icon       = ASPECT_ICONS[aspect.type] ?? ASPECT_ICONS.conjunction!;
  const planet1Pt  = PLANET_PT[aspect.planet1] ?? aspect.planet1;
  const planet2Pt  = PLANET_PT[aspect.planet2] ?? aspect.planet2;

  // Intensidade visual: quantos pontos iluminados (1–5)
  const intensityDots = Math.max(1, Math.round(aspect.intensity / 20));

  return (
    <motion.li
      key={`${aspect.planet1}-${aspect.planet2}-${aspect.type}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="flex items-start gap-3 rounded-xl border border-[var(--color-main)] bg-[var(--color-main)] p-3"
    >
      {/* Ícone do aspecto */}
      <span
        className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold"
        style={{ color: icon.color, background: `color-mix(in srgb, ${icon.color} 15%, transparent)` }}
        aria-label={icon.label}
        title={icon.label}
      >
        {icon.symbol}
      </span>

      {/* Conteúdo */}
      <div className="min-w-0 flex-1">
        {/* Planetas + tipo */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-semibold text-[var(--color-headline)]">
            {planet1Pt}
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: icon.color }}
          >
            {icon.symbol} {icon.label}
          </span>
          <span className="text-sm font-semibold text-[var(--color-headline)]">
            {planet2Pt}
          </span>
        </div>

        {/* Orbe e intensidade */}
        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-paragraph)]">
          <span>orbe {aspect.orb.toFixed(1)}°</span>
          <span aria-hidden="true">·</span>
          <span aria-label={`Intensidade ${aspect.intensity}%`}>
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{
                  background: i < intensityDots ? icon.color : "var(--color-paragraph)",
                  opacity:    i < intensityDots ? 0.9 : 0.2,
                  marginRight: "2px",
                }}
              />
            ))}
          </span>
          {aspect.applying && (
            <span className="rounded bg-[var(--color-tertiary)] px-1 py-0.5 text-[0.65rem] font-medium text-[var(--color-headline)]">
              aplicando
            </span>
          )}
        </div>

        {/* Influência resumida */}
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-paragraph)]">
          {aspect.influence}
        </p>
      </div>
    </motion.li>
  );
}

/* ─── SynastrySummary ────────────────────────────────────────────────────── */

interface SynastrySummaryProps {
  aspects: SynastryAspect[];
}

export function SynastrySummary({ aspects }: SynastrySummaryProps) {
  const { t } = useTranslation("compatibility");

  if (aspects.length === 0) {
    return (
      <p className="text-sm text-[var(--color-paragraph)]">
        {t("noAspects")}
      </p>
    );
  }

  // Ordena por intensidade (mais intenso primeiro)
  const sorted = [...aspects].sort((a, b) => b.intensity - a.intensity);

  return (
    <section aria-label={t("aspectsSection")}>
      <h2 className="mb-3 text-base font-semibold text-[var(--color-headline)]">
        {t("aspectsTitle")}
      </h2>
      <ul className="space-y-2" role="list">
        {sorted.map((asp, i) => (
          <AspectItem key={`${asp.planet1}-${asp.planet2}-${asp.type}-${i}`} aspect={asp} index={i} />
        ))}
      </ul>
    </section>
  );
}
