"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { debugTestBirthdaysTable } from "@/lib/birthdaysRepo";

type StatusBlock = {
  label: string;
  ok?: boolean;
  text: string;
};

type SafeUser = {
  id: string;
  email: string | null;
};

type HealthState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; httpStatus: number; bodyText: string }
  | { status: "error"; message: string };

type SessionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; hasSession: boolean; user: SafeUser | null; error?: string }
  | { status: "error"; message: string };

type UserState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; hasUser: boolean; user: SafeUser | null; error?: string }
  | { status: "error"; message: string };

type DbState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "done";
      ok: boolean;
      rowCount: number;
      rlsOk?: boolean;
      error?: string;
      stage?: "read_probe" | "upsert_self" | "select_self";
    }
  | { status: "error"; message: string };

type ClearState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; message: string }
  | { status: "error"; message: string };

type BirthdaysDbState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; ok: boolean; count?: number; message?: string }
  | { status: "error"; message: string };

function safeSupabaseHostname() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

function pickUser(user: User | null | undefined): SafeUser | null {
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}

function clearSupabaseBrowserStorage() {
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

function friendlyDbErrorMessage(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("rls") || lower.includes("permission denied")) {
    return `RLS bloqueou a operação. Revise policies de user_settings para auth.uid() = user_id. (${message})`;
  }
  if (lower.includes("relation") && lower.includes("does not exist")) {
    return `Tabela não encontrada. Confirme se 'user_settings' existe em public. (${message})`;
  }
  if (lower.includes("column") && lower.includes("does not exist")) {
    return `Coluna esperada não existe. O debug usa user_settings.user_id. (${message})`;
  }
  return message;
}

