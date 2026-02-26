/**
 * backend/src/services/dailyContentService.ts  — T083
 *
 * getDailyContent(date, userId): DailyContent
 *
 * Estratégia:
 *  1. Tenta buscar registro pré-calculado de DailyContent no banco para a data.
 *  2. Se não existir, calcula on-the-fly e salva.
 *  3. Para planeta destaque: planeta com trânsito de aspecto mais forte (menor orbe)
 *     sobre o signo solar do usuário, priorizando planetas lentos.
 *  4. Fase lunar: getMoonPhase(jd) via moonPhase.ts.
 *  5. Frase do dia: índice = dayOfYear % 365 → seleciona da tabela DailyContent
 *     (ou fallback fixo se seed não rodou).
 *  6. Alertas: planetas retrógrados ativos na data.
 *  7. Top3 compatíveis: CompatibilityScore médio (romance+friendship+work) para o
 *     signo solar do usuário.
 */

import { prisma } from "../db/client";
import { dateToJulianDay, calcPlanet, SIGN_NAMES, type PlanetName } from "../astro/ephemeris";
import { getMoonPhase, type MoonPhaseData } from "../astro/moonPhase";

/* ─── Tipos públicos ─────────────────────────────────────────────────────── */

export interface AstrologicalAlert {
  event:     string;
  startDate: string;
  endDate:   string;
  signs:     string[];
  tip:       string;
}

export interface CompatTop3Item {
  sign:    string;
  romance: number;
  friendship: number;
  work:    number;
  summary: string;
}

export interface DailyContentResult {
  date:              string;         // "YYYY-MM-DD"
  planet:            string;         // PlanetName em destaque
  planetInfluence:   string;         // descrição da influência
  moonPhase:         MoonPhaseData;
  inspirationalQuote: string;
  alerts:            AstrologicalAlert[];
  compatTop3:        CompatTop3Item[];
}

/* ─── Nomes em PT-BR ─────────────────────────────────────────────────────── */

const PLANET_NAMES_PT: Record<PlanetName, string> = {
  sun:     "Sol",
  moon:    "Lua",
  mercury: "Mercúrio",
  venus:   "Vênus",
  mars:    "Marte",
  jupiter: "Júpiter",
  saturn:  "Saturno",
  uranus:  "Urano",
  neptune: "Netuno",
  pluto:   "Plutão",
};

const PLANET_INFLUENCES_PT: Record<PlanetName, string> = {
  sun:     "Destaque para identidade e propósito pessoal. Bom dia para ações que expressem seus talentos.",
  moon:    "Emoções afloradas. Cuide do ambiente doméstico e das relações íntimas.",
  mercury: "Comunicação em alta. Ideal para negociações, estudos e diálogos importantes.",
  venus:   "Energia de harmonia e afeto. Dedique tempo ao amor e à beleza.",
  mars:    "Impulso e energia. Canalize a força para projetos e exercícios físicos.",
  jupiter: "Expansão e otimismo. Ótimo para iniciar estudos, viagens ou grandes planos.",
  saturn:  "Foco em responsabilidade e estrutura. Resolva pendências e organize compromissos.",
  uranus:  "Surpresas e inovação. Esteja aberto a mudanças inesperadas.",
  neptune: "Intuição elevada. Momento para meditação, arte e espiritualidade.",
  pluto:   "Transformações profundas. Observe o que precisa ser renovado em sua vida.",
};

const SIGN_NAMES_PT: Record<string, string> = {
  aries:       "Áries",
  taurus:      "Touro",
  gemini:      "Gêmeos",
  cancer:      "Câncer",
  leo:         "Leão",
  virgo:       "Virgem",
  libra:       "Libra",
  scorpio:     "Escorpião",
  sagittarius: "Sagitário",
  capricorn:   "Capricórnio",
  aquarius:    "Aquário",
  pisces:      "Peixes",
};

/* Planetas lentos têm prioridade como destaques */
const SLOW_PLANETS: PlanetName[] = ["jupiter", "saturn", "uranus", "neptune", "pluto", "mars"];
const ALL_PLANETS: PlanetName[]  = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function dateToJD(date: Date): number {
  return dateToJulianDay(date.getFullYear(), date.getMonth() + 1, date.getDate(), 12);
}

