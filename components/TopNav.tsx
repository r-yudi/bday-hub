"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useThemeMode } from "@/components/ThemeProvider";

const navItems = [
  { href: "/today", label: "Hoje" },
  { href: "/upcoming", label: "Próximos 7 dias" }
];

export function TopNav() {
  const pathname = usePathname();
  const { configured, initialized, user, signOut, syncStatus, syncMessage } = useAuth();
  const { themeMode, setThemeMode } = useThemeMode();
  const displayName = user?.user_metadata?.full_name || user?.email || "Conta";
  const isLanding = pathname === "/";

  const themeSelectClass =
    "rounded-full border border-black/10 bg-white/85 px-3 py-1.5 text-black/75 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15";

  if (isLanding) {
    return (
      <header className="sticky top-0 z-10 border-b border-black/5 bg-paper/90 backdrop-blur dark:border-white/5">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="group inline-flex flex-col font-semibold tracking-tight">
            <span>Lembra.</span>
            <span className="mt-1 h-0.5 w-10 rounded-full bg-accent transition-all duration-150 ease-out group-hover:w-12" />
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="theme-mode-home">
              Tema
            </label>
            <select
              id="theme-mode-home"
              value={themeMode}
              onChange={(e) => setThemeMode(e.target.value as "light" | "dark" | "system")}
              className={`${themeSelectClass} text-sm`}
            >
              <option value="system">Sistema</option>
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
            </select>
            <Link href="/today" className="rounded-full bg-white/85 px-3 py-1.5 text-sm hover:bg-white hover:shadow-sm dark:bg-white/10 dark:hover:bg-white/15">
              Hoje
            </Link>
            <Link href="/upcoming" className="rounded-full bg-white/85 px-3 py-1.5 text-sm hover:bg-white hover:shadow-sm dark:bg-white/10 dark:hover:bg-white/15">
              Próximos 7 dias
            </Link>
            <Link
              href={user ? "/today" : "/login?returnTo=%2Ftoday"}
              className="btn-primary-brand rounded-full bg-accent px-3 py-1.5 text-sm text-white hover:bg-accentHover"
            >
              {configured && initialized && user ? "Continuar" : "Entrar"}
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-paper/90 backdrop-blur dark:border-white/5">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/today" className="group inline-flex flex-col font-semibold tracking-tight">
          <span>Lembra.</span>
          <span className="mt-1 h-0.5 w-10 rounded-full bg-accent transition-all duration-150 ease-out group-hover:w-12" />
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <label className="sr-only" htmlFor="theme-mode-app">
            Tema
          </label>
          <select
            id="theme-mode-app"
            value={themeMode}
            onChange={(e) => setThemeMode(e.target.value as "light" | "dark" | "system")}
            className={`${themeSelectClass} text-xs`}
            title="Tema"
          >
            <option value="system">Sistema</option>
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
          </select>

          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-full px-3 py-1.5 text-sm transform-gpu duration-150 ease-out",
                    active
                      ? "scale-[1.02] bg-accent text-white shadow-sm"
                      : "bg-white/80 hover:-translate-y-px hover:bg-white hover:shadow-sm dark:bg-white/10 dark:hover:bg-white/15"
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {configured && (
            <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-2 py-1 dark:border-white/15 dark:bg-white/10">
              {user && syncMessage && (
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    syncStatus === "syncing"
                      ? "bg-amber-50 text-amber-800"
                      : syncStatus === "synced"
                        ? "bg-emerald-50 text-emerald-700"
                        : syncStatus === "error"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-black/5 text-black/60"
                  ].join(" ")}
                >
                  {syncStatus === "syncing" ? "Atualizando..." : syncStatus === "synced" ? "Tudo em dia" : syncMessage}
                </span>
              )}
              <span className="max-w-40 truncate px-2 text-xs text-black/70 sm:max-w-52 dark:text-white/75" title={displayName}>
                {!initialized ? "Carregando sessão..." : user ? displayName : "Não conectado"}
              </span>
              {user ? (
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs hover:bg-black/5 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15"
                >
                  Sair
                </button>
              ) : (
                <Link href="/login" className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs hover:bg-black/5 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15">
                  Entrar
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
