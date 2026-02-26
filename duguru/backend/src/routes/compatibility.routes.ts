/**
 * backend/src/routes/compatibility.routes.ts  — T108 + T109
 *
 * GET  /api/compatibility?sign1=&sign2=
 *   Retorna CompatibilityScore do banco (pre-seeded 12×12).
 *   Cache em Neon (PostgreSQL) via tabela CompatibilityScore.
 *   Requer autenticação.
 *
 * POST /api/synastry
 *   Aceita dois conjuntos de dados de nascimento.
 *   Calcula posições planetárias e aspectos de sinastria.
 *   Retorna lista de aspectos + score agregado.
 *   Requer autenticação.
 */
import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/authMiddleware";
import { prisma } from "../db/client";
import {
  dateToJulianDay,
  calcPlanet,
  PLANET_IDS,
  SIGN_NAMES,
  type PlanetName,
  type PlanetPosition,
  type SignName,
} from "../astro/ephemeris";
import {
  calcSynastryAspects,
  calcSynastryScore,
} from "../astro/synastry";

export const compatibilityRouter = Router();
export const synastryRouter      = Router();

/* Todos os endpoints requerem JWT -------------------------------------------*/
compatibilityRouter.use(requireAuth);
synastryRouter.use(requireAuth);

/* ─── Validação de signos ────────────────────────────────────────────────── */

function isValidSign(s: string): s is SignName {
  return (SIGN_NAMES as readonly string[]).includes(s);
}

/* Normaliza o par de signos para que sign1 ≤ sign2 lexicograficamente,
   permitindo usar o mesmo registro independente da ordem enviada pelo cliente. */
function normalizePair(s1: SignName, s2: SignName): [SignName, SignName] {
  return s1 <= s2 ? [s1, s2] : [s2, s1];
}

/* ─── GET /api/compatibility ─────────────────────────────────────────────── */

compatibilityRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sign1: raw1, sign2: raw2 } = req.query;

      /* Validar presença */
      if (!raw1 || !raw2) {
        res.status(400).json({
          ok: false,
          error: {
            code:    "MISSING_SIGNS",
            message: "Os parâmetros sign1 e sign2 são obrigatórios.",
            status:  400,
          },
        });
        return;
      }

      const s1 = String(raw1).toLowerCase();
      const s2 = String(raw2).toLowerCase();

      /* Validar valores */
      if (!isValidSign(s1) || !isValidSign(s2)) {
        res.status(400).json({
          ok: false,
          error: {
            code:    "INVALID_SIGN",
            message: `Signo inválido. Use um dos 12 signos: ${SIGN_NAMES.join(", ")}.`,
            status:  400,
          },
        });
        return;
      }

      const [normalSign1, normalSign2] = normalizePair(s1, s2);

      /* Busca no cache do Neon (tabela CompatibilityScore) ------------------- */
      const score = await prisma.compatibilityScore.findFirst({
        where: {
          OR: [
            { sign1: normalSign1, sign2: normalSign2 },
            { sign1: normalSign2, sign2: normalSign1 },
          ],
        },
      });

      if (!score) {
        res.status(404).json({
          ok: false,
          error: {
            code:    "SCORE_NOT_FOUND",
            message: "Score de compatibilidade não encontrado. Execute o seed do banco de dados.",
            status:  404,
          },
        });
        return;
      }

      res.json({
        ok: true,
        data: {
          sign1:      s1,
          sign2:      s2,
          romance:    score.romance,
          friendship: score.friendship,
          work:       score.work,
          updatedAt:  score.updatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/* ─── POST /api/synastry ─────────────────────────────────────────────────── *//** Schema de dados de nascimento de uma pessoa */
const birthDataSchema = z.object({
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato esperado: YYYY-MM-DD"),
  birthTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Formato esperado: HH:MM")
    .optional(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

const synastryBodySchema = z.object({
  person1: birthDataSchema,
  person2: birthDataSchema,
});

/** Calcula posições dos 10 planetas para uma data/hora/coordenada */
function buildPositions(
  dateStr: string,
  timeStr: string | undefined,
  lat: number,
  lon: number,
): PlanetPosition[] {
  const [y, m, d] = dateStr.split("-").map(Number) as [number, number, number];
  const hour = timeStr
    ? (() => {
        const [hh, mm] = timeStr.split(":").map(Number) as [number, number];
        return hh + mm / 60;
      })()
    : 12; // meio-dia solar quando horário desconhecido

  const jd = dateToJulianDay(y, m, d, hour);

  return (Object.keys(PLANET_IDS) as PlanetName[]).map((name) =>
    calcPlanet(jd, name),
  );
}

synastryRouter.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      /* Validação do body */
      const parsed = synastryBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          ok: false,
          error: {
            code:    "VALIDATION_ERROR",
            message: parsed.error.errors.map((e) => e.message).join("; "),
            status:  400,
          },
        });
        return;
      }

      const { person1, person2 } = parsed.data;

      /* Cálculo de posições — puro, sem I/O */
      const positions1 = buildPositions(
        person1.birthDate,
        person1.birthTime,
        person1.lat,
        person1.lon,
      );
      const positions2 = buildPositions(
        person2.birthDate,
        person2.birthTime,
        person2.lat,
        person2.lon,
      );

      /* Aspectos de sinastria com orbes 8°/6°/4° */
      const aspects = calcSynastryAspects(positions1, positions2);

      /* Score agregado */
      const score = calcSynastryScore(aspects);

      res.json({
        ok: true,
        data: {
          aspects,
          score,
          person1: {
            birthDate: person1.birthDate,
            birthTime: person1.birthTime ?? "12:00",
            lat:       person1.lat,
            lon:       person1.lon,
          },
          person2: {
            birthDate: person2.birthDate,
            birthTime: person2.birthTime ?? "12:00",
            lat:       person2.lat,
            lon:       person2.lon,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },
);
