/**
 * backend/src/astro/synastry.ts
 *
 * Calcula aspectos entre dois mapas natais (sinastria).
 * PURO — zero I/O.
 *
 * Orbes diferenciados por classe de planeta (FR-041):
 *   - Luminários (Sol, Lua): ± 8°
 *   - Planetas pessoais (Mercúrio, Vênus, Marte): ± 6°
 *   - Planetas transpessoais (Júpiter, Saturno, Urano, Netuno, Plutão): ± 4°
 *
 * O orbe aplicado a um par é o MAIOR entre os dois planetas envolvidos.
 */
import { type PlanetPosition, type AspectType } from "./ephemeris";

export interface SynastryAspect {
  planet1:   string;   // planeta do mapa 1
  planet2:   string;   // planeta do mapa 2
  type:      AspectType;
  orb:       number;
  applying:  boolean;
  /** 0–100: intensidade do aspecto (quanto menor o orbe, maior a intensidade) */
  intensity: number;
  /** Influência resumida para exibição ao usuário */
  influence: string;
}

/* --- Definições de aspectos para sinastria (5 principais) ----------------- */

interface SynastryAspectDef {
  type:  AspectType;
  angle: number;
  /** Orbe BASE (máx por tipo de aspecto). O orbe de planeta sobrescreve se menor. */
  maxOrb: number;
}

const SYNASTRY_ASPECT_DEFS: SynastryAspectDef[] = [
  { type: "conjunction", angle: 0,   maxOrb: 8 },
  { type: "sextile",     angle: 60,  maxOrb: 8 },
  { type: "square",      angle: 90,  maxOrb: 8 },
  { type: "trine",       angle: 120, maxOrb: 8 },
  { type: "opposition",  angle: 180, maxOrb: 8 },
];

/* --- Orbes por classe de planeta ------------------------------------------ */

type PlanetClass = "luminary" | "personal" | "transpersonal";

const PLANET_CLASS: Record<string, PlanetClass> = {
  sun:     "luminary",
  moon:    "luminary",
  mercury: "personal",
  venus:   "personal",
  mars:    "personal",
  jupiter: "transpersonal",
  saturn:  "transpersonal",
  uranus:  "transpersonal",
  neptune: "transpersonal",
  pluto:   "transpersonal",
};

const CLASS_ORB: Record<PlanetClass, number> = {
  luminary:      8,
  personal:      6,
  transpersonal: 4,
};

/** Retorna o orbe máximo para um par de planetas: max(classOrb(p1), classOrb(p2)) */
function getPairOrb(p1: string, p2: string): number {
  const c1  = PLANET_CLASS[p1] ?? "transpersonal";
  const c2  = PLANET_CLASS[p2] ?? "transpersonal";
  return Math.max(CLASS_ORB[c1], CLASS_ORB[c2]);
}

/* --- Influências textuais por tipo de aspecto ----------------------------- */

const ASPECT_INFLUENCES: Record<AspectType, { harmony: string; tension: string }> = {
  conjunction: {
    harmony:  "União intensa — ambas as energias se fundem e se amplificam mutuamente.",
    tension:  "Fusão intensa que pode gerar tanto atração forte quanto atrito direto.",
  },
  sextile: {
    harmony:  "Fluxo fácil e oportunidades de cooperação e crescimento mútuo.",
    tension:  "Fluxo fácil e oportunidades de cooperação e crescimento mútuo.",
  },
  trine: {
    harmony:  "Harmonia natural e comprensão profunda — fluência e suporte recíprocos.",
    tension:  "Harmonia natural e comprensão profunda — fluência e suporte recíprocos.",
  },
  square: {
    harmony:  "Tensão criativa que estimula crescimento pessoal e evolução mútua.",
    tension:  "Fricção e desafios que exigem paciência, ajustes e comprometimento.",
  },
  opposition: {
    harmony:  "Polaridade magnética — atração de opostos com potencial de complementaridade.",
    tension:  "Conflito de perspectivas opostas que projeta sombras mútuas.",
  },
  quincunx: {
    harmony:  "Ajuste constante necessário — exige adaptação e revisão de expectativas.",
    tension:  "Ajuste constante necessário — exige adaptação e revisão de expectativas.",
  },
};

const HARMONIOUS_ASPECTS = new Set<AspectType>(["trine", "sextile"]);
const CHALLENGING_ASPECTS = new Set<AspectType>(["square", "opposition"]);

function getInfluence(type: AspectType, orb: number): string {
  const texts = ASPECT_INFLUENCES[type] ?? ASPECT_INFLUENCES.conjunction;
  const isHarmonious = HARMONIOUS_ASPECTS.has(type);
  const isChallenging = CHALLENGING_ASPECTS.has(type);

  if (orb < 2) {
    // Aspecto exacto: usar texto de harmonia se harmônico, tensão se desafiador
    return isHarmonious ? texts.harmony : isChallenging ? texts.tension : texts.harmony;
  }
  return isHarmonious ? texts.harmony : texts.tension;
}

