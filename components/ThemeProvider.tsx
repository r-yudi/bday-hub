"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applyThemeToDocument, type ThemeMode } from "@/lib/theme";

type ThemeContextValue = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Light-only pre-launch: themeMode is always "light"; setThemeMode is no-op for dark/system. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode] = useState<ThemeMode>("light");

  useEffect(() => {
    applyThemeToDocument("light");
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode: "light",
      setThemeMode(mode) {
        if (mode === "light") applyThemeToDocument("light");
      }
    }),
    []
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within ThemeProvider");
  }
  return context;
}
