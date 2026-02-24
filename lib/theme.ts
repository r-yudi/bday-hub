import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export type ThemeMode = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "lembra_theme";

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeMode(raw) ? raw : "system";
}

export function resolveThemeMode(mode: ThemeMode): "light" | "dark" {
  if (mode === "light" || mode === "dark") return mode;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyThemeToDocument(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const resolved = resolveThemeMode(mode);
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = mode;
  root.style.colorScheme = resolved;
}

export function storeThemeMode(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
}

export async function loadRemoteThemePreference(userId: string): Promise<ThemeMode | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("user_settings").select("theme").eq("user_id", userId).maybeSingle();
  if (error) return null;
  const theme = typeof data?.theme === "string" ? data.theme : null;
  return isThemeMode(theme) ? theme : null;
}

export async function saveRemoteThemePreference(userId: string, theme: ThemeMode): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, theme }, { onConflict: "user_id" });

  if (error) {
    // Ignora para não quebrar UX se a coluna ainda não existir no banco.
    if (process.env.NODE_ENV === "development") {
      console.warn("[theme] remote theme save skipped:", error.message);
    }
  }
}

export function getThemeBootScript() {
  return `
  (function () {
    try {
      var key = '${THEME_STORAGE_KEY}';
      var raw = localStorage.getItem(key);
      var mode = (raw === 'light' || raw === 'dark' || raw === 'system') ? raw : 'system';
      var isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      var root = document.documentElement;
      if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
      root.dataset.theme = mode;
      root.style.colorScheme = isDark ? 'dark' : 'light';
    } catch (_) {}
  })();
  `;
}
