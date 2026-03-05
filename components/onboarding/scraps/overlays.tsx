"use client";

/**
 * Overlay definitions for onboarding scraps (Step 4 Dicas rápidas).
 * Hand-drawn SVG overlays (viewBox 0 0 100 100). Base images: public/onboarding/base/people.png, share.png
 */

import { handArrow, handCircle, handLabel } from "./handDrawn";

export type ScrapId = "editar" | "categorias" | "compartilhar";

export type ScrapOverlayConfig = {
  baseImage: string;
  scrapId: ScrapId;
};

/** Scrap Editar: circundar botão Editar, seta para Excluir, labels "editar aqui" e "remover". */
export const SCRAP_EDITAR: ScrapOverlayConfig = {
  baseImage: "/onboarding/base/people.png",
  scrapId: "editar"
};

/** Scrap Categorias: circundar chips (amigos/faculdade), label "categorias". */
export const SCRAP_CATEGORIAS: ScrapOverlayConfig = {
  baseImage: "/onboarding/base/people.png",
  scrapId: "categorias"
};

/** Scrap Compartilhar: circundar Copiar link, seta para Abrir prévia, labels "copiar" e "prévia". */
export const SCRAP_COMPARTILHAR: ScrapOverlayConfig = {
  baseImage: "/onboarding/base/share.png",
  scrapId: "compartilhar"
};

export const SCRAP_CONFIGS = {
  editar: SCRAP_EDITAR,
  categorias: SCRAP_CATEGORIAS,
  compartilhar: SCRAP_COMPARTILHAR
} as const;

function ScrapOverlaySvg({ scrapId }: { scrapId: ScrapId }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 h-full w-full pointer-events-none"
      preserveAspectRatio="none"
      aria-hidden
    >
      {scrapId === "editar" && (
        <>
          {handCircle(70, 27, 9, 5.5, { roughness: true })}
          {handArrow(78, 27, 87, 27, { curve: 0.15 })}
          {handLabel("editar aqui", 70, 19)}
          {handLabel("remover", 87, 19)}
        </>
      )}
      {scrapId === "categorias" && (
        <>
          {handCircle(50, 63, 42, 12, { roughness: true })}
          {handLabel("categorias", 50, 47)}
        </>
      )}
      {scrapId === "compartilhar" && (
        <>
          {handCircle(26, 66, 14, 8, { roughness: true })}
          {handArrow(40, 66, 58, 66, { curve: 0.12 })}
          {handLabel("copiar", 26, 57)}
          {handLabel("prévia", 62, 57)}
        </>
      )}
    </svg>
  );
}

type ScrapThumbProps = {
  config: ScrapOverlayConfig;
  failed: boolean;
  onError: () => void;
};

export function ScrapThumb({ config, failed, onError }: ScrapThumbProps) {
  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-surface2/50 p-2 text-center">
        <span className="text-lg text-muted" aria-hidden>🖼</span>
        <span className="text-xs text-muted">Prévia em breve</span>
      </div>
    );
  }
  return (
    <div className="relative h-full w-full">
      <img
        src={config.baseImage}
        alt=""
        className="h-full w-full object-cover"
        onError={onError}
      />
      <ScrapOverlaySvg scrapId={config.scrapId} />
    </div>
  );
}
