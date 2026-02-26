import { Router, type Request, type Response } from "express";

const pkg = { version: "0.1.0" }; // substitui import direto do package.json para evitar risco de tipo

export const healthRouter = Router();

/**
 * GET /api/health
 *
 * Endpoint de health check — sem autenticação.
 * Usado pelo load balancer do Railway e pelo CI.
 */
healthRouter.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    version: pkg.version,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
