"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import {
  clearSupabaseLocalSession,
  getAuthRedirectBaseUrl,
  getSafeBrowserSession,
  getSupabaseBrowserClient,
  isInvalidRefreshTokenError,
  isSupabaseConfigured
} from "@/lib/supabase-browser";
import type { SyncStatus } from "@/lib/birthdaysRepo";

type AuthContextValue = {
  configured: boolean;
  initialized: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  syncStatus: SyncStatus;
  syncMessage: string | null;
  sessionNotice: string | null;
  dismissSessionNotice: () => void;
  signInWithGoogle: (returnTo?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function logAuthEventDev(event: string, userId?: string | null) {
  if (process.env.NODE_ENV !== "development") return;
  console.info("[auth]", event, userId ? { userId } : {});
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(configured);
  const [session, setSession] = useState<Session | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionNotice) return;
    const timer = window.setTimeout(() => setSessionNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [sessionNotice]);

  useEffect(() => {
    if (!configured) {
      setInitialized(true);
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setInitialized(true);
      setLoading(false);
      return;
    }

    let active = true;

    void getSafeBrowserSession()
      .then((result) => {
        if (!active) return;
        setSession(result.session);
        if (result.sessionRecovered) {
          setSessionNotice("Sessão expirada, entre novamente.");
        }
        logAuthEventDev("getSession:init", result.session?.user?.id ?? null);
      })
      .finally(() => {
        if (!active) return;
        setInitialized(true);
        setLoading(false);
      });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, nextSession) => {
      if (!active) return;
      logAuthEventDev(`onAuthStateChange:${event}`, nextSession?.user?.id ?? null);
      setSession(nextSession);
      if (event === "SIGNED_OUT") {
        setSyncStatus("idle");
        setSyncMessage(null);
      }
      setInitialized(true);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      initialized,
      loading,
      session,
      user: session?.user ?? null,
      syncStatus,
      syncMessage,
      sessionNotice,
      dismissSessionNotice() {
        setSessionNotice(null);
      },
      async signInWithGoogle(returnTo) {
        if (!configured) {
          return { error: "Supabase não configurado no ambiente." };
        }
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          return { error: "Cliente Supabase indisponível." };
        }

        const base = getAuthRedirectBaseUrl();
        const redirectTo = `${base}/auth/callback?returnTo=${encodeURIComponent(returnTo || "/today")}`;
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo
            }
          });

          if (error) return { error: error.message };
          return {};
        } catch (error) {
          if (isInvalidRefreshTokenError(error)) {
            await clearSupabaseLocalSession();
            setSession(null);
            setSessionNotice("Sessão expirada, entre novamente.");
            return { error: "Sessão expirada, entre novamente." };
          }
          return { error: error instanceof Error ? error.message : "Falha ao iniciar login com Google." };
        }
      },
      async signOut() {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;
        try {
          await supabase.auth.signOut();
        } catch (error) {
          if (isInvalidRefreshTokenError(error)) {
            await clearSupabaseLocalSession();
            setSession(null);
            setSessionNotice("Sessão expirada, entre novamente.");
          }
        }
        logAuthEventDev("signOut:manual");
      }
    }),
    [configured, initialized, loading, session, syncStatus, syncMessage, sessionNotice]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
