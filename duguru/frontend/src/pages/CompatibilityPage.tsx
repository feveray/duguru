/**
 * frontend/src/pages/CompatibilityPage.tsx  — T110
 *
 * Página de compatibilidade:
 * 1) Seleção de dois signos → score por área (Romance/Amizade/Trabalho) + radar D3
 * 2) Seção de sinastria → formulário de dados de nascimento → aspectos + score
 */
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { useCompatibility, useSynastry } from "@/hooks/useCompatibility";
import { CompatScore } from "@/components/compatibility/CompatScore";
import { SynastrySummary } from "@/components/compatibility/SynastrySummary";
import type { BirthData } from "@/services/compatibilityService";

const SIGNS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
] as const;

const SIGN_PT: Record<string, string> = {
  aries: "Áries", taurus: "Touro", gemini: "Gêmeos", cancer: "Câncer",
  leo: "Leão", virgo: "Virgem", libra: "Libra", scorpio: "Escorpião",
  sagittarius: "Sagitário", capricorn: "Capricórnio", aquarius: "Aquário", pisces: "Peixes",
};

/* ─── Seletor de signo ───────────────────────────────────────────────────── */

function SignSelect({
  id,
  label,
  value,
  onChange,
}: {
  id:       string;
  label:    string;
  value:    string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex-1">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-[var(--color-headline)]">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => { onChange(e.target.value); }}
        className="w-full rounded-lg border border-[var(--color-main)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-headline)] focus:outline-none focus:ring-2 focus:ring-[var(--color-highlight)]"
      >
        {SIGNS.map((s) => (
          <option key={s} value={s}>{SIGN_PT[s] ?? s}</option>
        ))}
      </select>
    </div>
  );
}

/* ─── Formulário de sinastria ────────────────────────────────────────────── */

function SynastryForm({ onCalculate }: { onCalculate: (p1: BirthData, p2: BirthData) => void }) {
  const { t } = useTranslation("compatibility");
  const [p1Date, setP1Date] = useState("");
  const [p1Time, setP1Time] = useState("");
  const [p1Lat,  setP1Lat]  = useState("");
  const [p1Lon,  setP1Lon]  = useState("");
  const [p2Date, setP2Date] = useState("");
  const [p2Time, setP2Time] = useState("");
  const [p2Lat,  setP2Lat]  = useState("");
  const [p2Lon,  setP2Lon]  = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCalculate(
      {
        birthDate: p1Date,
        ...(p1Time ? { birthTime: p1Time } : {}),
        lat: Number(p1Lat),
        lon: Number(p1Lon),
      },
      {
        birthDate: p2Date,
        ...(p2Time ? { birthTime: p2Time } : {}),
        lat: Number(p2Lat),
        lon: Number(p2Lon),
      },
    );
  }

  const inputClass =
    "w-full rounded-lg border border-[var(--color-main)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-headline)] placeholder:text-[var(--color-paragraph)] focus:outline-none focus:ring-2 focus:ring-[var(--color-highlight)]";

  function PersonFields({
    label,
    date, setDate,
    time, setTime,
    lat,  setLat,
    lon,  setLon,
  }: {
    label:   string;
    date:    string; setDate:    (v: string) => void;
    time:    string; setTime:    (v: string) => void;
    lat:     string; setLat:     (v: string) => void;
    lon:     string; setLon:     (v: string) => void;
  }) {
    return (
      <fieldset className="rounded-xl border border-[var(--color-main)] p-4">
        <legend className="px-1 text-sm font-semibold text-[var(--color-headline)]">{label}</legend>
        <div className="mt-2 space-y-2">
          <input
            type="date" required
            value={date} onChange={(e) => { setDate(e.target.value); }}
            className={inputClass}
            aria-label={`${label} — data de nascimento`}
          />
          <input
            type="time"
            value={time} onChange={(e) => { setTime(e.target.value); }}
            className={inputClass}
            aria-label={`${label} — horário de nascimento (opcional)`}
            placeholder="Horário (opcional)"
          />
          <div className="flex gap-2">
            <input
              type="number" required step="0.0001"
              value={lat} onChange={(e) => { setLat(e.target.value); }}
              className={inputClass}
              aria-label={`${label} — latitude`}
              placeholder="Latitude (ex: -23.55)"
            />
            <input
              type="number" required step="0.0001"
              value={lon} onChange={(e) => { setLon(e.target.value); }}
              className={inputClass}
              aria-label={`${label} — longitude`}
              placeholder="Longitude (ex: -46.63)"
            />
          </div>
        </div>
      </fieldset>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PersonFields
        label={t("person1")}
        date={p1Date} setDate={setP1Date}
        time={p1Time} setTime={setP1Time}
        lat={p1Lat}   setLat={setP1Lat}
        lon={p1Lon}   setLon={setP1Lon}
      />
      <PersonFields
        label={t("person2")}
        date={p2Date} setDate={setP2Date}
        time={p2Time} setTime={setP2Time}
        lat={p2Lat}   setLat={setP2Lat}
        lon={p2Lon}   setLon={setP2Lon}
      />
      <button
        type="submit"
        className="w-full rounded-xl bg-[var(--color-button)] px-4 py-3 font-semibold text-[var(--color-button-text)] transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-highlight)]"
      >
        {t("calcSynastry")}
      </button>
    </form>
  );
}

