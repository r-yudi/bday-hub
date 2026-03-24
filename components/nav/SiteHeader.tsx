"use client";

import type { ReactNode } from "react";

export type SiteHeaderPosition = "fixed" | "sticky";

/**
 * Single shell for marketing + app headers (landing nav is the visual reference).
 * Same surface, padding rhythm, and max content width everywhere.
 */
export function SiteHeader({
  position,
  left,
  right
}: {
  position: SiteHeaderPosition;
  left: ReactNode;
  right: ReactNode;
}) {
  const positionClass =
    position === "fixed"
      ? "topnav-shell fixed inset-x-0 top-0 z-[100] w-full border-b"
      : "topnav-shell sticky top-0 z-[100] w-full border-b";

  return (
    <header className={positionClass}>
      <div className="topnav-inner mx-auto flex w-full min-w-0 max-w-[1200px] flex-wrap items-center justify-between gap-x-3 gap-y-2">
        {left}
        {right}
      </div>
    </header>
  );
}
