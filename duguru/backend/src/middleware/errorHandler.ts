import type { Request, Response, NextFunction } from "express";

interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * errorHandler — Middleware de erro padrão do duGuru.
 *
 * Formato de resposta de erro (todos os erros):
 * { "error": { "code": string, "message": string, "status": number } }
 */
export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = err.statusCode ?? 500;
  const code = err.code ?? (status === 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR");
  const message =
    status === 500 && process.env["NODE_ENV"] === "production"
      ? "Ocorreu um erro interno. Por favor, tente novamente."
      : err.message;

  if (status === 500) {
    console.error("[Error]", err);
  }

  res.status(status).json({
    error: {
      code,
      message,
      status,
    },
  });
}

/**
 * createError — Cria um erro com statusCode e code customizados.
 *
 * @example
 * throw createError(401, "AUTH_INVALID_CREDENTIALS", "E-mail ou senha incorretos.");
 */
export function createError(
  statusCode: number,
  code: string,
  message: string,
): ApiError {
  const err = new Error(message) as ApiError;
  err.statusCode = statusCode;
  err.code = code;
  return err;
}
