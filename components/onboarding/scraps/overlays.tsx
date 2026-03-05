"use client";

/**
 * Overlay definitions for onboarding scraps (Step 4 Dicas rápidas).
 * Hand-drawn SVG overlays (viewBox 0 0 100 100). Base: PNG or wireframe fallback.
 * Overlay is never shown without a base (img or wireframe).
 */

import { useState } from "react";
import { handArrow, handCircle, handLabel } from "./handDrawn";
import { PeopleWireframe, ShareWireframe } from "./wireframes";

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

/** Overlay coordinates aligned to wireframe (and real screenshots when close). */
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
          {handCircle(67, 22, 9, 5, { roughness: true })}
          {handArrow(76, 22, 87, 22, { curve: 0.15 })}
          {handLabel("editar aqui", 67, 14)}
          {handLabel("remover", 87, 14)}
        </>
      )}
      {scrapId === "categorias" && (
        <>
          {handCircle(50, 57.5, 25, 8, { roughness: true })}
          {handLabel("categorias", 50, 45)}
        </>
      )}
      {scrapId === "compartilhar" && (
        <>
          {handCircle(26, 69, 16, 7, { roughness: true })}
          {handArrow(42, 69, 64, 69, { curve: 0.12 })}
          {handLabel("copiar", 26, 60)}
          {handLabel("prévia", 66, 60)}
        </>
      )}
    </svg>
  );
}

type ImgStatus = "idle" | "loaded" | "error";

type ScrapThumbProps = {
  config: ScrapOverlayConfig;
  /** Called when base image fails to load (wireframe will be shown). */
  onError?: () => void;
};

function WireframeBase({ scrapId }: { scrapId: ScrapId }) {
  return scrapId === "compartilhar" ? <ShareWireframe /> : <PeopleWireframe />;
}

export function ScrapThumb({ config, onError }: ScrapThumbProps) {
  const [imgStatus, setImgStatus] = useState<ImgStatus>("idle");

  const showImage = imgStatus === "loaded";
  const showWireframe = imgStatus === "idle" || imgStatus === "error";
  const showOverlay = showWireframe || showImage;

  const handleLoad = () => setImgStatus("loaded");
  const handleError = () => {
    setImgStatus("error");
    onError?.();
  };

  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden">
      {/* Base: img only when loaded */}
      {showImage && (
        <img
          src={config.baseImage}
          alt=""
          className="h-full w-full object-cover"
          aria-hidden
        />
      )}
      {/* Base: wireframe when idle (loading) or error */}
      {showWireframe && (
        <div className="absolute inset-0">
          <WireframeBase scrapId={config.scrapId} />
        </div>
      )}
      {/* Overlay only when we have a resolved base (loaded or error), never alone */}
      {showOverlay && (
        <ScrapOverlaySvg scrapId={config.scrapId} />
      )}
      {/* Invisible img to drive load/error when not yet loaded */}
      {imgStatus === "idle" && (
        <img
          src={config.baseImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-0"
          onLoad={handleLoad}
          onError={handleError}
          aria-hidden
        />
      )}
    </div>
  );
}
