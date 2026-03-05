"use client";

/**
 * Overlay definitions for onboarding scraps (Step 4 Dicas rápidas).
 * Positions in percentage (0–100) of the base image.
 * Base images: public/onboarding/base/people.png, share.png
 */

export type OverlayMark = {
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ScrapOverlayConfig = {
  baseImage: string;
  marks: OverlayMark[];
};

/** Scrap Editar: marca botão Editar e botão Excluir na tela Pessoas */
export const SCRAP_EDITAR: ScrapOverlayConfig = {
  baseImage: "/onboarding/base/people.png",
  marks: [
    { label: "editar aqui", left: 62, top: 22, width: 16, height: 10 },
    { label: "remover", left: 80, top: 22, width: 14, height: 10 }
  ]
};

/** Scrap Categorias: marca chips de categoria na tela Pessoas */
export const SCRAP_CATEGORIAS: ScrapOverlayConfig = {
  baseImage: "/onboarding/base/people.png",
  marks: [
    { label: "organize com categorias", left: 8, top: 52, width: 84, height: 22 }
  ]
};

/** Scrap Compartilhar: marca Copiar link e Abrir prévia na tela Share */
export const SCRAP_COMPARTILHAR: ScrapOverlayConfig = {
  baseImage: "/onboarding/base/share.png",
  marks: [
    { label: "copiar link", left: 12, top: 58, width: 28, height: 16 },
    { label: "ver prévia", left: 48, top: 58, width: 28, height: 16 }
  ]
};

export const SCRAP_CONFIGS = {
  editar: SCRAP_EDITAR,
  categorias: SCRAP_CATEGORIAS,
  compartilhar: SCRAP_COMPARTILHAR
} as const;

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
      <div className="absolute inset-0 pointer-events-none">
        {config.marks.map((mark, i) => (
          <div
            key={i}
            className="absolute border-2 border-primary/70 bg-primary/10 rounded flex items-center justify-center p-0.5"
            style={{
              left: `${mark.left}%`,
              top: `${mark.top}%`,
              width: `${mark.width}%`,
              height: `${mark.height}%`
            }}
          >
            <span className="text-[10px] font-medium text-primary leading-tight text-center truncate max-w-full">
              {mark.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
