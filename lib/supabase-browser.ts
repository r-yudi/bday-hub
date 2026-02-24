import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;
  if (browserClient) return browserClient;

  browserClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  return browserClient;
}

function getErrorMessage(error: unknown) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return String(error);
}

export function isInvalidRefreshTokenError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("invalid refresh token") ||
    message.includes("refresh token not found") ||
    message.includes("refresh_token_not_found")
  );
}

export function clearSupabaseBrowserAuthStorage() {
  if (typeof window === "undefined") return;

  const storages = [window.localStorage, window.sessionStorage];
  for (const storage of storages) {
    const keysToDelete: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (!key) continue;
      if (key.startsWith("sb-") && key.includes("auth-token")) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      storage.removeItem(key);
    }
  }

  if (typeof document !== "undefined") {
    const cookieNames = document.cookie
      .split(";")
      .map((part) => part.trim().split("=")[0])
      .filter((name) => name && name.startsWith("sb-"));

    for (const name of cookieNames) {
      document.cookie = `${name}=; Max-Age=0; path=/`;
    }
  }
}

export async function clearSupabaseLocalSession() {
  const supabase = getSupabaseBrowserClient();
  try {
    if (supabase) {
      await supabase.auth.signOut({ scope: "local" });
    }
  } catch {
    // ignore and force-clear local artifacts below
  }
  clearSupabaseBrowserAuthStorage();
}

export type SafeSessionResult = {
  session: Session | null;
  errorMessage?: string;
  sessionRecovered?: boolean;
};

export async function getSafeBrowserSession(): Promise<SafeSessionResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { session: null, errorMessage: "Cliente Supabase indisponível." };

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error && isInvalidRefreshTokenError(error)) {
      await clearSupabaseLocalSession();
      return {
        session: null,
        errorMessage: "Sessão expirada, entre novamente.",
        sessionRecovered: true
      };
    }
    return { session: data.session ?? null, errorMessage: error?.message };
  } catch (error) {
    if (isInvalidRefreshTokenError(error)) {
      await clearSupabaseLocalSession();
      return {
        session: null,
        errorMessage: "Sessão expirada, entre novamente.",
        sessionRecovered: true
      };
    }
    return { session: null, errorMessage: getErrorMessage(error) || "Falha ao ler sessão." };
  }
}
