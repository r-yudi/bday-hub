import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export type ThemeMode = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "lembra_theme";

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return "light";
}

export function resolveThemeMode(_mode: ThemeMode): "light" | "dark" {
  return "light";
}

/** Light-only pre-launch: always applies light; .dark is never added. */
export function applyThemeToDocument(_mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark");
  root.dataset.theme = "light";
  root.style.colorScheme = "light";
}

export function storeThemeMode(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
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

/** Light-only pre-launch: always sets light; .dark is never applied. */
export function getThemeBootScript() {
  return `
  (function () {
    try {
      var key = '${THEME_STORAGE_KEY}';
      try { localStorage.removeItem(key); } catch (_) {}
      var root = document.documentElement;
      root.classList.remove('dark');
      root.dataset.theme = 'light';
      root.style.colorScheme = 'light';
    } catch (_) {}
  })();
  `;
}
