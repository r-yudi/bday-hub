"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { syncBirthdaysAfterSignIn, type SyncStatus } from "@/lib/birthdaysRepo";

type AuthContextValue = {
  configured: boolean;
  initialized: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  syncStatus: SyncStatus;
  syncMessage: string | null;
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

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session ?? null);
        logAuthEventDev("getSession:init", data.session?.user?.id ?? null);
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
      setInitialized(true);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  useEffect(() => {
    if (!configured) return;
    const userId = session?.user?.id;
    if (!userId) {
      setSyncStatus("idle");
      setSyncMessage(null);
      return;
    }

    let active = true;
    setSyncStatus("syncing");
    setSyncMessage("Sincronizando...");

    void syncBirthdaysAfterSignIn()
      .then((result) => {
        if (!active) return;
        if (!result.ok) {
          setSyncStatus("error");
          setSyncMessage(result.message || "Falha ao sincronizar");
          return;
        }
        setSyncStatus("synced");
        setSyncMessage(`Sincronizado (${result.syncedCount})`);
        window.setTimeout(() => {
          if (!active) return;
          setSyncStatus("idle");
          setSyncMessage(null);
        }, 2500);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setSyncStatus("error");
        setSyncMessage(error instanceof Error ? error.message : "Falha ao sincronizar");
      });

    return () => {
      active = false;
    };
  }, [configured, session?.user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      initialized,
      loading,
      session,
      user: session?.user ?? null,
      syncStatus,
      syncMessage,
      async signInWithGoogle(returnTo) {
        if (!configured) {
          return { error: "Supabase não configurado no ambiente." };
        }
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          return { error: "Cliente Supabase indisponível." };
        }

        const redirectTo = `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(returnTo || "/today")}`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo
          }
        });

        if (error) return { error: error.message };
        return {};
      },
      async signOut() {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;
        await supabase.auth.signOut();
        logAuthEventDev("signOut:manual");
      }
    }),
    [configured, initialized, loading, session, syncStatus, syncMessage]
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
