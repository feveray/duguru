/**
 * backend/src/astro/interpretationProvider.ts
 *
 * Fornece textos interpretativos para combinações planeta/signo e planeta/casa.
 * JSONs curados carregados na inicialização do processo — ZERO I/O em produção.
 */
import planetsInSignsRaw from "./interpretations/planets-in-signs.json";
import planetsInHousesRaw from "./interpretations/planets-in-houses.json";

import type { PlanetName, SignName } from "./ephemeris";

/* ─── Interface pública ─────────────────────────────────────────────────────── */

export interface InterpretationProvider {
  getPlanetInSign(planet: PlanetName, sign: SignName): string;
  getPlanetInHouse(planet: PlanetName, house: number): string;
}

/* ─── Implementação curada ──────────────────────────────────────────────────── */

const planetsInSigns  = planetsInSignsRaw  as Record<string, string>;
const planetsInHouses = planetsInHousesRaw as Record<string, string>;

class CuratedInterpretationProvider implements InterpretationProvider {
  getPlanetInSign(planet: PlanetName, sign: SignName): string {
    const key = `${planet}_${sign}`;
    return planetsInSigns[key] ?? `${planet} em ${sign} — interpretação em elaboração.`;
  }

  getPlanetInHouse(planet: PlanetName, house: number): string {
    const key = `${planet}_house_${house}`;
    return planetsInHouses[key] ?? `${planet} na casa ${house} — interpretação em elaboração.`;
  }
}

/** Singleton — instanciado uma vez na inicialização do processo */
export const interpretationProvider: InterpretationProvider =
  new CuratedInterpretationProvider();
