/**
 * frontend/src/components/dashboard/AlertBanner.tsx  — T091
 *
 * Lista de alertas de eventos astrológicos (retrógrados, eclipses, etc.).
 * Cada card: nome do evento + período + signos afetados + dica.
 * Usa --color-highlight como cor de destaque.
 */
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/Skeleton";
import type { AstrologicalAlert } from "@/services/dashboardService";

interface Props {
  alerts:  AstrologicalAlert[];
  loading: boolean;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(
    new Date(dateStr + "T12:00:00Z"),
  );
}

function AlertCard({ alert, index }: { alert: AstrologicalAlert; index: number }) {
  const { t } = useTranslation("dashboard");

  return (
    <motion.li
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="rounded-xl border border-[var(--color-highlight)]/30 bg-[var(--color-highlight)]/10 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-[var(--color-headline)]">{alert.event}</h3>
          {alert.signs.length > 0 && (
            <p className="mt-0.5 text-xs text-[var(--color-paragraph)]">
              Signos: {alert.signs.join(", ")}
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-[var(--color-highlight)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-button-text)]">
          {t("alerts.period", {
            start: formatDate(alert.startDate),
            end:   formatDate(alert.endDate),
          })}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-paragraph)]">{alert.tip}</p>
    </motion.li>
  );
}

export function AlertBanner({ alerts, loading }: Props) {
  const { t } = useTranslation("dashboard");

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton width="40%" height="1rem" />
        <Skeleton height="80px" radius="0.75rem" />
        <Skeleton height="80px" radius="0.75rem" />
      </div>
    );
  }

  return (
    <section aria-label={t("alerts.title")} data-testid="alert-banner">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-paragraph)]">
        {t("alerts.title")}
      </h2>

      {alerts.length === 0 ? (
        <p className="rounded-xl bg-[var(--color-main)] p-4 text-sm text-[var(--color-paragraph)] dark:bg-white/5">
          {t("alerts.noAlerts")}
        </p>
      ) : (
        <ul className="space-y-3" role="list">
          {alerts.map((alert, i) => (
            <AlertCard key={`${alert.event}-${i}`} alert={alert} index={i} />
          ))}
        </ul>
      )}
    </section>
  );
}
