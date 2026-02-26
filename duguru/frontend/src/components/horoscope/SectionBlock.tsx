/**
 * frontend/src/components/horoscope/SectionBlock.tsx  — T101
 *
 * Card de cada seção temática do horóscopo:
 * Amor / Trabalho / Saúde / Finanças / Conselho Geral.
 * Inclui ícone, título e texto. Skeleton durante loading.
 */
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/Skeleton";

type SectionKey = "love" | "work" | "health" | "finance" | "advice";

const SECTION_CONFIG: Record<SectionKey, { icon: string; color: string }> = {
  love:    { icon: "♥",  color: "hsl(346, 100%, 72%)" },
  work:    { icon: "⚡", color: "hsl(45, 100%, 60%)" },
  health:  { icon: "🌿", color: "hsl(140, 60%, 55%)" },
  finance: { icon: "💰", color: "hsl(50, 85%, 55%)" },
  advice:  { icon: "✨", color: "hsl(270, 70%, 70%)" },
};

interface Props {
  section: SectionKey;
  text:    string;
  loading: boolean;
  index:   number;
}

export function SectionBlock({ section, text, loading, index }: Props) {
  const { t } = useTranslation("horoscope");

  if (loading) {
    return (
      <div className="rounded-2xl bg-[var(--color-main)] p-4 dark:bg-white/5">
        <Skeleton width="30%" height="1rem" className="mb-3" />
        <Skeleton lines={3} />
      </div>
    );
  }

  const { icon, color } = SECTION_CONFIG[section];
  const label = t(`sections.${section}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className="rounded-2xl bg-[var(--color-main)] p-4 dark:bg-white/5"
      data-testid={`section-${section}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-base"
          style={{ backgroundColor: `${color}22`, color }}
          aria-hidden="true"
        >
          {icon}
        </span>
        <h3 className="text-sm font-bold text-[var(--color-headline)]">{label}</h3>
      </div>
      <p className="text-sm leading-relaxed text-[var(--color-paragraph)]">{text}</p>
    </motion.div>
  );
}
