/**
 * frontend/src/lib/zodiacSymbols.ts
 *
 * Glifos Unicode dos planetas e signos para uso na mandala SVG.
 */

export const PLANET_GLYPHS: Record<string, string> = {
  sun:     "☉",
  moon:    "☽",
  mercury: "☿",
  venus:   "♀",
  mars:    "♂",
  jupiter: "♃",
  saturn:  "♄",
  uranus:  "♅",
  neptune: "♆",
  pluto:   "♇",
};

export const SIGN_GLYPHS: Record<string, string> = {
  aries:       "♈",
  taurus:      "♉",
  gemini:      "♊",
  cancer:      "♋",
  leo:         "♌",
  virgo:       "♍",
  libra:       "♎",
  scorpio:     "♏",
  sagittarius: "♐",
  capricorn:   "♑",
  aquarius:    "♒",
  pisces:      "♓",
};

/** Cores dos planetas para marcadores e glyfos */
export const PLANET_COLORS: Record<string, string> = {
  sun:     "#FFD700",
  moon:    "#C0C0C0",
  mercury: "#A8A9AD",
  venus:   "#F4A460",
  mars:    "#E25822",
  jupiter: "#DAA520",
  saturn:  "#8B7765",
  uranus:  "#5F9EA0",
  neptune: "#4B0082",
  pluto:   "#8B008B",
};

/** Cores dos elementos para as faixas de signos */
export const ELEMENT_COLORS: Record<string, string> = {
  fire:  "rgba(220,60,30,0.25)",
  earth: "rgba(100,160,60,0.25)",
  air:   "rgba(90,160,220,0.25)",
  water: "rgba(60,100,200,0.25)",
};

/** Elemento de cada signo */
export const SIGN_ELEMENTS: Record<string, "fire" | "earth" | "air" | "water"> = {
  aries:       "fire",
  taurus:      "earth",
  gemini:      "air",
  cancer:      "water",
  leo:         "fire",
  virgo:       "earth",
  libra:       "air",
  scorpio:     "water",
  sagittarius: "fire",
  capricorn:   "earth",
  aquarius:    "air",
  pisces:      "water",
};

export const SIGN_NAMES_ORDER = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
] as const;
