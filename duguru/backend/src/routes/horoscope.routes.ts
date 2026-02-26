/**
 * backend/src/routes/horoscope.routes.ts  — T098
 *
 * GET /api/horoscope/:period   — day | week | month | year
 * Requer autenticação. Opcionalmente aceita ?useAscendant=true
 */
import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/authMiddleware";
import { getHoroscope, type HoroscopePeriod } from "../services/horoscopeService";
import { prisma } from "../db/client";
import { SIGN_NAMES, type SignName } from "../astro/ephemeris";

export const horoscopeRouter = Router();

horoscopeRouter.use(requireAuth);

const periodSchema = z.enum(["day", "week", "month", "year"]);

/* ─── GET /api/horoscope/:period ────────────────────────────────────────── */
horoscopeRouter.get(
  "/:period",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      /* Valida parâmetro */
      const periodParsed = periodSchema.safeParse(req.params["period"]);
      if (!periodParsed.success) {
        res.status(400).json({
          ok: false,
          error: { code: "INVALID_PERIOD", message: "period deve ser day, week, month ou year", status: 400 },
        });
        return;
      }
      const period = periodParsed.data as HoroscopePeriod;

      /* Obtém signo do usuário */
      const useAscendant = req.query["useAscendant"] === "true";

      const user = await prisma.user.findUniqueOrThrow({
        where:  { id: req.user!.userId },
        select: { sunSign: true, ascendant: true },
      });

      const raw = useAscendant && user.ascendant ? user.ascendant : user.sunSign;

      // Valida o signo (deve ser um dos 12)
      if (!raw || !SIGN_NAMES.includes(raw as SignName)) {
        res.status(422).json({
          ok: false,
          error: {
            code: "NO_SIGN",
            message: "Perfil incompleto: signo solar não calculado. Acesse /mapa-natal primeiro.",
            status: 422,
          },
        });
        return;
      }

      const sign = raw as SignName;
      const result = await getHoroscope(sign, period);

      res.json({ ok: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);
