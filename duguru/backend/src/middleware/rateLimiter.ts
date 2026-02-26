import rateLimit from "express-rate-limit";
import { createError } from "./errorHandler";

const WINDOW_MS =
  Number(process.env["RATE_LIMIT_WINDOW_MS"] ?? 15 * 60 * 1000); // 15 min
const MAX_LOGIN = Number(process.env["RATE_LIMIT_MAX_LOGIN"] ?? 5);

/**
 * loginRateLimiter — Rate limiter para rotas de autenticação.
 *
 * Janela: 15 min | Máximo: 5 tentativas por IP
 * Após esgotar: HTTP 429 com formato de erro padrão duGuru.
 */
export const loginRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_LOGIN,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    const minutesRemaining = Math.ceil(WINDOW_MS / 60_000);
    next(
      createError(
        429,
        "AUTH_RATE_LIMIT_EXCEEDED",
        `Muitas tentativas de login. Tente novamente em ${minutesRemaining} minuto(s).`,
      ),
    );
  },
  skip: () => process.env["NODE_ENV"] === "test",
});

/**
 * genericRateLimiter — Rate limiter geral (rotas públicas).
 *
 * Janela: 15 min | Máximo: 100 requests por IP
 */
export const genericRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      createError(
        429,
        "RATE_LIMIT_EXCEEDED",
        "Muitas requisições. Por favor, aguarde um momento.",
      ),
    );
  },
  skip: () => process.env["NODE_ENV"] === "test",
});
