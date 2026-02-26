/**
 * frontend/src/components/dashboard/DailyPlanet.tsx  — T088
 *
 * Card do "Planeta do Dia" com ícone, nome e influência.
 * Animação de entrada via Framer Motion.
 */
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/Skeleton";

/* Mapeamento de nome PT para símbolo astrológico */
const PLANET_SYMBOL: Record<string, string> = {
  Sol:     "☉",
  Lua:     "☽",
  "Mercúrio": "☿",
  "Vênus": "♀",
  Marte:   "♂",
  "Júpiter": "♃",
  Saturno: "♄",
  Urano:   "⛢",
  Netuno:  "♆",
  "Plutão": "♇",
};

interface Props {
  planet:    string;
  influence: string;
  loading:   boolean;
}

export function DailyPlanet({ planet, influence, loading }: Props) {
  const { t } = useTranslation("dashboard");

  if (loading) {
    return (
      <div className="rounded-2xl bg-[var(--color-main)] p-5 dark:bg-white/5">
        <Skeleton width="40%" height="1rem" className="mb-3" />
        <Skeleton width="60%" height="2rem" className="mb-2" />
        <Skeleton lines={2} />
      </div>
    );
  }

  const symbol = PLANET_SYMBOL[planet] ?? "✦";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-2xl bg-[var(--color-main)] p-5 dark:bg-white/5"
      data-testid="daily-planet"
    >
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-paragraph)]">
        {t("dailyPlanet.title")}
      </p>
      <div className="flex items-center gap-3">
        <span
          className="text-5xl leading-none"
          aria-hidden="true"
          role="img"
        >
          {symbol}
        </span>
        <h2 className="font-display text-2xl font-bold text-[var(--color-headline)]">
          {planet}
        </h2>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--color-paragraph)]">
        {influence}
      </p>
    </motion.div>
  );
}
