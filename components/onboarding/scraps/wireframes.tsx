"use client";

/**
 * Wireframe SVG bases for onboarding scraps (viewBox 0 0 100 100).
 * Used when base PNG fails to load. Light strokes, paper fill, no tiny text.
 */

const WIRE_STROKE = "var(--text, #1a1a1a)";
const WIRE_OPACITY = 0.2;
const FILL = "var(--surface, #fafafa)";

export function PeopleWireframe() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-full w-full object-cover"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <rect width="100" height="100" fill={FILL} />
      {/* Header */}
      <rect x="4" y="4" width="92" height="8" rx="2" fill="none" stroke={WIRE_STROKE} strokeWidth="1.2" opacity={WIRE_OPACITY} />
      {/* List lines (left) */}
      <rect x="5" y="20" width="48" height="6" rx="1.5" fill="none" stroke={WIRE_STROKE} strokeWidth="1" opacity={WIRE_OPACITY} />
      <rect x="5" y="30" width="52" height="6" rx="1.5" fill="none" stroke={WIRE_STROKE} strokeWidth="1" opacity={WIRE_OPACITY} />
      <rect x="5" y="40" width="44" height="6" rx="1.5" fill="none" stroke={WIRE_STROKE} strokeWidth="1" opacity={WIRE_OPACITY} />
      {/* Pills right: Editar, Compartilhar, Excluir */}
      <rect x="58" y="18" width="18" height="8" rx="4" fill="none" stroke={WIRE_STROKE} strokeWidth="1" opacity={WIRE_OPACITY} />
      <rect x="78" y="18" width="18" height="8" rx="4" fill="none" stroke={WIRE_STROKE} strokeWidth="1" opacity={WIRE_OPACITY} />
      <rect x="58" y="28" width="22" height="8" rx="4" fill="none" stroke={WIRE_STROKE} strokeWidth="1" opacity={WIRE_OPACITY} />
      {/* Chips (categorias) */}
      <rect x="8" y="54" width="24" height="7" rx="3.5" fill="none" stroke={WIRE_STROKE} strokeWidth="1" opacity={WIRE_OPACITY} />
      <rect x="36" y="54" width="28" height="7" rx="3.5" fill="none" stroke={WIRE_STROKE} strokeWidth="1" opacity={WIRE_OPACITY} />
    </svg>
  );
}

export function ShareWireframe() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-full w-full object-cover"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <rect width="100" height="100" fill={FILL} />
      {/* List: 2 items (name + date) */}
      <rect x="6" y="18" width="50" height="8" rx="2" fill="none" stroke={WIRE_STROKE} strokeWidth="1" opacity={WIRE_OPACITY} />
      <rect x="6" y="28" width="24" height="6" rx="1.5" fill="none" stroke={WIRE_STROKE} strokeWidth="1" opacity={WIRE_OPACITY} />
      <rect x="6" y="42" width="46" height="8" rx="2" fill="none" stroke={WIRE_STROKE} strokeWidth="1" opacity={WIRE_OPACITY} />
      <rect x="6" y="52" width="22" height="6" rx="1.5" fill="none" stroke={WIRE_STROKE} strokeWidth="1" opacity={WIRE_OPACITY} />
      {/* Copiar link pill (big) */}
      <rect x="10" y="62" width="32" height="14" rx="7" fill="none" stroke={WIRE_STROKE} strokeWidth="1.2" opacity={WIRE_OPACITY} />
      {/* Abrir prévia (short line/link) */}
      <rect x="52" y="66" width="28" height="6" rx="2" fill="none" stroke={WIRE_STROKE} strokeWidth="1" opacity={WIRE_OPACITY} />
    </svg>
  );
}
