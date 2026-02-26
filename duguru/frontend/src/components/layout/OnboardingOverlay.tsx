/**
 * frontend/src/components/layout/OnboardingOverlay.tsx  — T104
 *
 * Tour de onboarding de 4 passos para novos usuários.
 * - Overlay semi-transparente com AnimatePresence (Framer Motion)
 * - role="dialog", aria-modal="true", foco preso durante o tour
 * - Persiste conclusão via PATCH /api/profile (onboardingDone: true)
 */
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/services/api";

/* ─── Definição dos passos ───────────────────────────────────────────────── */

const STEP_ICONS = ["🗺️", "🔮", "🌟", "💞"] as const;

/* ─── OnboardingOverlay ──────────────────────────────────────────────────── */

export function OnboardingOverlay() {
  const { t }         = useTranslation();
  const isActive      = useOnboardingStore((s) => s.isActive);
  const currentStep   = useOnboardingStore((s) => s.currentStep);
  const totalSteps    = useOnboardingStore((s) => s.totalSteps);
  const next          = useOnboardingStore((s) => s.next);
  const prev          = useOnboardingStore((s) => s.prev);
  const skip          = useOnboardingStore((s) => s.skip);
  const complete      = useOnboardingStore((s) => s.complete);
  const setUser       = useAuthStore((s) => s.setUser);
  const user          = useAuthStore((s) => s.user);

  const dialogRef     = useRef<HTMLDivElement>(null);
  const closeRef      = useRef<HTMLButtonElement>(null);

  /* Focar no dialog quando abrir */
  useEffect(() => {
    if (isActive) {
      closeRef.current?.focus();
    }
  }, [isActive]);

  /* Prender foco dentro do dialog */
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        void handleFinish(false);
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0]!;
      const last  = focusable[focusable.length - 1]!;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("keydown", handleKeyDown); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  /* Persiste no backend e atualiza store */
  async function handleFinish(completed: boolean) {
    if (completed) {
      complete();
    } else {
      skip();
    }
    try {
      const res = await api.patch<{ ok: boolean; data: Record<string, unknown> }>(
        "/profile",
        { onboardingDone: true },
      );
      if (res.data.ok && user) {
        setUser({ ...user, onboardingDone: true });
      }
    } catch {
      // Falha silenciosa — estado local já foi atualizado
    }
  }

  const isLastStep = currentStep === totalSteps - 1;

  const stepKeys = [
    { titleKey: "onboarding.step1.title", descKey: "onboarding.step1.description" },
    { titleKey: "onboarding.step2.title", descKey: "onboarding.step2.description" },
    { titleKey: "onboarding.step3.title", descKey: "onboarding.step3.description" },
    { titleKey: "onboarding.step4.title", descKey: "onboarding.step4.description" },
  ] as const;

  const step = stepKeys[currentStep] ?? stepKeys[0]!;

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Backdrop semi-transparente */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Dialog do onboarding */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="presentation"
          >
            <motion.div
              key="dialog"
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="onboarding-title"
              aria-describedby="onboarding-desc"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-sm rounded-2xl bg-[var(--color-bg)] p-6 shadow-2xl"
            >
              {/* Botão fechar / pular */}
              <button
                ref={closeRef}
                onClick={() => { void handleFinish(false); }}
                className="absolute right-4 top-4 rounded-full p-1.5 text-[var(--color-paragraph)] hover:bg-[var(--color-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-highlight)]"
                aria-label={t("onboarding.skip")}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M12.854 3.146a.5.5 0 010 .708L8.707 8l4.147 4.146a.5.5 0 01-.708.708L8 8.707l-4.146 4.147a.5.5 0 01-.708-.708L7.293 8 3.146 3.854a.5.5 0 01.708-.708L8 7.293l4.146-4.147a.5.5 0 01.708 0z"/>
                </svg>
              </button>

              {/* Ícone do passo */}
              <div className="mb-4 text-center text-4xl" aria-hidden="true">
                {STEP_ICONS[currentStep]}
              </div>

              {/* Título e descrição */}
              <h2
                id="onboarding-title"
                className="mb-2 text-center text-xl font-bold text-[var(--color-headline)]"
              >
                {t(step.titleKey)}
              </h2>
              <p
                id="onboarding-desc"
                className="mb-5 text-center text-sm leading-relaxed text-[var(--color-paragraph)]"
              >
                {t(step.descKey)}
              </p>

              {/* Indicadores de progresso */}
              <div
                className="mb-5 flex justify-center gap-1.5"
                aria-label={t("onboarding.stepCount", { current: currentStep + 1, total: totalSteps })}
              >
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep
                        ? "w-4 bg-[var(--color-highlight)]"
                        : i < currentStep
                          ? "w-1.5 bg-[var(--color-highlight)] opacity-50"
                          : "w-1.5 bg-[var(--color-paragraph)] opacity-30"
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>

              {/* Navegação */}
              <div className="flex items-center justify-between">
                <button
                  onClick={prev}
                  disabled={currentStep === 0}
                  className="rounded-xl px-3 py-2 text-sm text-[var(--color-paragraph)] hover:bg-[var(--color-main)] disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-[var(--color-highlight)]"
                >
                  {t("common.previous")}
                </button>

                <button
                  onClick={() => { void handleFinish(false); }}
                  className="text-sm text-[var(--color-paragraph)] underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-highlight)]"
                >
                  {t("onboarding.skip")}
                </button>

                {isLastStep ? (
                  <button
                    onClick={() => { void handleFinish(true); }}
                    className="rounded-xl bg-[var(--color-button)] px-4 py-2 text-sm font-semibold text-[var(--color-button-text)] transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-highlight)]"
                  >
                    {t("onboarding.finish")}
                  </button>
                ) : (
                  <button
                    onClick={next}
                    className="rounded-xl bg-[var(--color-button)] px-4 py-2 text-sm font-semibold text-[var(--color-button-text)] transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-highlight)]"
                  >
                    {t("common.next")}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
