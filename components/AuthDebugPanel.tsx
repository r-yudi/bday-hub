"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type DbCheckState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; rows: number }
  | { status: "error"; message: string };

export function AuthDebugPanel() {
  const { configured, initialized, session, user } = useAuth();
  const [dbCheck, setDbCheck] = useState<DbCheckState>({ status: "idle" });

  const provider = useMemo(() => {
    if (!user) return "-";
    return user.app_metadata?.provider || user.identities?.[0]?.provider || "-";
  }, [user]);

  useEffect(() => {
    if (!configured || !initialized || !session || !user) {
      setDbCheck({ status: "idle" });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setDbCheck({ status: "error", message: "Cliente Supabase indisponível." });
      return;
    }

    let active = true;
    setDbCheck({ status: "loading" });

    void (async () => {
      try {
        const { data, error } = await supabase.from("birthdays").select("id", { count: "exact" }).limit(1);
        if (!active) return;
        if (error) {
          setDbCheck({ status: "error", message: error.message });
          return;
        }
        setDbCheck({ status: "ok", rows: data?.length ?? 0 });
      } catch (error) {
        if (!active) return;
        setDbCheck({ status: "error", message: error instanceof Error ? error.message : "Falha desconhecida" });
      }
    })();

    return () => {
      active = false;
    };
  }, [configured, initialized, session, user]);

  return (
    <section className="ui-prose-panel p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Debug Auth / Supabase</h2>
      <div className="mt-3 space-y-2 text-sm">
        <p>
          <span className="text-muted">status:</span>{" "}
          <span className="font-medium text-text">
            {!configured ? "Supabase não configurado" : !initialized ? "loading" : user ? "logged in" : "logged out"}
          </span>
        </p>
        <p>
          <span className="text-muted">user id:</span> <span className="font-mono text-xs text-text">{user?.id ?? "-"}</span>
        </p>
        <p>
          <span className="text-muted">provider:</span> <span className="font-medium text-text">{provider}</span>
        </p>
        <p>
          <span className="text-muted">Auth:</span>{" "}
          <span className={user ? "text-emerald-700 dark:text-emerald-300" : "text-muted"}>
            {user ? "Auth OK" : "Aguardando login"}
          </span>
        </p>
        <p>
          <span className="text-muted">DB:</span>{" "}
          {dbCheck.status === "idle" && <span className="text-muted">Aguardando sessão</span>}
          {dbCheck.status === "loading" && <span className="text-muted">Testando query...</span>}
          {dbCheck.status === "ok" && <span className="text-emerald-700 dark:text-emerald-300">DB OK (query executada)</span>}
          {dbCheck.status === "error" && <span className="text-rose-700 dark:text-rose-300">Falha: {dbCheck.message}</span>}
        </p>
      </div>
    </section>
  );
}
