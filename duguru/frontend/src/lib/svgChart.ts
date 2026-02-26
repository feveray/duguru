/**
 * frontend/src/lib/svgChart.ts
 *
 * Utilitarios D3 para desenhar a mandala do mapa natal.
 *
 * Convencoes geometricas:
 *   - ASC fica no lado esquerdo (9h = 270 graus em SVG, onde 0=direita, CW)
 *   - Longitudes aumentam em sentido anti-horario no ceu
 *   - SVG: 0 graus = direita, aumenta CW => usar transformacao negativa
 *
 * Formula de longitude -> angulo SVG:
 *   svgAngle = 270 - (longitude - ascLon)   (graus, mod 360)
 */
import * as d3 from "d3";
import type { NatalChartResult, PlanetRow, Aspect } from "../services/chartService";
import {
  PLANET_GLYPHS,
  SIGN_GLYPHS,
  PLANET_COLORS,
  ELEMENT_COLORS,
  SIGN_ELEMENTS,
  SIGN_NAMES_ORDER,
} from "./zodiacSymbols";

/* --- Constantes estruturais ------------------------------------------------ */

export const CHART_SIZE     = 560;            // viewBox: 0 0 560 560
const CX                    = CHART_SIZE / 2; // 280
const CY                    = CHART_SIZE / 2; // 280
const R_OUTER               = 255;            // borda externa
const R_SIGN_OUTER          = 245;            // borda externa do anel de signos
const R_SIGN_INNER          = 200;            // borda interna do anel de signos
const R_HOUSE_OUTER         = 200;            // cuspides de casas vao ate aqui
const R_HOUSE_INNER         = 120;            // circulo interno
const R_PLANET              = 160;            // orbita dos planetas
const R_ASPECT_INNER        = 115;            // linha de aspectos terminam aqui
const R_DEGREE_OUTER        = 248;            // marcadores de grau

/* --- Helpers geometricos --------------------------------------------------- */

function toRad(deg: number): number { return (deg * Math.PI) / 180; }

/** Converte longitude ecliptica -> angulo SVG (0=direita, CW com y-down) */
function lonToSvgRad(lon: number, ascLon: number): number {
  // ASC fica em 180° SVG = ESQUERDA (9h); longitudes crescem CCW
  const svgDeg = (180 - (lon - ascLon) + 720) % 360;
  return toRad(svgDeg);
}

/** Converte longitude ecliptica -> angulo D3 arc (0=topo, CW) */
function lonToD3ArcRad(lon: number, ascLon: number): number {
  const svgDeg = (180 - (lon - ascLon) + 720) % 360;
  // D3 arc: 0=topo=svgDeg 270°. Formula: d3Deg = (svgDeg - 270 + 360) % 360
  return toRad((svgDeg - 270 + 360) % 360);
}