/* --- Utilitário ----------------------------------------------------------- */

function angularDiff(lon1: number, lon2: number): number {
  const d = Math.abs(lon1 - lon2) % 360;
  return d > 180 ? 360 - d : d;
}

/* --- API pública ---------------------------------------------------------- */

/**
 * Calcula aspectos de sinastria entre dois conjuntos de posições planetárias.
 * Implementa orbes da FR-041: ± 8° luminários, ± 6° pessoais, ± 4° transpessoais.
 * Puro: determinístico, sem I/O.
 */
export function calcSynastryAspects(
  positions1: PlanetPosition[],
  positions2: PlanetPosition[],
): SynastryAspect[] {
  const aspects: SynastryAspect[] = [];

  for (const p1 of positions1) {
    for (const p2 of positions2) {
      const diff   = angularDiff(p1.longitude, p2.longitude);
      const pairOrb = getPairOrb(p1.name, p2.name);

      for (const def of SYNASTRY_ASPECT_DEFS) {
        const allowedOrb = Math.min(def.maxOrb, pairOrb);
        const orb        = Math.abs(diff - def.angle);

        if (orb <= allowedOrb) {
          // Determinar applying: será que o orbe diminui no futuro?
          const futP1 = p1.longitude + p1.speed * 0.01;
          const futP2 = p2.longitude + p2.speed * 0.01;
          const futOrb = Math.abs(angularDiff(futP1, futP2) - def.angle);

          // Intensidade: 100 quando orbe = 0, 0 quando orbe = allowedOrb
          const intensity = Math.round(((allowedOrb - orb) / allowedOrb) * 100);

          aspects.push({
            planet1:   p1.name,
            planet2:   p2.name,
            type:      def.type,
            orb:       Math.round(orb * 100) / 100,
            applying:  futOrb < orb,
            intensity,
            influence: getInfluence(def.type, orb),
          });
        }
      }
    }
  }

  return aspects;
}

/**
 * Calcula um score de sinastria (0–100) agregado a partir dos aspectos.
 * Aspectos harmônicos contribuem positivamente; desafiadores, negativamente.
 */
export function calcSynastryScore(aspects: SynastryAspect[]): {
  overall:    number;
  romance:    number;
  friendship: number;
  work:       number;
} {
  if (aspects.length === 0) {
    return { overall: 50, romance: 50, friendship: 50, work: 50 };
  }

  let harmonyTotal = 0;
  let challengeTotal = 0;

  for (const asp of aspects) {
    const weight = asp.intensity / 100;
    if (HARMONIOUS_ASPECTS.has(asp.type)) {
      harmonyTotal += weight;
    } else if (CHALLENGING_ASPECTS.has(asp.type)) {
      challengeTotal += weight;
    }
    // conjunction: neutro (adiciona à harmonia com meio peso)
    else if (asp.type === "conjunction") {
      harmonyTotal += weight * 0.5;
    }
  }

  const total    = harmonyTotal + challengeTotal || 1;
  const harmonyPct = (harmonyTotal / total) * 100;

  // Mapear para 20–95 para evitar extremos impossíveis
  const clamp = (v: number) => Math.min(95, Math.max(20, Math.round(v)));

  // Romance favorece harmonia emocional (pesos planetários lunarmente)
  const romanceBonus = calcAreaScore(aspects, ["sun", "moon", "venus"], 10);
  // Amizade favorece aspectos de ar e Jupiter
  const friendshipBonus = calcAreaScore(aspects, ["mercury", "jupiter", "moon"], 8);
  // Trabalho favorece Saturno, Marte e Mercúrio
  const workBonus = calcAreaScore(aspects, ["mars", "saturn", "mercury"], 8);

  return {
    overall:    clamp(harmonyPct),
    romance:    clamp(harmonyPct + romanceBonus),
    friendship: clamp(harmonyPct + friendshipBonus),
    work:       clamp(harmonyPct + workBonus),
  };
}

/** Score de área baseado em planetas relevantes */
function calcAreaScore(
  aspects: SynastryAspect[],
  planets: string[],
  weight: number,
): number {
  const planetSet = new Set(planets);
  let bonus = 0;
  for (const asp of aspects) {
    const relevant = planetSet.has(asp.planet1) || planetSet.has(asp.planet2);
    if (!relevant) continue;
    if (HARMONIOUS_ASPECTS.has(asp.type)) bonus += (asp.intensity / 100) * weight;
    else if (CHALLENGING_ASPECTS.has(asp.type)) bonus -= (asp.intensity / 100) * weight;
  }
  return Math.round(bonus);
}
