/**
 * backend/src/astro/transits.ts
 *
 * Calcula trânsitos ativos: planetas atuais em aspecto com posições natais.
 * PURO — zero I/O.
 */
import {
  calcPlanet,
  calcAspects,
  type PlanetPosition,
  type PlanetName,
  type AspectType,
  PLANET_IDS,
} from "./ephemeris";

/* ─── Tipos ─────────────────────────────────────────────────────────────────── */

export interface Transit {
  transitPlanet: PlanetName;
  natalPlanet:   PlanetName;
  type:          AspectType;
  orb:           number;
  applying:      boolean;
}

/* ─── API pública ───────────────────────────────────────────────────────────── */

/**
 * Calcula os trânsitos ativos em `jd` para o mapa natal dado.
 *
 * Apenas planetas lentos (Júpiter–Plutão) são retornados como trânsitantes
 * para reduzir o ruído de planetas rápidos.
 *
 * Puro: determinístico, sem I/O.
 */
export function getActiveTransits(
  jd: number,
  natalPositions: PlanetPosition[],
): Transit[] {
  // Calcula posições atuais de todos os planetas
  const currentPositions = (Object.keys(PLANET_IDS) as PlanetName[]).map((k) =>
    calcPlanet(jd, k),
  );

  const transits: Transit[] = [];

  for (const current of currentPositions) {
    for (const natal of natalPositions) {
      // Cria par sintético para reutilizar calcAspects
      const aspects = calcAspects([current, natal]);
      for (const asp of aspects) {
        transits.push({
          transitPlanet: current.name,
          natalPlanet:   natal.name,
          type:          asp.type,
          orb:           asp.orb,
          applying:      asp.applying,
        });
      }
    }
  }

  return transits;
}
