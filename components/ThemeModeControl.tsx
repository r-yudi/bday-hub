"use client";

import { useThemeMode } from "@/components/ThemeProvider";
import type { ThemeMode } from "@/lib/theme";

const SEGMENTS: { mode: ThemeMode; label: string }[] = [
  { mode: "light", label: "Claro" },
  { mode: "dark", label: "Escuro" },
  { mode: "system", label: "Sistema" }
];

export function ThemeModeControl() {
  const { themeMode, setThemeMode } = useThemeMode();

  return (
    <div className="nav-header-theme">
      <div className="ui-theme-segmented" role="group" aria-label="Tema da interface">
        {SEGMENTS.map(({ mode, label }) => (
          <button
            key={mode}
            type="button"
            className="ui-theme-segment ui-focus-surface"
            aria-pressed={themeMode === mode}
            onClick={() => setThemeMode(mode)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
