import { useEffect, useState } from "react";

/**
 * BeforeInstallPromptEvent — interface não padronizada do Chrome / Edge.
 * Não está em lib.dom.d.ts, por isso declarada localmente.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

/**
 * usePWAInstall
 *
 * Detecta o evento `beforeinstallprompt` e expõe:
 * - `canInstall`: true quando o navegador suporta instalação e o app ainda não foi instalado.
 * - `promptInstall()`: dispara o diálogo de instalação nativo do navegador.
 *
 * @example
 * ```tsx
 * const { canInstall, promptInstall } = usePWAInstall();
 * {canInstall && <button onClick={promptInstall}>Instalar app</button>}
 * ```
 */
export function usePWAInstall(): { canInstall: boolean; promptInstall: () => Promise<void> } {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function handleBeforeInstallPrompt(e: Event) {
      // Previne o mini-banner automático do Chrome
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      // Usuário instalou — esconde o botão
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function promptInstall(): Promise<void> {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  }

  return { canInstall: deferredPrompt !== null, promptInstall };
}
