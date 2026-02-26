/**
 * frontend/src/components/dashboard/DailyQuote.tsx  — T090
 *
 * Exibe a frase inspiradora do dia com tipografia destacada.
 * Troca suavemente via AnimatePresence quando a frase muda.
 */
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  quote:   string;
  date:    string;   // "YYYY-MM-DD" — usado como chave de animação
  loading: boolean;
}

export function DailyQuote({ quote, date, loading }: Props) {
  const { t } = useTranslation("dashboard");

  if (loading) {
    return (
      <div className="rounded-2xl bg-[var(--color-secondary)]/30 p-5">
        <Skeleton width="30%" height="0.875rem" className="mb-3" />
        <Skeleton lines={3} height="1.25rem" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[var(--color-secondary)]/30 p-5" data-testid="daily-quote">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-paragraph)]">
        {t("dailyQuote.title")}
      </p>
      <AnimatePresence mode="wait">
        <motion.blockquote
          key={date}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="relative pl-4 font-display text-lg font-semibold italic leading-snug text-[var(--color-headline)] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-full before:bg-[var(--color-highlight)]"
        >
          "{quote}"
        </motion.blockquote>
      </AnimatePresence>
    </div>
  );
}
