/**
 * frontend/src/components/horoscope/PeriodTabs.tsx  — T100
 *
 * Tabs acessíveis para seleção de período do horóscopo.
 * Usa role="tablist" / role="tab" / aria-selected.
 * Animação de transição via Framer Motion.
 */
import { useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { HoroscopePeriod } from "@/services/horoscopeService";

interface Props {
  active:   HoroscopePeriod;
  onChange: (period: HoroscopePeriod) => void;
}

interface Tab {
  id:    HoroscopePeriod;
  label: string;
}

export function PeriodTabs({ active, onChange }: Props) {
  const { t } = useTranslation("horoscope");
  const tabRefs = useRef<Map<HoroscopePeriod, HTMLButtonElement>>(new Map());

  const tabs: Tab[] = [
    { id: "day",   label: t("periods.day") },
    { id: "week",  label: t("periods.week") },
    { id: "month", label: t("periods.month") },
    { id: "year",  label: t("periods.year") },
  ];

  /* Keyboard navigation */
  function handleKeyDown(e: React.KeyboardEvent, current: HoroscopePeriod) {
    const ids = tabs.map((t) => t.id);
    const idx = ids.indexOf(current);
    if (e.key === "ArrowRight") {
      const next = ids[(idx + 1) % ids.length]!;
      onChange(next);
      tabRefs.current.get(next)?.focus();
    } else if (e.key === "ArrowLeft") {
      const prev = ids[(idx - 1 + ids.length) % ids.length]!;
      onChange(prev);
      tabRefs.current.get(prev)?.focus();
    }
  }

  return (
    <div
      role="tablist"
      aria-label={t("periodLabel")}
      className="flex gap-1 rounded-xl bg-[var(--color-main)] p-1 dark:bg-white/5"
    >
      {tabs.map(({ id, label }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={isActive}
            aria-controls={`panel-${id}`}
            type="button"
            tabIndex={isActive ? 0 : -1}
            ref={(el) => { if (el) tabRefs.current.set(id, el); }}
            onClick={() => onChange(id)}
            onKeyDown={(e) => handleKeyDown(e, id)}
            className="relative flex-1 rounded-lg py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-button)]"
            style={{
              color: isActive ? "var(--color-button-text)" : "var(--color-paragraph)",
            }}
          >
            {isActive && (
              <motion.span
                layoutId="horo-tab-indicator"
                className="absolute inset-0 rounded-lg"
                style={{ backgroundColor: "var(--color-button)" }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
