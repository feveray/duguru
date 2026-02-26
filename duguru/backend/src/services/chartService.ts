/**
 * backend/src/services/chartService.ts
 *
 * Orquestra o calculo do mapa natal:
 *   1. Busca perfil do usuario (birthDate, birthLat, birthLon, houseSystem)
 *   2. Verifica cache NatalChartCache (TTL 24h, invalidado quando perfil muda)
 *   3. Calcula posicoes + casas + aspectos via ephemeris.ts
 *   4. Busca interpretacoes via interpretationProvider
 *   5. Persiste resultado no cache
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "../db/client";
import {
  dateToJulianDay,
  calcPlanet,
  calcHouses,
  getPlanetHouse,
  calcAspects,
  PLANET_IDS,
  type PlanetName,
  type PlanetPosition,
  type HouseData,
  type Aspect,
} from "../astro/ephemeris";
import { interpretationProvider } from "../astro/interpretationProvider";

/* --- Tipos publicos ------------------------------------------------------- */

export interface PlanetRow extends PlanetPosition {
  house: number;
}

export interface NatalChartResult {
  planets:         PlanetRow[];
  houses:          HouseData;
  aspects:         Aspect[];
  interpretations: {
    planetSign:  Record<string, string>;
    planetHouse: Record<string, string>;
  };
}

/* --- Constante ------------------------------------------------------------ */

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

/* --- Service -------------------------------------------------------------- */

/**
 * Retorna o mapa natal do usuario, usando cache quando valido.
 * Lanca um erro se o perfil estiver incompleto (birthLat/birthLon nulos).
 */
export async function getNatalChart(userId: string): Promise<NatalChartResult> {
  /* 1. Busca perfil ------------------------------------------------------- */
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      birthDate:   true,
      birthTime:   true,
      birthLat:    true,
      birthLon:    true,
      houseSystem: true,
    },
  });

  if (user.birthLat === null || user.birthLon === null) {
    throw Object.assign(new Error("Perfil incompleto: coordenadas de nascimento ausentes."), {
      status: 422,
    });
  }

  const hsys = (user.houseSystem ?? "P") as "P" | "K" | "W" | "E" | "C";
  const dateStr = user.birthDate.toISOString().substring(0, 10); // "YYYY-MM-DD"
  const cacheKey = `${dateStr}:${user.birthLat}:${user.birthLon}:${hsys}`;

  /* 2. Verifica cache ------------------------------------------------------ */
  const cached = await prisma.natalChartCache.findUnique({
    where: { userId },
  });

  if (
    cached &&
    cached.cacheKey === cacheKey &&
    cached.expiresAt > new Date()
  ) {
    return cached.payload as unknown as NatalChartResult;
  }

  /* 3. Calculo astrologico ------------------------------------------------- */
  const [hourStr, minStr] = (user.birthTime ?? "12:00").split(":");
  const hourDecimal = Number(hourStr ?? 12) + Number(minStr ?? 0) / 60;

  const d = user.birthDate;
  const jd = dateToJulianDay(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    hourDecimal,
  );

  const planetNames = Object.keys(PLANET_IDS) as PlanetName[];
  const planets: PlanetPosition[] = planetNames.map((k) => calcPlanet(jd, k));
  const houseData = calcHouses(jd, user.birthLat, user.birthLon, hsys);
  const aspects   = calcAspects(planets);

  /* 4. House membership --------------------------------------------------- */
  const planetsWithHouse: PlanetRow[] = planets.map((p) => ({
    ...p,
    house: getPlanetHouse(p.longitude, houseData.cusps),
  }));

  /* 5. Interpretacoes ------------------------------------------------------ */
  const planetSign:  Record<string, string> = {};
  const planetHouse: Record<string, string> = {};

  for (const p of planetsWithHouse) {
    planetSign[p.name]  = interpretationProvider.getPlanetInSign(p.name, p.sign);
    planetHouse[p.name] = interpretationProvider.getPlanetInHouse(p.name, p.house);
  }

  const result: NatalChartResult = {
    planets: planetsWithHouse,
    houses:  houseData,
    aspects,
    interpretations: { planetSign, planetHouse },
  };

  /* 6. Upsert cache -------------------------------------------------------- */
  const now = new Date();
  await prisma.natalChartCache.upsert({
    where:  { userId },
    update: {
      cacheKey,
      payload:      result as unknown as Prisma.InputJsonValue,
      calculatedAt: now,
      expiresAt:    new Date(now.getTime() + CACHE_TTL_MS),
    },
    create: {
      userId,
      cacheKey,
      payload:      result as unknown as Prisma.InputJsonValue,
      calculatedAt: now,
      expiresAt:    new Date(now.getTime() + CACHE_TTL_MS),
    },
  });

  return result;
}
