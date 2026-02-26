import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { useDashboard } from "@/hooks/useDashboard";
import { DailyPlanet } from "@/components/dashboard/DailyPlanet";
import { MoonPhase } from "@/components/dashboard/MoonPhase";
import { DailyQuote } from "@/components/dashboard/DailyQuote";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { CompatTop3 } from "@/components/dashboard/CompatTop3";

/** HomePage (Dashboard) — Implementação completa: T087 */
export default function HomePage() {
  const { t } = useTranslation("dashboard");
  const user = useAuthStore((s) => s.user);
  const { data, loading } = useDashboard();

  return (
    <>
      <Helmet>
        <title>Início — duGuru</title>
      </Helmet>
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-headline)]">
            {t("greeting", { name: user?.name?.split(" ")[0] ?? "" })}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-paragraph)]">
            Aqui estão os destaques astrológicos de hoje.
          </p>
        </div>

        {/* T088 — Planeta do Dia */}
        <DailyPlanet
          planet={data?.planet ?? ""}
          influence={data?.planetInfluence ?? ""}
          loading={loading}
        />

        {/* T089 — Fase da Lua */}
        {(loading || data?.moonPhase) && (
          <MoonPhase
            moonPhase={data?.moonPhase ?? { name: "new_moon", elongation: 0, illumination: 0, nextNewMoon: 0, nextFullMoon: 0 }}
            loading={loading}
          />
        )}

        {/* T090 — Frase do Dia */}
        <DailyQuote
          quote={data?.inspirationalQuote ?? ""}
          date={data?.date ?? ""}
          loading={loading}
        />

        {/* T091 — Alertas Astrológicos */}
        <AlertBanner
          alerts={data?.alerts ?? []}
          loading={loading}
        />

        {/* T092 — Top 3 Compatíveis */}
        <CompatTop3
          items={data?.compatTop3 ?? []}
          loading={loading}
        />
      </div>
    </>
  );
}
