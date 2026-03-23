import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export type ThemeMode = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "lembra_theme";

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

/** Reads persisted preference; defaults to `system` when unset or invalid. */
export function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(raw) ? raw : "system";
  } catch {
    return "system";
  }
}

export function resolveThemeMode(mode: ThemeMode): "light" | "dark" {
  if (mode === "dark") return "dark";
  if (mode === "light") return "light";
  if (typeof window === "undefined") return "light";
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

/** Applies `light` / `dark` class on `<html>` from mode (resolving `system`). */
export function applyThemeToDocument(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const resolved = resolveThemeMode(mode);
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = mode;
  root.style.colorScheme = resolved;
}

export function storeThemeMode(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export async function loadRemoteThemePreference(userId: string): Promise<ThemeMode | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("user_settings").select("theme").eq("user_id", userId).maybeSingle();
    if (error) return null;
    const theme = typeof data?.theme === "string" ? data.theme : null;
    return isThemeMode(theme) ? theme : null;
  } catch {
    return null;
  }
}

export async function saveRemoteThemePreference(userId: string, theme: ThemeMode): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  try {
    const { error } = await supabase.from("user_settings").upsert({ user_id: userId, theme }, { onConflict: "user_id" });
    if (error && process.env.NODE_ENV === "development") {
      console.warn("[theme] remote theme save skipped:", error.message);
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[theme] remote theme save failed:", error instanceof Error ? error.message : String(error));
    }
  }
}

/**
 * Inline boot script: runs before React to avoid theme flash.
 * Reads `lembra_theme` and `prefers-color-scheme` when mode is `system`.
 */
export function getThemeBootScript() {
  const key = THEME_STORAGE_KEY;
  return `
  (function () {
    try {
      var k = ${JSON.stringify(key)};
      var raw = null;
      try { raw = localStorage.getItem(k); } catch (_) {}
      var mode = (raw === "light" || raw === "dark" || raw === "system") ? raw : "system";
      var prefersDark = false;
      try {
        prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      } catch (_) {}
      var resolved = (mode === "dark" || (mode === "system" && prefersDark)) ? "dark" : "light";
      var root = document.documentElement;
      if (resolved === "dark") root.classList.add("dark"); else root.classList.remove("dark");
      root.dataset.theme = mode;
      root.style.colorScheme = resolved;
    } catch (_) {}
  })();
  `;
}
