/**
 * backend/src/routes/chart.routes.ts
 *
 * GET /api/chart/natal  — Retorna o mapa natal do usuario autenticado.
 * POST /api/chart/pdf   — Gera e retorna o PDF do mapa natal (stub).
 */
import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth } from "../auth/authMiddleware";
import { getNatalChart } from "../services/chartService";

export const chartRouter = Router();

/* Todas as rotas exigem autenticacao */
chartRouter.use(requireAuth);

/* ─── GET /api/chart/natal ──────────────────────────────────── */
chartRouter.get(
  "/natal",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getNatalChart(req.user!.userId);
      res.json({ ok: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

/* ─── POST /api/chart/pdf (stub — Phase 5) ───────────────────── */
chartRouter.post(
  "/pdf",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(501).json({ ok: false, message: "PDF export coming in Phase 5." });
    } catch (err) {
      next(err);
    }
  },
);
