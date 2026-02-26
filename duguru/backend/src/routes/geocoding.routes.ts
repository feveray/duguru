import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { geocodeCity } from "../services/geocodingService";
import { createError } from "../middleware/errorHandler";

export const geocodingRouter = Router();

const querySchema = z.object({
  q: z.string().min(2, "Termo de busca deve ter ao menos 2 caracteres."),
});

/**
 * GET /api/geocoding/search?q=<city>
 *
 * Busca cidades pelo nome. Retorna até 8 resultados com
 * cidade, país, lat, lon e timezone.
 */
geocodingRouter.get(
  "/search",
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(" | ");
      return next(createError(422, "VALIDATION_ERROR", message));
    }

    try {
      const results = await geocodeCity(parsed.data.q);
      return res.json({ results });
    } catch (err) {
      return next(err);
    }
  },
);
