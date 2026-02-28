import * as Sentry from "@sentry/node";
import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import { healthRouter } from "./routes/health.routes";
import { authRouter } from "./routes/auth.routes";
import { profileRouter } from "./routes/profile.routes";
import { geocodingRouter } from "./routes/geocoding.routes";
import { chartRouter } from "./routes/chart.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { horoscopeRouter } from "./routes/horoscope.routes";
import { compatibilityRouter, synastryRouter } from "./routes/compatibility.routes";

// ─── Sentry — Error Monitoring (T129) ────────────────────────────────────────
// SENTRY_DSN deve estar definido nas variáveis de ambiente de produção.
// Em desenvolvimento (sem DSN), Sentry opera em modo no-op silencioso.
const SENTRY_DSN = process.env["SENTRY_DSN"];
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env["NODE_ENV"] ?? "development",
    release: `duguru-backend@0.1.0`,
    tracesSampleRate: 0.2,   // 20% das transações amostradas
    integrations: [
      Sentry.prismaIntegration(),
    ],
  });
}

/**
 * createApp — Express app factory.
 *
 * Registra todos os middlewares e routers.
 * Separado do server.ts para facilitar testes de integração
 * (importar sem chamar listen).
 */
export async function createApp(): Promise<Express> {
  const app = express();
  app.set('trust proxy', 1);
  // ─── Security middlewares ─────────────────────────────────────────
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false, // Needed for PWA / service workers
    }),
  );

  app.use(
    cors({
      origin: process.env["CORS_ORIGIN"] ?? "http://localhost:5173",
      credentials: true, // Permite cookies (refresh token HttpOnly)
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  );

  // ─── Body parsing ─────────────────────────────────────────────────
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));
  app.use(cookieParser());

  // ─── Request logging ──────────────────────────────────────────────
  app.use(requestLogger);

  // ─── Static uploads ───────────────────────────────────────────────
  app.use("/uploads", express.static("uploads"));

  // ─── Routes ───────────────────────────────────────────────────────
  app.use("/api", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/geocoding", geocodingRouter);
  app.use("/api/chart", chartRouter);
  app.use("/api/daily", dashboardRouter);
  app.use("/api/horoscope", horoscopeRouter);
  app.use("/api/compatibility", compatibilityRouter); // GET /api/compatibility
  app.use("/api/synastry",      synastryRouter);      // POST /api/synastry

  // TODO (phase 7): onboarding

  // ─── Sentry error handler (before custom errorHandler) ───────────
  if (SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }

  // ─── Error handler (must be last) ────────────────────────────────
  app.use(errorHandler);

  return app;
}
