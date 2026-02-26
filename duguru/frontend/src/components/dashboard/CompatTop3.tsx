/**
 * frontend/src/components/dashboard/CompatTop3.tsx  — T092
 *
 * Top 3 signos mais compatíveis com o signo solar do usuário.
 * Ícone + nome + resumo + link para /compatibilidade.
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/Skeleton";
import type { CompatTop3Item } from "@/services/dashboardService";

const SIGN_SYMBOL: Record<string, string> = {
  aries:       "♈",
  taurus:      "♉",
  gemini:      "♊",
  cancer:      "♋",
  leo:         "♌",
  virgo:       "♍",
  libra:       "♎",
  scorpio:     "♏",
  sagittarius: "♐",
  capricorn:   "♑",
  aquarius:    "♒",
  pisces:      "♓",
};

const SIGN_NAME_PT: Record<string, string> = {
  aries:       "Áries",
  taurus:      "Touro",
  gemini:      "Gêmeos",
  cancer:      "Câncer",
  leo:         "Leão",
  virgo:       "Virgem",
  libra:       "Libra",
  scorpio:     "Escorpião",
  sagittarius: "Sagitário",
  capricorn:   "Capricórnio",
  aquarius:    "Aquário",
  pisces:      "Peixes",
};

interface Props {
  items:   CompatTop3Item[];
  loading: boolean;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[10px] text-[var(--color-paragraph)]">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-main)] dark:bg-white/10">
        <motion.div
          className="h-full rounded-full bg-[var(--color-highlight)]"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className="w-8 text-right text-[10px] font-semibold text-[var(--color-paragraph)]">
        {value}%
      </span>
    </div>
  );
}

function CompatCard({ item, index }: { item: CompatTop3Item; index: number }) {
  const { t } = useTranslation("dashboard");
  const symbol  = SIGN_SYMBOL[item.sign] ?? "✦";
  const namePT  = SIGN_NAME_PT[item.sign] ?? item.sign;

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.1 }}
      className="flex flex-col gap-3 rounded-xl bg-[var(--color-main)] p-4 dark:bg-white/5"
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl leading-none" aria-hidden="true">{symbol}</span>
        <div>
          <h3 className="font-semibold text-[var(--color-headline)]">{namePT}</h3>
          <p className="text-xs text-[var(--color-paragraph)]">{item.summary}</p>
        </div>
      </div>
      <div className="space-y-1">
        <ScoreBar label="Romance" value={item.romance} />
        <ScoreBar label="Amizade" value={item.friendship} />
        <ScoreBar label="Trabalho" value={item.work} />
      </div>
      <Link
        to="/compatibilidade"
        className="mt-1 self-end text-xs font-semibold text-[var(--color-link)] hover:underline"
        aria-label={t("compatTop3.signCompatibility", { sign: namePT })}
      >
        {t("compatTop3.seeAll")} →
      </Link>
    </motion.li>
  );
}

export function CompatTop3({ items, loading }: Props) {
  const { t } = useTranslation("dashboard");

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton width="40%" height="1rem" />
        {[1, 2, 3].map((k) => (
          <Skeleton key={k} height="120px" radius="0.75rem" />
        ))}
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <section aria-label={t("compatTop3.title")} data-testid="compat-top3">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-paragraph)]">
        {t("compatTop3.title")}
      </h2>
      <ul className="space-y-3" role="list">
        {items.map((item, i) => (
          <CompatCard key={item.sign} item={item} index={i} />
        ))}
      </ul>
    </section>
  );
}