export default function DebugSupabasePage() {
  const configured = isSupabaseConfigured();
  const hostname = useMemo(() => safeSupabaseHostname(), []);
  const [health, setHealth] = useState<HealthState>({ status: "idle" });
  const [sessionState, setSessionState] = useState<SessionState>({ status: "idle" });
  const [userState, setUserState] = useState<UserState>({ status: "idle" });
  const [dbState, setDbState] = useState<DbState>({ status: "idle" });
  const [birthdaysDbState, setBirthdaysDbState] = useState<BirthdaysDbState>({ status: "idle" });
  const [clearState, setClearState] = useState<ClearState>({ status: "idle" });

  async function runHealthCheck() {
    if (!configured) {
      setHealth({ status: "error", message: "Supabase não configurado." });
      return;
    }

    setHealth({ status: "loading" });
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
        headers: {
          apikey: anonKey
        }
      });

      const bodyText = await response.text();
      setHealth({ status: "done", httpStatus: response.status, bodyText });
    } catch (error) {
      setHealth({ status: "error", message: error instanceof Error ? error.message : "Falha de rede" });
    }
  }

  async function runSessionChecks() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setSessionState({ status: "error", message: "Cliente Supabase indisponível." });
      setUserState({ status: "error", message: "Cliente Supabase indisponível." });
      return;
    }

    setSessionState({ status: "loading" });
    setUserState({ status: "loading" });

    try {
      const { data, error } = await supabase.auth.getSession();
      setSessionState({
        status: "done",
        hasSession: Boolean(data.session),
        user: pickUser(data.session?.user),
        error: error?.message
      });
    } catch (error) {
      setSessionState({ status: "error", message: error instanceof Error ? error.message : "Falha desconhecida" });
    }

    try {
      const { data, error } = await supabase.auth.getUser();
      setUserState({
        status: "done",
        hasUser: Boolean(data.user),
        user: pickUser(data.user),
        error: error?.message
      });
    } catch (error) {
      setUserState({ status: "error", message: error instanceof Error ? error.message : "Falha desconhecida" });
    }
  }

  async function testDb() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setDbState({ status: "error", message: "Cliente Supabase indisponível." });
      return;
    }

    setDbState({ status: "loading" });

    try {
      const { data: authData, error: authError } = await supabase.auth.getSession();
      const userId = authData.session?.user?.id;

      if (authError || !userId) {
        setDbState({
          status: "done",
          ok: false,
          rowCount: 0,
          stage: "read_probe",
          error: friendlyDbErrorMessage(authError?.message || "Sem sessão ativa. Faça login para testar DB.")
        });
        return;
      }

      const probe = await supabase.from("user_settings").select("user_id").limit(1);
      if (probe.error) {
        setDbState({
          status: "done",
          ok: false,
          rowCount: 0,
          stage: "read_probe",
          error: friendlyDbErrorMessage(probe.error.message)
        });
        return;
      }

      const upsert = await supabase
        .from("user_settings")
        .upsert(
          {
            user_id: userId,
            timezone: "America/Sao_Paulo"
          },
          { onConflict: "user_id" }
        )
        .select("user_id")
        .single();

      if (upsert.error) {
        setDbState({
          status: "done",
          ok: false,
          rowCount: probe.data?.length ?? 0,
          stage: "upsert_self",
          error: friendlyDbErrorMessage(upsert.error.message)
        });
        return;
      }

      const ownRow = await supabase.from("user_settings").select("user_id").eq("user_id", userId).single();
      if (ownRow.error) {
        setDbState({
          status: "done",
          ok: false,
          rowCount: probe.data?.length ?? 0,
          stage: "select_self",
          error: friendlyDbErrorMessage(ownRow.error.message)
        });
        return;
      }

      setDbState({
        status: "done",
        ok: true,
        rowCount: probe.data?.length ?? 0,
        rlsOk: ownRow.data?.user_id === userId
      });
    } catch (error) {
      setDbState({ status: "error", message: error instanceof Error ? error.message : "Falha desconhecida" });
    }
  }

  async function clearLocalSession() {
    const supabase = getSupabaseBrowserClient();
    setClearState({ status: "loading" });
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      clearSupabaseBrowserStorage();
      setClearState({ status: "done", message: "Sessão local limpa (signOut + storage/cookies sb-*)." });
      await runSessionChecks();
    } catch (error) {
      setClearState({ status: "error", message: error instanceof Error ? error.message : "Falha desconhecida" });
    }
  }

  async function testBirthdaysDb() {
    setBirthdaysDbState({ status: "loading" });
    try {
      const result = await debugTestBirthdaysTable();
      if (!result.ok) {
        setBirthdaysDbState({ status: "done", ok: false, message: result.message });
        return;
      }
      setBirthdaysDbState({ status: "done", ok: true, count: result.count });
    } catch (error) {
      setBirthdaysDbState({ status: "error", message: error instanceof Error ? error.message : "Falha desconhecida" });
    }
  }

  useEffect(() => {
    if (!configured) return;
    void runHealthCheck();
    void runSessionChecks();
  }, [configured]);

  const summary: StatusBlock[] = [
    {
      label: "Config",
      ok: configured,
      text: configured ? "Supabase configurado" : "Env vars ausentes"
    },
    {
      label: "Health",
      ok: health.status === "done" ? health.httpStatus >= 200 && health.httpStatus < 300 : undefined,
      text:
        health.status === "idle"
          ? "Aguardando"
          : health.status === "loading"
            ? "Testando /auth/v1/health..."
            : health.status === "done"
              ? `HTTP ${health.httpStatus}`
              : health.message
    },
    {
      label: "Session",
      ok: sessionState.status === "done" ? sessionState.hasSession : undefined,
      text:
        sessionState.status === "done"
          ? sessionState.hasSession
            ? `session OK (${sessionState.user?.id ?? "-"})`
            : `session null${sessionState.error ? ` (${sessionState.error})` : ""}`
          : sessionState.status === "error"
            ? sessionState.message
            : sessionState.status === "loading"
              ? "Carregando..."
              : "Aguardando"
    },
    {
      label: "User",
      ok: userState.status === "done" ? userState.hasUser : undefined,
      text:
        userState.status === "done"
          ? userState.hasUser
            ? `user OK (${userState.user?.id ?? "-"})`
            : `user null${userState.error ? ` (${userState.error})` : ""}`
          : userState.status === "error"
            ? userState.message
            : userState.status === "loading"
              ? "Carregando..."
              : "Aguardando"
    }
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className="rounded-3xl border border-black/10 bg-white/95 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-black/60">Debug • Supabase Auth</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black/90 sm:text-[2rem]">Diagnóstico Supabase</h1>
        <p className="mt-2 text-sm text-black/70">
          Use esta tela para validar health, sessão local, `getUser()` e validação real de RLS em `user_settings`.
        </p>
        <p className="mt-3 text-xs text-black/60">
          <span className="font-semibold text-black/75">Host Supabase:</span> {hostname ?? "(inválido/ausente)"}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {summary.map((item) => (
          <div key={item.label} className="rounded-2xl border border-black/10 bg-white/90 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-black/60">{item.label}</p>
            <p
              className={[
                "mt-1 text-sm",
                item.ok === true ? "text-emerald-700" : item.ok === false ? "text-rose-700" : "text-black/75"
              ].join(" ")}
            >
              {item.text}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-black/10 bg-white/90 p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void runHealthCheck()}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/5"
          >
            Recarregar health
          </button>
          <button
            type="button"
            onClick={() => void runSessionChecks()}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/5"
          >
            Recarregar sessão/user
          </button>
          <button
            type="button"
            onClick={() => void testDb()}
            className="btn-primary-brand rounded-xl bg-accent px-3 py-2 text-sm text-white hover:bg-accentHover"
          >
            Testar DB
          </button>
          <button
            type="button"
            onClick={() => void testBirthdaysDb()}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/5"
          >
            Testar Birthdays
          </button>
          <button
            type="button"
            onClick={() => void clearLocalSession()}
            className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 hover:bg-amber-100"
          >
            Limpar sessão local
          </button>
        </div>

        {dbState.status !== "idle" && (
          <p className="mt-3 text-sm">
            <span className="font-medium text-black/75">DB:</span>{" "}
            {dbState.status === "loading" && (
              <span className="text-black/70">Executando validação em `user_settings` (read probe + upsert/select do próprio usuário)...</span>
            )}
            {dbState.status === "done" && dbState.ok && (
              <span className="text-emerald-700">
                DB OK {dbState.rlsOk ? "(RLS OK)" : ""} (probe: {dbState.rowCount} linha(s))
              </span>
            )}
            {dbState.status === "done" && !dbState.ok && (
              <span className="text-rose-700">
                Erro{dbState.stage ? ` [${dbState.stage}]` : ""}: {dbState.error}
              </span>
            )}
            {dbState.status === "error" && <span className="text-rose-700">Erro: {dbState.message}</span>}
          </p>
        )}

        {clearState.status !== "idle" && (
          <p className="mt-2 text-sm">
            <span className="font-medium text-black/75">Sessão local:</span>{" "}
            {clearState.status === "loading" && <span className="text-black/70">Limpando...</span>}
            {clearState.status === "done" && <span className="text-emerald-700">{clearState.message}</span>}
            {clearState.status === "error" && <span className="text-rose-700">{clearState.message}</span>}
          </p>
        )}

        {birthdaysDbState.status !== "idle" && (
          <p className="mt-2 text-sm">
            <span className="font-medium text-black/75">Birthdays:</span>{" "}
            {birthdaysDbState.status === "loading" && <span className="text-black/70">Validando count + upsert/delete dummy...</span>}
            {birthdaysDbState.status === "done" && birthdaysDbState.ok && (
              <span className="text-emerald-700">DB OK (birthdays) • count atual: {birthdaysDbState.count ?? 0}</span>
            )}
            {birthdaysDbState.status === "done" && !birthdaysDbState.ok && (
              <span className="text-rose-700">Erro: {birthdaysDbState.message}</span>
            )}
            {birthdaysDbState.status === "error" && <span className="text-rose-700">Erro: {birthdaysDbState.message}</span>}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-black/10 bg-white/90 p-4 shadow-sm text-sm">
        <h2 className="font-semibold tracking-tight text-black/85">Detalhes técnicos</h2>

        <div className="mt-3 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-black/60">/auth/v1/health</p>
            <pre className="mt-2 overflow-x-auto rounded-xl border border-black/10 bg-black/[0.03] p-3 text-xs text-black/75">
              {health.status === "done"
                ? `status: ${health.httpStatus}\nbody:\n${health.bodyText || "(vazio)"}`
                : health.status === "error"
                  ? `erro: ${health.message}`
                  : "sem resultado ainda"}
            </pre>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-black/60">supabase.auth.getSession()</p>
            <pre className="mt-2 overflow-x-auto rounded-xl border border-black/10 bg-black/[0.03] p-3 text-xs text-black/75">
              {JSON.stringify(sessionState, null, 2)}
            </pre>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-black/60">supabase.auth.getUser()</p>
            <pre className="mt-2 overflow-x-auto rounded-xl border border-black/10 bg-black/[0.03] p-3 text-xs text-black/75">
              {JSON.stringify(userState, null, 2)}
            </pre>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-black/60">DB debug</p>
            <pre className="mt-2 overflow-x-auto rounded-xl border border-black/10 bg-black/[0.03] p-3 text-xs text-black/75">
              {JSON.stringify(dbState, null, 2)}
            </pre>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-black/60">Birthdays DB debug</p>
            <pre className="mt-2 overflow-x-auto rounded-xl border border-black/10 bg-black/[0.03] p-3 text-xs text-black/75">
              {JSON.stringify(birthdaysDbState, null, 2)}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
