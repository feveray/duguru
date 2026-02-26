/**
 * backend/prisma/seeds/compatibilityScores.ts  — T086
 *
 * 144 registros pre-calculados (12×12 signos) com scores de
 * romance, amizade e trabalho para a tabela CompatibilityScore.
 *
 * Metodologia: baseada em elementos (fogo/terra/ar/água) e modalidades
 * (cardinal/fixo/mutável) com ajustes tradicionais da astrologia clássica.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Sign =
  | "aries" | "taurus" | "gemini" | "cancer"
  | "leo" | "virgo" | "libra" | "scorpio"
  | "sagittarius" | "capricorn" | "aquarius" | "pisces";

const SIGNS: Sign[] = [
  "aries", "taurus", "gemini", "cancer",
  "leo", "virgo", "libra", "scorpio",
  "sagittarius", "capricorn", "aquarius", "pisces",
];

/* Elemento por signo */
const ELEMENT: Record<Sign, "fire" | "earth" | "air" | "water"> = {
  aries: "fire", taurus: "earth", gemini: "air", cancer: "water",
  leo: "fire", virgo: "earth", libra: "air", scorpio: "water",
  sagittarius: "fire", capricorn: "earth", aquarius: "air", pisces: "water",
};

/* Modalidade por signo */
const MODALITY: Record<Sign, "cardinal" | "fixed" | "mutable"> = {
  aries: "cardinal", taurus: "fixed", gemini: "mutable", cancer: "cardinal",
  leo: "fixed", virgo: "mutable", libra: "cardinal", scorpio: "fixed",
  sagittarius: "mutable", capricorn: "cardinal", aquarius: "fixed", pisces: "mutable",
};

/** Distância zodiacal em etapas de 30° (0–11) */
function zodiacDistance(a: Sign, b: Sign): number {
  const ia = SIGNS.indexOf(a);
  const ib = SIGNS.indexOf(b);
  const diff = Math.abs(ia - ib);
  return Math.min(diff, 12 - diff);
}

/**
 * Calcula os scores de compatibilidade entre dois signos.
 * Retorna valores de 0–100. A lógica é baseada em:
 * - Elementos complementares (fogo+ar, terra+água)
 * - Distância zodiacal (trígono=120°→alto, sextil=60°→bom, etc.)
 * - Modalidades (mesma = tensão no trabalho mas paixão no romance)
 */
function calcScores(a: Sign, b: Sign): { romance: number; friendship: number; work: number } {
  // Caso especial: mesmo signo
  if (a === b) return { romance: 75, friendship: 78, work: 72 };

  const distance = zodiacDistance(a, b); // 1–6

  /* Base por distância zodiacal */
  const distanceBase: Record<number, number> = {
    1: 55,  // semissextil – neutro
    2: 70,  // sextil – harmônico
    3: 60,  // quadratura – tensão produtiva
    4: 82,  // trígono – grande fluxo
    5: 45,  // quincúncio – difícil
    6: 65,  // oposição – atração e tensão
  };

  const base = distanceBase[distance] ?? 60;

  const elA = ELEMENT[a];
  const elB = ELEMENT[b];
  const modA = MODALITY[a];
  const modB = MODALITY[b];

  /* Bônus de elemento */
  let elBonus = 0;
  if (elA === elB) elBonus = 8;
  else if (
    (elA === "fire" && elB === "air") || (elA === "air" && elB === "fire") ||
    (elA === "earth" && elB === "water") || (elA === "water" && elB === "earth")
  ) {
    elBonus = 12; // elementos complementares
  } else {
    elBonus = -5; // elementos conflitantes
  }

  /* Bônus de modalidade */
  let modBonus = 0;
  if (modA === modB) modBonus = -5; // mesma modalidade pode gerar tensão
  else modBonus = 5;

  const clamp = (n: number) => Math.min(100, Math.max(20, n));

  const romance    = clamp(base + elBonus + modBonus + (distance === 4 ? 5 : 0));
  const friendship = clamp(base + elBonus + (modA === modB ? 3 : 6));
  const work       = clamp(base + modBonus + (elA === elB ? 5 : 0) + (distance === 6 ? -5 : 0));

  return { romance, friendship, work };
}

export async function seedCompatibilityScores(): Promise<void> {
  console.log("💫 Seeding compatibility scores (12×12)…");

  let created = 0;

  for (const sign1 of SIGNS) {
    for (const sign2 of SIGNS) {
      const scores = calcScores(sign1, sign2);
      await prisma.compatibilityScore.upsert({
        where:  { sign1_sign2: { sign1, sign2 } },
        update: scores,
        create: { sign1, sign2, ...scores },
      });
      created++;
    }
  }

  console.log(`✅ Compatibility scores: ${created} upserted.`);
}
