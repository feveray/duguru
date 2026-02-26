/**
 * frontend/src/components/compatibility/CompatScore.tsx  — T111
 *
 * Exibe score de compatibilidade geral + 3 barras animadas (Romance/Amizade/Trabalho)
 * + gráfico de radar D3.js com os 3 eixos.
 */
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import * as d3 from "d3";
import { Skeleton } from "@/components/ui/Skeleton";
import type { CompatibilityScore, SynastryScore } from "@/services/compatibilityService";

/* ─── Tipos ──────────────────────────────────────────────────────────────── */

interface ScoreData {
  romance:    number;
  friendship: number;
  work:       number;
}

interface CompatScoreProps {
  /** Fonte: score de signos (GET /api/compatibility) */
  signScore?:    CompatibilityScore | null;
  /** Fonte: score calculado da sinastria (POST /api/synastry) */
  synastryScore?: SynastryScore | null;
  loading?: boolean;
}

/* ─── Radar Chart D3 ────────────────────────────────────────────────────── */

function RadarChart({ data }: { data: ScoreData }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const size   = 220;
    const margin = 40;
    const radius = (size - margin * 2) / 2;
    const cx     = size / 2;
    const cy     = size / 2;

    d3.select(svg).selectAll("*").remove();

    const g = d3.select(svg)
      .attr("viewBox", `0 0 ${size} ${size}`)
      .attr("role", "img")
      .attr("aria-label", "Gráfico de radar com scores de compatibilidade")
      .append("g")
      .attr("transform", `translate(${cx},${cy})`);

    /* Eixos: romance (topo), amizade (direita-baixo), trabalho (esquerda-baixo) */
    const axes = [
      { key: "romance",    labelPt: "Romance",  angle: -Math.PI / 2 },
      { key: "friendship", labelPt: "Amizade",  angle: -Math.PI / 2 + (2 * Math.PI) / 3 },
      { key: "work",       labelPt: "Trabalho", angle: -Math.PI / 2 + (4 * Math.PI) / 3 },
    ] as const;

    /* Círculos de referência */
    const levels = [25, 50, 75, 100];
    for (const lvl of levels) {
      const r = (lvl / 100) * radius;
      g.append("circle")
        .attr("r", r)
        .attr("fill", "none")
        .attr("stroke", "var(--color-paragraph)")
        .attr("stroke-opacity", 0.15)
        .attr("stroke-width", 1);
    }

    /* Linhas dos eixos */
    for (const ax of axes) {
      const x = Math.cos(ax.angle) * radius;
      const y = Math.sin(ax.angle) * radius;
      g.append("line")
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", x).attr("y2", y)
        .attr("stroke", "var(--color-paragraph)")
        .attr("stroke-opacity", 0.25)
        .attr("stroke-width", 1);

      /* Labels dos eixos */
      const lx = Math.cos(ax.angle) * (radius + 18);
      const ly = Math.sin(ax.angle) * (radius + 18);
      g.append("text")
        .attr("x", lx).attr("y", ly)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "9px")
        .attr("fill", "var(--color-paragraph)")
        .text(ax.labelPt);
    }

    /* Polígono dos dados */
    const points = axes.map((ax) => {
      const value = data[ax.key] as number;
      const r     = (value / 100) * radius;
      return [Math.cos(ax.angle) * r, Math.sin(ax.angle) * r] as [number, number];
    });

    const lineGen = d3.line<[number, number]>()
      .x((d) => d[0])
      .y((d) => d[1])
      .curve(d3.curveLinearClosed);

    g.append("path")
      .datum(points)
      .attr("d", lineGen)
      .attr("fill", "var(--color-highlight)")
      .attr("fill-opacity", 0.25)
      .attr("stroke", "var(--color-highlight)")
      .attr("stroke-width", 2);

    /* Pontos nos vértices */
    for (const [x, y] of points) {
      g.append("circle")
        .attr("cx", x).attr("cy", y)
        .attr("r", 4)
        .attr("fill", "var(--color-highlight)");
    }
  }, [data]);

  return (
    <svg
      ref={svgRef}
      className="mx-auto block"
      style={{ width: "100%", maxWidth: "220px", height: "220px" }}
    />
  );
}

/* ─── Score Bar ──────────────────────────────────────────────────────────── */

function ScoreBar({
  label,
  value,
  delay = 0,
}: {
  label: string;
  value: number;
  delay?: number;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-[var(--color-headline)]">{label}</span>
        <span className="text-[var(--color-paragraph)]">{value}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-[var(--color-main)]"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${value}%`}
      >
        <motion.div
          className="h-full rounded-full bg-[var(--color-button)]"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/* ─── CompatScore ────────────────────────────────────────────────────────── */

export function CompatScore({ signScore, synastryScore, loading }: CompatScoreProps) {
  const { t } = useTranslation("compatibility");

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton height="220px" />
        <Skeleton lines={3} />
      </div>
    );
  }

  const score: ScoreData | null = synastryScore ?? signScore ?? null;

  if (!score) return null;

  const overall = Math.round((score.romance + score.friendship + score.work) / 3);

  return (
    <section aria-label={t("scoreSection")}>
      {/* Score geral */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-16 w-16 flex-col items-center justify-center rounded-full border-4 border-[var(--color-highlight)] text-center"
          aria-label={`Score geral: ${overall}%`}
        >
          <span className="text-2xl font-bold leading-none text-[var(--color-headline)]">
            {overall}
          </span>
          <span className="text-[0.6rem] text-[var(--color-paragraph)]">%</span>
        </div>
        <div>
          <p className="font-semibold text-[var(--color-headline)]">{t("overallLabel")}</p>
          <p className="text-sm text-[var(--color-paragraph)]">{t("overallSub")}</p>
        </div>
      </div>

      {/* Radar chart D3 */}
      <RadarChart data={score} />

      {/* Barras por área */}
      <div className="mt-4 space-y-3">
        <ScoreBar label={t("romance")}    value={score.romance}    delay={0.1} />
        <ScoreBar label={t("friendship")} value={score.friendship} delay={0.2} />
        <ScoreBar label={t("work")}       value={score.work}       delay={0.3} />
      </div>
    </section>
  );
}
