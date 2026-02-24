"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  applyThemeToDocument,
  getStoredThemeMode,
  loadRemoteThemePreference,
  saveRemoteThemePreference,
  storeThemeMode,
  type ThemeMode
} from "@/lib/theme";

type ThemeContextValue = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    const mode = getStoredThemeMode();
    setThemeModeState(mode);
    applyThemeToDocument(mode);
  }, []);

  useEffect(() => {
    if (themeMode !== "system") return;
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemeToDocument("system");
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, [themeMode]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    let active = true;
    void loadRemoteThemePreference(userId).then((remoteTheme) => {
      if (!active || !remoteTheme) return;
      setThemeModeState(remoteTheme);
      storeThemeMode(remoteTheme);
      applyThemeToDocument(remoteTheme);
    });

    return () => {
      active = false;
    };
  }, [user?.id]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      setThemeMode(mode) {
        setThemeModeState(mode);
        storeThemeMode(mode);
        applyThemeToDocument(mode);
        const userId = user?.id;
        if (userId) {
          void saveRemoteThemePreference(userId, mode);
        }
      }
    }),
    [themeMode, user?.id]
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
