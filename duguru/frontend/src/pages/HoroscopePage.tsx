import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { useHoroscope } from "@/hooks/useHoroscope";
import { PeriodTabs } from "@/components/horoscope/PeriodTabs";
import { SectionBlock } from "@/components/horoscope/SectionBlock";
import type { HoroscopePeriod } from "@/services/horoscopeService";

const SECTIONS = ["love", "work", "health", "finance", "advice"] as const;
type Section = (typeof SECTIONS)[number];

const SIGN_NAME_PT: Record<string, string> = {
  aries: "Áries", taurus: "Touro", gemini: "Gêmeos", cancer: "Câncer",
  leo: "Leão", virgo: "Virgem", libra: "Libra", scorpio: "Escorpião",
  sagittarius: "Sagitário", capricorn: "Capricórnio", aquarius: "Aquário", pisces: "Peixes",
};

/** HoroscopePage — Implementação completa: T099 */
export default function HoroscopePage() {
  const { t }                         = useTranslation("horoscope");
  const user                          = useAuthStore((s) => s.user);
  const [period, setPeriod]           = useState<HoroscopePeriod>("day");
  const [useAscendant, setUseAscendant] = useState(false);

  const { data, loading, error }      = useHoroscope(period, useAscendant);

  const hasAscendant = Boolean(user?.ascendant);

  /* Texto do signo exibido */
  const displaySign = useAscendant && user?.ascendant
    ? user.ascendant
    : (user?.sunSign ?? "");
  const displaySignPT = SIGN_NAME_PT[displaySign] ?? displaySign;

  return (
    <>
      <Helmet>
        <title>{t("title")} — duGuru</title>
        <meta name="description" content={`Horóscopo personalizado de ${displaySignPT} — duGuru`} />
      </Helmet>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-headline)]">
            {t("title")}
          </h1>
          {displaySign && (
            <p className="mt-1 text-sm text-[var(--color-paragraph)]">
              {displaySignPT} {SECTIONS.length > 0 ? "· 5 áreas da sua vida" : ""}
            </p>
          )}
        </div>

        {/* Switch solar/ascendente */}
        {hasAscendant && (
          <div
            role="group"
            aria-label={t("signSwitch.label")}
            className="flex gap-2"
          >
            <button
              type="button"
              onClick={() => setUseAscendant(false)}
              aria-pressed={!useAscendant}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                !useAscendant
                  ? "bg-[var(--color-button)] text-[var(--color-button-text)]"
                  : "bg-[var(--color-main)] text-[var(--color-paragraph)] dark:bg-white/5"
              }`}
            >
              {t("signSwitch.solar")}
            </button>
            <button
              type="button"
              onClick={() => setUseAscendant(true)}
              aria-pressed={useAscendant}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                useAscendant
                  ? "bg-[var(--color-button)] text-[var(--color-button-text)]"
                  : "bg-[var(--color-main)] text-[var(--color-paragraph)] dark:bg-white/5"
              }`}
            >
              {t("signSwitch.ascendant")}
            </button>
          </div>
        )}

        {/* Period tabs — T100 */}
        <PeriodTabs active={period} onChange={setPeriod} />

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="rounded-xl bg-[var(--color-highlight)]/10 p-4 text-sm text-[var(--color-headline)]"
          >
            {error}
          </div>
        )}

        {/* Sections panel — T101 */}
        <section
          id={`panel-${period}`}
          role="tabpanel"
          aria-labelledby={`tab-${period}`}
          aria-live="polite"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${period}-${String(useAscendant)}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {SECTIONS.map((section, i) => (
                <SectionBlock
                  key={section}
                  section={section}
                  text={data?.[section] ?? ""}
                  loading={loading}
                  index={i}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </>
  );
}
