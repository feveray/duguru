/**
 * backend/src/routes/dashboard.routes.ts  — T085
 *
 * GET /api/daily — retorna o conteúdo do dashboard para a data atual.
 * Requer autenticação via Bearer JWT.
 */
import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth } from "../auth/authMiddleware";
import { getDailyContent } from "../services/dailyContentService";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

/* ─── GET /api/daily ────────────────────────────────────────────────────── */
dashboardRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const today   = new Date();
      const content = await getDailyContent(today, req.user!.userId);
      res.json({ ok: true, data: content });
    } catch (err) {
      next(err);
    }
  },
);