function polarToXY(cx: number, cy: number, r: number, rad: number) {
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/* --- Draw principal -------------------------------------------------------- */

export interface DrawOptions {
  chart:          NatalChartResult;
  selectedPlanet: string | null;
  onPlanetClick:  (planet: PlanetRow) => void;
  onAspectClick:  (aspect: Aspect) => void;
  theme:          "light" | "dark";
}

/**
 * Desenha a mandala completa em um elemento SVG existente.
 * Remove todo conteudo anterior antes de desenhar.
 */
export function drawNatalChart(
  svgEl: SVGSVGElement,
  opts: DrawOptions,
): void {
  const { chart, selectedPlanet, onPlanetClick, onAspectClick } = opts;
  const asc = chart.houses.ascendant;

  const svg = d3
    .select(svgEl)
    .attr("viewBox", `0 0 ${CHART_SIZE} ${CHART_SIZE}`)
    .attr("role", "img")
    .attr("aria-label", "Mandala do mapa natal");

  // Limpa
  svg.selectAll("*").remove();

  const root = svg.append("g").attr("class", "chart-root");

  /* 1. Fundo externo ------------------------------------------------------- */
  root
    .append("circle")
    .attr("cx", CX).attr("cy", CY).attr("r", R_OUTER)
    .attr("fill", "var(--color-surface, #1a1a2e)")
    .attr("stroke", "var(--color-border, #444)")
    .attr("stroke-width", 1.5);

  /* 2. Anel de signos (12 fatias de 30 graus) ----------------------------- */
  const signGroup = root.append("g").attr("class", "signs");

  SIGN_NAMES_ORDER.forEach((sign, i) => {
    // Cada signo ocupa 30 graus; o signo 0 (Aries) comeca no ASC
    const startLon = i * 30;
    const endLon   = startLon + 30;
    // Para D3 arc (CW de startAngle para endAngle):
    // Longitude maior -> svgDeg menor -> d3Rad menor
    // Portanto: startAngle = lonToD3ArcRad(endLon) [menor], endAngle = lonToD3ArcRad(startLon) [maior]
    const arcStartRad = lonToD3ArcRad(endLon, asc);
    const arcEndRad   = lonToD3ArcRad(startLon, asc);

    const arc = d3.arc<unknown>()
      .innerRadius(R_SIGN_INNER)
      .outerRadius(R_SIGN_OUTER)
      .startAngle(arcStartRad)
      .endAngle(arcEndRad);

    signGroup
      .append("path")
      .attr("d", arc(null) ?? "")
      .attr("fill", ELEMENT_COLORS[SIGN_ELEMENTS[sign]!]!)
      .attr("stroke", "var(--color-border, #555)")
      .attr("stroke-width", 0.5);

    // Glifo do signo no centro da fatia
    const midRad = lonToSvgRad(startLon + 15, asc);
    const pos    = polarToXY(CX, CY, (R_SIGN_INNER + R_SIGN_OUTER) / 2, midRad);
    signGroup
      .append("text")
      .attr("x", pos.x).attr("y", pos.y)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", 16)
      .attr("fill", "var(--color-text, #ddd)")
      .text(SIGN_GLYPHS[sign] ?? "");
  });

  /* 3. Cuspides de casas --------------------------------------------------- */
  const houseGroup = root.append("g").attr("class", "houses");

  chart.houses.cusps.forEach((cusp, i) => {
    const rad      = lonToSvgRad(cusp, asc);
    const outerPt  = polarToXY(CX, CY, R_HOUSE_OUTER,  rad);
    const innerPt  = polarToXY(CX, CY, R_HOUSE_INNER,  rad);
    const isAngular = i === 0 || i === 3 || i === 6 || i === 9;

    houseGroup
      .append("line")
      .attr("x1", outerPt.x).attr("y1", outerPt.y)
      .attr("x2", innerPt.x).attr("y2", innerPt.y)
      .attr("stroke", isAngular ? "var(--color-accent, #e2a23b)" : "var(--color-border, #555)")
      .attr("stroke-width", isAngular ? 1.5 : 0.8)
      .attr("stroke-opacity", 0.8);

    // Numero da casa
    const midRad = lonToSvgRad(
      cusp + ((chart.houses.cusps[(i + 1) % 12]! - cusp + 360) % 360) / 2,
      asc,
    );
    const labelPt = polarToXY(CX, CY, (R_HOUSE_INNER + 20), midRad);
    houseGroup
      .append("text")
      .attr("x", labelPt.x).attr("y", labelPt.y)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", 10)
      .attr("fill", "var(--color-text-muted, #888)")
      .text(String(i + 1));
  });

  /* 4. Circulo interno ---------------------------------------------------- */
  root
    .append("circle")
    .attr("cx", CX).attr("cy", CY).attr("r", R_HOUSE_INNER)
    .attr("fill", "var(--color-background, #0d0d1a)")
    .attr("stroke", "var(--color-border, #444)")
    .attr("stroke-width", 1);

  /* 5. Linhas de aspectos -------------------------------------------------- */
  const aspectGroup = root.append("g").attr("class", "aspects");

  const ASPECT_COLORS: Record<string, string> = {
    conjunction: "#FFD700",
    sextile:     "#4fc3f7",
    trine:       "#81c784",
    square:      "#e57373",
    opposition:  "#ce93d8",
    quincunx:    "#ffb74d",
  };

  chart.aspects.forEach((asp, idx) => {
    const p1 = chart.planets.find((p) => p.name === asp.planet1);
    const p2 = chart.planets.find((p) => p.name === asp.planet2);
    if (!p1 || !p2) return;

    const rad1 = lonToSvgRad(p1.longitude, asc);
    const rad2 = lonToSvgRad(p2.longitude, asc);
    const pt1  = polarToXY(CX, CY, R_ASPECT_INNER, rad1);
    const pt2  = polarToXY(CX, CY, R_ASPECT_INNER, rad2);
    const color = ASPECT_COLORS[asp.type] ?? "#999";

    aspectGroup
      .append("line")
      .attr("x1", pt1.x).attr("y1", pt1.y)
      .attr("x2", pt2.x).attr("y2", pt2.y)
      .attr("stroke", color)
      .attr("stroke-width", 0.8)
      .attr("stroke-opacity", 0.45)
      .attr("class", "aspect-line cursor-pointer")
      .attr("data-aspect-index", idx)
      .on("click", () => { onAspectClick(asp); });
  });

  /* 6. Planetas ------------------------------------------------------------ */
  const planetGroup = root.append("g").attr("class", "planets");

  chart.planets.forEach((planet) => {
    const rad    = lonToSvgRad(planet.longitude, asc);
    const pos    = polarToXY(CX, CY, R_PLANET, rad);
    const color  = PLANET_COLORS[planet.name] ?? "#fff";
    const glyph  = PLANET_GLYPHS[planet.name] ?? "?";
    const isSelected = selectedPlanet === planet.name;

    const g = planetGroup
      .append("g")
      .attr("class", "planet-glyph cursor-pointer")
      .attr("transform", `translate(${pos.x},${pos.y})`)
      .on("click", () => { onPlanetClick(planet); });

    // Halo se selecionado
    if (isSelected) {
      g.append("circle")
        .attr("r", 13)
        .attr("fill", color)
        .attr("fill-opacity", 0.2)
        .attr("stroke", color)
        .attr("stroke-width", 1.5);
    }

    // Glifo do planeta
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", isSelected ? 18 : 15)
      .attr("fill", color)
      .attr("font-weight", isSelected ? "bold" : "normal")
      .text(planet.retrograde ? `${glyph}℞` : glyph);

    // Linha radial do planeta ate a borda interna do anel de signos
    const outer = polarToXY(CX, CY, R_SIGN_INNER - 4, rad);
    const inner = polarToXY(CX, CY, R_PLANET + 12, rad);
    planetGroup
      .append("line")
      .attr("x1", inner.x).attr("y1", inner.y)
      .attr("x2", outer.x).attr("y2", outer.y)
      .attr("stroke", color)
      .attr("stroke-width", 0.6)
      .attr("stroke-opacity", 0.4);
  });

  /* 7. ASC / MC labels ----------------------------------------------------- */
  const labelGroup = root.append("g").attr("class", "angles");

  [
    { lon: chart.houses.ascendant, label: "ASC" },
    { lon: chart.houses.mc,        label: "MC"  },
  ].forEach(({ lon, label }) => {
    const rad = lonToSvgRad(lon, asc);
    const pos = polarToXY(CX, CY, R_SIGN_OUTER + 10, rad);
    labelGroup
      .append("text")
      .attr("x", pos.x).attr("y", pos.y)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", 11)
      .attr("font-weight", "bold")
      .attr("fill", "var(--color-accent, #e2a23b)")
      .text(label);
  });
}
