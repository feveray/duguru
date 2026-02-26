import type { HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Largura (ex: "100%", "200px", "12rem"). Padrão: "100%" */
  width?: string;
  /** Altura (ex: "1rem", "48px"). Padrão: "1rem" */
  height?: string;
  /** Arredondamento dos cantos. Padrão: "var(--radius-sm)" */
  radius?: string;
  /** Número de linhas a renderizar (atalho para parágrafos). */
  lines?: number;
}

/**
 * Skeleton — Placeholder de carregamento do design system duGuru.
 *
 * Usa CSS custom properties para cores e animação.
 * Quando `lines` > 1, renderiza múltiplas linhas com largura variável.
 */
export function Skeleton({
  width = "100%",
  height = "1rem",
  radius = "var(--radius-sm)",
  lines,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  if (lines && lines > 1) {
    return (
      <div className={`flex flex-col gap-2 ${className}`} {...props}>
        {Array.from({ length: lines }, (_, i) => {
          // Last line is narrower to look like natural text
          const lineWidth = i === lines - 1 ? "65%" : "100%";
          return (
            <SkeletonLine
              key={i}
              width={lineWidth}
              height={height}
              radius={radius}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando…"
      className={`animate-pulse bg-[var(--color-surface)] ${className}`}
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
      {...props}
    />
  );
}

function SkeletonLine({
  width,
  height,
  radius,
}: {
  width: string;
  height: string;
  radius: string;
}) {
  return (
    <div
      className="animate-pulse bg-[var(--color-surface)]"
      style={{ width, height, borderRadius: radius }}
    />
  );
}

/** Atalho para skeleton de avatar circular */
export function SkeletonAvatar({ size = "3rem" }: { size?: string }) {
  return <Skeleton width={size} height={size} radius="var(--radius-full)" />;
}

/** Atalho para skeleton de card */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`card ${className}`} role="status" aria-busy="true" aria-label="Carregando…">
      <div className="flex items-start gap-3">
        <SkeletonAvatar size="2.5rem" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton height="1rem" width="60%" />
          <Skeleton height="0.75rem" width="40%" />
        </div>
      </div>
      <div className="mt-4">
        <Skeleton lines={3} />
      </div>
    </div>
  );
}