/* ─── CompatibilityPage ──────────────────────────────────────────────────── */

/** CompatibilityPage — Implementação completa: T110 */
export default function CompatibilityPage() {
  const { t }  = useTranslation("compatibility");
  const user   = useAuthStore((s) => s.user);

  /* Signos selecionados */
  const [sign1, setSign1] = useState<string>(user?.sunSign ?? "aries");
  const [sign2, setSign2] = useState<string>("leo");

  /* Score de signos */
  const { data: signScore, loading: scoreLoading, error: scoreError } =
    useCompatibility(sign1, sign2);

  /* Sinastria */
  const { data: synastryData, loading: synLoading, error: synError, calculate } =
    useSynastry();

  const [activeTab, setActiveTab] = useState<"signs" | "synastry">("signs");

  return (
    <>
      <Helmet>
        <title>{t("title")} — duGuru</title>
        <meta name="description" content="Descubra a compatibilidade astrológica entre signos e faça sinastria entre dois mapas natais." />
      </Helmet>

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {/* Header */}
        <header>
          <h1 className="font-display text-2xl font-bold text-[var(--color-headline)]">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-paragraph)]">
            {t("subtitle")}
          </p>
        </header>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label={t("tabs")}
          className="flex gap-2 rounded-xl bg-[var(--color-main)] p-1"
        >
          {(["signs", "synastry"] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => { setActiveTab(tab); }}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-[var(--color-bg)] text-[var(--color-headline)] shadow"
                  : "text-[var(--color-paragraph)] hover:text-[var(--color-headline)]"
              }`}
            >
              {t(tab === "signs" ? "tabSigns" : "tabSynastry")}
            </button>
          ))}
        </div>

        {/* Tab: Compatibilidade de signos */}
        {activeTab === "signs" && (
          <section role="tabpanel" aria-label={t("tabSigns")}>
            {/* Seleção de signos */}
            <div className="flex gap-3">
              <SignSelect
                id="sign1" label={t("sign1")}
                value={sign1} onChange={setSign1}
              />
              <div className="flex items-end pb-2 text-xl font-bold text-[var(--color-highlight)]">
                ♡
              </div>
              <SignSelect
                id="sign2" label={t("sign2")}
                value={sign2} onChange={setSign2}
              />
            </div>

            {scoreError && (
              <p role="alert" className="mt-3 text-sm text-red-500">{scoreError}</p>
            )}

            <div className="mt-4">
              <CompatScore signScore={signScore} loading={scoreLoading} />
            </div>
          </section>
        )}

        {/* Tab: Sinastria */}
        {activeTab === "synastry" && (
          <section role="tabpanel" aria-label={t("tabSynastry")}>
            <SynastryForm onCalculate={(p1, p2) => { void calculate(p1, p2); }} />

            {synLoading && (
              <p className="mt-4 text-sm text-[var(--color-paragraph)]" aria-live="polite">
                {t("calcLoading")}
              </p>
            )}

            {synError && (
              <p role="alert" className="mt-4 text-sm text-red-500">{synError}</p>
            )}

            {synastryData && !synLoading && (
              <div className="mt-6 space-y-6">
                <CompatScore synastryScore={synastryData.score} />
                <SynastrySummary aspects={synastryData.aspects} />
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}

