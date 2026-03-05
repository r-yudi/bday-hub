"use client";

/**
 * Hand-drawn SVG helpers for scrapbook-style overlays.
 * All coordinates in viewBox 0..100. No dependencies.
 */

import type React from "react";

const DEFAULT_STROKE = "var(--accent, #E25D2A)";
const DEFAULT_STROKE_WIDTH = 3.2;
const DEFAULT_OPACITY = 0.95;
const ROUGH_OFFSET = 0.5;

export type HandStyle = {
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  roughness?: boolean;
};

/** Deterministic slight rotation in [-2, 2] from text + position. */
function labelRotation(text: string, x: number, y: number): number {
  const n = (text.length * 7 + Math.round(x) + Math.round(y) * 11) % 41;
  return n / 10 - 2;
}

function getStyle(opts?: HandStyle) {
  return {
    stroke: opts?.stroke ?? DEFAULT_STROKE,
    strokeWidth: opts?.strokeWidth ?? DEFAULT_STROKE_WIDTH,
    opacity: opts?.opacity ?? DEFAULT_OPACITY,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none"
  };
}

/**
 * Imperfect circle: ellipse path with small wobbles (2–3 layers / variations).
 * cx, cy, rx, ry in viewBox 0..100.
 */
export function handCircle(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  opts?: HandStyle
): React.ReactNode {
  const style = getStyle(opts);
  const wobble = 0.08; // slight radius variation per quadrant
  const r1x = rx * (1 + wobble);
  const r1y = ry * (1 - wobble * 0.5);
  const r2x = rx * (1 - wobble * 0.7);
  const r2y = ry * (1 + wobble);
  const r3x = rx * (1 - wobble);
  const r3y = ry * (1 - wobble);
  const r4x = rx * (1 + wobble * 0.6);
  const r4y = ry * (1 + wobble * 0.5);
  // Ellipse as 4 arcs: M cx+r1x,cy A r1x,r1y ... etc
  const d = [
    `M ${cx + r1x} ${cy}`,
    `A ${r1x} ${r1y} 0 0 1 ${cx} ${cy - r1y}`,
    `A ${r2x} ${r2y} 0 0 1 ${cx - r2x} ${cy}`,
    `A ${r3x} ${r3y} 0 0 1 ${cx} ${cy + r3y}`,
    `A ${r4x} ${r4y} 0 0 1 ${cx + r4x} ${cy}`,
    "Z"
  ].join(" ");

  const paths: React.ReactNode[] = [
    <path key="main" d={d} {...style} />
  ];

  if (opts?.roughness) {
    paths.push(
      <path
        key="rough"
        d={d}
        {...style}
        transform={`translate(${ROUGH_OFFSET}, ${ROUGH_OFFSET})`}
      />
    );
  }

  return <>{paths}</>;
}

/**
 * Curved arrow: quadratic bezier from (fromX, fromY) to (toX, toY) with arrowhead.
 */
export function handArrow(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  opts?: HandStyle & { curve?: number }
): React.ReactNode {
  const style = getStyle(opts);
  const curve = opts?.curve ?? 0.3; // control point offset
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const perpX = -dy * curve;
  const perpY = dx * curve;
  const cpx = midX + perpX;
  const cpy = midY + perpY;
  const pathD = `M ${fromX} ${fromY} Q ${cpx} ${cpy} ${toX} ${toY}`;

  const arrowSize = 3;
  const angle = Math.atan2(toY - cpy, toX - cpx);
  const headAngle = Math.PI / 6;
  const x1 = toX - arrowSize * Math.cos(angle - headAngle);
  const y1 = toY - arrowSize * Math.sin(angle - headAngle);
  const x2 = toX - arrowSize * Math.cos(angle + headAngle);
  const y2 = toY - arrowSize * Math.sin(angle + headAngle);
  const headD = `M ${toX} ${toY} L ${x1} ${y1} M ${toX} ${toY} L ${x2} ${y2}`;

  return (
    <>
      <path d={pathD} {...style} />
      <path d={headD} {...style} />
    </>
  );
}

/**
 * Label text with slight rotation and "annotated" look.
 */
export function handLabel(
  text: string,
  x: number,
  y: number,
  opts?: HandStyle & { rotate?: number; fontSize?: number }
): React.ReactNode {
  const rotate = opts?.rotate ?? labelRotation(text, x, y);
  const fontSize = opts?.fontSize ?? 3.4;
  const stroke = opts?.stroke ?? DEFAULT_STROKE;
  const opacity = opts?.opacity ?? DEFAULT_OPACITY;

  return (
    <text
      x={x}
      y={y}
      fontSize={fontSize}
      fontWeight={600}
      fill={stroke}
      opacity={opacity}
      textAnchor="middle"
      dominantBaseline="middle"
      transform={`rotate(${rotate} ${x} ${y})`}
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      {text}
    </text>
  );
}
