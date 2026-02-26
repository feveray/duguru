/**
 * frontend/src/components/dashboard/MoonPhase.tsx  — T089
 *
 * Card da fase lunar: imagem/emoji, nome, porcentagem de iluminação.
 * Ao expandir: data do próximo ciclo + dica prática.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/Skeleton";
import type { MoonPhaseData } from "@/services/dashboardService";

/* Emoji / símbolo por fase */
const PHASE_EMOJI: Record<string, string> = {
  new_moon:        "🌑",
  waxing_crescent: "🌒",
  first_quarter:   "🌓",
  waxing_gibbous:  "🌔",
  full_moon:       "🌕",
  waning_gibbous:  "🌖",
  last_quarter:    "🌗",
  waning_crescent: "🌘",
};

const PHASE_NAME_PT: Record<string, string> = {
  new_moon:        "Lua Nova",
  waxing_crescent: "Lua Crescente",
  first_quarter:   "Quarto Crescente",
  waxing_gibbous:  "Gibosa Crescente",
  full_moon:       "Lua Cheia",
  waning_gibbous:  "Gibosa Minguante",
  last_quarter:    "Quarto Minguante",
  waning_crescent: "Lua Minguante",
};

const PHASE_TIPS: Record<string, string> = {
  new_moon:        "Momento de plantar novas intenções. Escreva seus objetivos e inicie projetos.",
  waxing_crescent: "Energize suas ações. Dê os primeiros passos em direção às metas da Lua Nova.",
  first_quarter:   "Supere a resistência. Persevere nos desafios e ajuste o que não está funcionando.",
  waxing_gibbous:  "Aperfeiçoe e refine. O esforço está prestes a dar frutos — continue.",
  full_moon:        "Iluminação e colheita. Celebre conquistas e observe o que precisa ser liberado.",
  waning_gibbous:  "Compartilhe gratidão. Distribua o que aprendeu e contribua com os outros.",
  last_quarter:    "Libere o que não serve mais. Faça a limpeza interna e externa.",
  waning_crescent: "Descanse e integre. Prepare o terreno da alma para o próximo ciclo.",
};

/** Converte Julian Day para data legível em PT-BR */
function jdToDateString(jd: number): string {
  // JD → Data Gregoriana simples (aproximação)
  const unixMs = (jd - 2440587.5) * 86_400_000;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" }).format(new Date(unixMs));
}

interface Props {
  moonPhase: MoonPhaseData;
  loading:   boolean;
}

export function MoonPhase({ moonPhase, loading }: Props) {
  const { t } = useTranslation("dashboard");
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="rounded-2xl bg-[var(--color-main)] p-5 dark:bg-white/5">
        <Skeleton width="40%" height="1rem" className="mb-3" />
        <Skeleton width="70%" height="2rem" className="mb-2" />
        <Skeleton lines={2} />
      </div>
    );
  }

  const emoji    = PHASE_EMOJI[moonPhase.name] ?? "🌙";
  const namePT   = PHASE_NAME_PT[moonPhase.name] ?? moonPhase.name;
  const tip      = PHASE_TIPS[moonPhase.name] ?? "";
  const nextNew  = jdToDateString(moonPhase.nextNewMoon);
  const nextFull = jdToDateString(moonPhase.nextFullMoon);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      className="rounded-2xl bg-[var(--color-main)] p-5 dark:bg-white/5"
      data-testid="moon-phase"
    >
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-paragraph)]">
        {t("moonPhase.title")}
      </p>

      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-button)]"
      >
        <span className="text-5xl leading-none" aria-hidden="true">{emoji}</span>
        <div>
          <h2 className="font-display text-xl font-bold text-[var(--color-headline)]">{namePT}</h2>
          <p className="text-sm text-[var(--color-paragraph)]">
            {moonPhase.illumination}% iluminada
          </p>
        </div>
        <span
          className="ml-auto text-[var(--color-paragraph)]"
          aria-hidden="true"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}
        >
          ▾
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 border-t border-[var(--color-secondary)] pt-3">
              <p className="text-sm text-[var(--color-paragraph)]">
                <span className="font-semibold">Próxima Lua Nova:</span> {nextNew}
              </p>
              <p className="text-sm text-[var(--color-paragraph)]">
                <span className="font-semibold">Próxima Lua Cheia:</span> {nextFull}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-paragraph)]">{tip}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
