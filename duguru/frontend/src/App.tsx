import { RouterProvider } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useEffect } from "react";
import { router } from "@/router";
import { ToastProvider } from "@/components/ui/Toast";
import { OnboardingOverlay } from "@/components/layout/OnboardingOverlay";
import { useThemeStore } from "@/stores/themeStore";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import "@/i18n";

function ThemeInitializer() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  }, [theme]);

  return null;
}

/**
 * OnboardingStarter — Inicia o onboarding automaticamente para novos usuários.
 * user.onboardingDone === false → start() uma vez por sessão.
 */
function OnboardingStarter() {
  const user   = useAuthStore((s) => s.user);
  const start  = useOnboardingStore((s) => s.start);
  const isActive = useOnboardingStore((s) => s.isActive);

  useEffect(() => {
    if (user && user.onboardingDone === false && !isActive) {
      start();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.onboardingDone]);

  return null;
}

/**
 * App — Raiz da aplicação duGuru.
 *
 * Inicializa: tema, i18n, autenticação, router, toast, helmet e onboarding.
 */
export default function App() {
  return (
    <HelmetProvider>
      <ToastProvider>
        <ThemeInitializer />
        <OnboardingStarter />
        <OnboardingOverlay />
        <RouterProvider router={router} />
      </ToastProvider>
    </HelmetProvider>
  );
}
