"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
  const { user, initialized } = useAuth();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const remoteAppliedForUser = useRef<string | null>(null);

  useEffect(() => {
    const stored = getStoredThemeMode();
    setThemeModeState(stored);
    applyThemeToDocument(stored);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (getStoredThemeMode() === "system") applyThemeToDocument("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!initialized) return;
    if (!user?.id) {
      remoteAppliedForUser.current = null;
      return;
    }
    const uid = user.id;
    if (remoteAppliedForUser.current === uid) return;

    let cancelled = false;
    void loadRemoteThemePreference(uid).then((remote) => {
      if (cancelled) return;
      remoteAppliedForUser.current = uid;
      if (!remote) return;
      setThemeModeState(remote);
      storeThemeMode(remote);
      applyThemeToDocument(remote);
    });

    return () => {
      cancelled = true;
    };
  }, [initialized, user?.id]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    storeThemeMode(mode);
    applyThemeToDocument(mode);
    if (user?.id) void saveRemoteThemePreference(user.id, mode);
  }, [user]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      setThemeMode
    }),
    [themeMode, setThemeMode]
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
