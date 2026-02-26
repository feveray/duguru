import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "./jwtService";
import { createError } from "../middleware/errorHandler";

/**
 * authMiddleware — Valida o JWT de acesso no header Authorization.
 *
 * Formato esperado: `Authorization: Bearer <access_token>`
 *
 * Em caso de sucesso: popula `req.user = { userId }` e chama `next()`.
 * Em caso de falha: retorna 401 no formato padrão duGuru:
 *   `{ error: { code, message, status: 401 } }`
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw createError(
        401,
        "AUTH_MISSING_TOKEN",
        "Token de acesso ausente. Inclua o header Authorization: Bearer <token>.",
      );
    }

    const token = authHeader.slice(7); // Remove "Bearer "
    const payload = await verifyAccessToken(token);

    if (!payload.sub) {
      throw createError(401, "AUTH_INVALID_TOKEN", "Token inválido: sub ausente.");
    }

    req.user = { userId: payload.sub };
    next();
  } catch (err: unknown) {
    next(err);
  }
}

/**
 * requireAuth — Alias semântico para uso em rotas.
 *
 * @example
 * router.get("/profile", requireAuth, profileHandler)
 */
export const requireAuth = authMiddleware;
