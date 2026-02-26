import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";
import "./styles/tailwind.css";

// ─── Sentry — Error Monitoring (T128) ────────────────────────────────────────
// VITE_SENTRY_DSN deve estar configurado nas variáveis de ambiente de produção.
// Em desenvolvimento (env var ausente), Sentry opera em modo no-op silencioso.
const SENTRY_DSN = import.meta.env["VITE_SENTRY_DSN"] as string | undefined;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: `duguru-frontend@${import.meta.env["VITE_APP_VERSION"] ?? "0.1.0"}`,
    tracesSampleRate: 0.2,           // 20% das transações amostradas
    replaysSessionSampleRate: 0.05,  // 5% das sessões com replay
    replaysOnErrorSampleRate: 1.0,   // 100% das sessões com erro
    ignoreErrors: [
      // Erros de rede não acionáveis pelo app
      "Network Error",
      "AxiosError",
      /^NetworkError/,
      /^AbortError/,
      // Erros de extensões do navegador
      /^chrome-extension:/,
      "ResizeObserver loop limit exceeded",
    ],
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,     // LGPD: oculta texto sensível nos replays
        blockAllMedia: true,
      }),
    ],
  });
}


const root = document.getElementById("root");

if (!root) {
  throw new Error(
    'Root element #root not found. Check index.html.',
  );
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