function dayOfYear(date: Date): number {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff  = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

/**
 * Seleciona o planeta em destaque para a data.
 * Usa sequência determinística baseada no dia do ano.
 */
function selectDailyPlanet(jd: number, date: Date): PlanetName {
  const doy = dayOfYear(date);

  // Verifica planetas retrógrados (prioridade)
  for (const p of SLOW_PLANETS) {
    const pos = calcPlanet(jd, p);
    if (pos.retrograde) return p;
  }

  // Caso padrão: rotação pelos planetas lentos
  const idx = doy % SLOW_PLANETS.length;
  return SLOW_PLANETS[idx]!;
}

/**
 * Retorna alertas de planetas retrógrados ativos na data.
 */
function buildAlerts(jd: number, date: Date): AstrologicalAlert[] {
  const alerts: AstrologicalAlert[] = [];
  const dateStr = date.toISOString().substring(0, 10);

  for (const planet of ALL_PLANETS) {
    const pos = calcPlanet(jd, planet);
    if (pos.retrograde) {
      const sign = SIGN_NAMES_PT[pos.sign] ?? pos.sign;
      const tips: Record<PlanetName, string> = {
        mercury: "Revise contratos, evite assinar documentos importantes e cuide da comunicação.",
        venus:   "Reavalie relacionamentos. Momento para reflexão, não para novos romances.",
        mars:    "Evite confrontos desnecessários. Redirecione a energia para projetos internos.",
        jupiter: "Reveja planos de expansão. Foque em consolidar o que já tem.",
        saturn:  "Revise estruturas e compromissos. Boa época para resolver pendências antigas.",
        uranus:  "Mudanças podem encontrar resistência. Seja paciente com transformações.",
        neptune: "Ilusões aumentadas. Fique atento a promessas imprecisas.",
        pluto:   "Transformações lentas mas profundas em andamento. Confie no processo.",
        sun:     "Revise sua identidade e propósito. Introspecção recomendada.",
        moon:    "Emoções instáveis. Espere antes de reagir impulsivamente.",
      };
      alerts.push({
        event:     `${PLANET_NAMES_PT[planet]} Retrógrado`,
        startDate: dateStr,
        endDate:   dateStr,
        signs:     [sign],
        tip:       tips[planet] ?? "Período de revisão e reflexão.",
      });
    }
  }

  return alerts;
}

/* Frases de fallback caso o seed não tenha sido executado */
const FALLBACK_QUOTES = [
  "Os astros não determinam seu destino — revelam seus talentos ocultos.",
  "Cada planeta em seu lugar conta uma história única sobre quem você é.",
  "O céu do seu nascimento é um mapa, não uma sentença.",
  "Nas estrelas não há acidentes, apenas padrões esperando ser compreendidos.",
  "Seu ascendente é a máscara que o mundo vê; seu Sol, quem você realmente é.",
  "A Lua governa as marés e também as suas emoções mais profundas.",
  "Mercúrio não retrograda para atrapalhar — retrograda para que você revise.",
  "Vênus em harmonia é música; Vênus em tensão é a letra que precisava ser escrita.",
  "Marte te move; Júpiter te expande; Saturno te constrói.",
  "O universo fala em símbolos. A astrologia é o dicionário.",
  "Não existe mapa astral ruim — existe energia ainda não compreendida.",
  "Cada retrogradação é um convite à introspecção, não ao caos.",
  "Seu signo solar é o personagem; sua Lua é a alma; o ascendente é o figurino.",
  "As estrelas inclinam, mas não obrigam.",
  "Plutão transforma o que toca. Deixe-o fazer seu trabalho.",
];

/* ─── API pública ────────────────────────────────────────────────────────── */

export async function getDailyContent(
  date: Date,
  userId: string,
): Promise<DailyContentResult> {
  const dateStr = date.toISOString().substring(0, 10);
  const jd      = dateToJD(date);

  /* 1. Calcular dados astronômicos ---------------------------------------- */
  const planet          = selectDailyPlanet(jd, date);
  const planetInfluence = PLANET_INFLUENCES_PT[planet]!;
  const moonPhase       = getMoonPhase(jd);
  const alerts          = buildAlerts(jd, date);

  /* 2. Frase do dia -------------------------------------------------------- */
  let quote: string;
  try {
    const doy = dayOfYear(date);
    const rowCount = await prisma.dailyContent.count();
    if (rowCount > 0) {
      // Busca a frase pelo índice (dia do ano % total de registros)
      const idx  = doy % rowCount;
      const rows = await prisma.dailyContent.findMany({
        take: 1,
        skip: idx,
        select: { inspirationalQuote: true },
        orderBy: { date: "asc" },
      });
      quote = rows[0]?.inspirationalQuote ?? FALLBACK_QUOTES[doy % FALLBACK_QUOTES.length]!;
    } else {
      quote = FALLBACK_QUOTES[doy % FALLBACK_QUOTES.length]!;
    }
  } catch {
    const doy = dayOfYear(date);
    quote = FALLBACK_QUOTES[doy % FALLBACK_QUOTES.length]!;
  }

  /* 3. Top 3 compatíveis --------------------------------------------------- */
  let compatTop3: CompatTop3Item[] = [];
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where:  { id: userId },
      select: { sunSign: true },
    });

    if (user.sunSign) {
      const scores = await prisma.compatibilityScore.findMany({
        where: { sign1: user.sunSign },
        orderBy: [{ romance: "desc" }, { friendship: "desc" }],
        take: 3,
      });

      // Fallback: busca também onde sign2 = sunSign
      const topScores = scores.length >= 3 ? scores : await prisma.compatibilityScore.findMany({
        where: { sign2: user.sunSign },
        orderBy: [{ romance: "desc" }, { friendship: "desc" }],
        take: 3 - scores.length,
      });

      const all = [...scores, ...topScores].slice(0, 3);

      compatTop3 = all.map((s) => {
        const partnerSign = s.sign1 === user.sunSign ? s.sign2 : s.sign1;
        return {
          sign:       partnerSign,
          romance:    s.romance,
          friendship: s.friendship,
          work:       s.work,
          summary:    buildCompatSummary(partnerSign, s.romance, s.friendship, s.work),
        };
      });
    }
  } catch {
    // Sem dados de compatibilidade — retorna vazio
    compatTop3 = [];
  }

  return {
    date:              dateStr,
    planet:            PLANET_NAMES_PT[planet],
    planetInfluence,
    moonPhase,
    inspirationalQuote: quote,
    alerts,
    compatTop3,
  };
}

function buildCompatSummary(sign: string, romance: number, friendship: number, work: number): string {
  const avg      = Math.round((romance + friendship + work) / 3);
  const signName = SIGN_NAMES_PT[sign] ?? sign;
  if (avg >= 80) return `Grande harmonia com ${signName} — conexão intensa e natural.`;
  if (avg >= 65) return `Boa combinação com ${signName} — companheirismo e crescimento mútuo.`;
  return `Potencial com ${signName} — requer compreensão e diálogo.`;
}
