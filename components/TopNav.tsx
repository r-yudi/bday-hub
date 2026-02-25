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
  const isLanding = pathname === "/" || pathname === "/landing";

  const themeSelectClass =
    "ui-focus-surface rounded-full border px-3 py-1.5 text-black/80 focus-visible:outline-none dark:text-text";

  if (isLanding) {
    return (
      <header className="sticky top-0 z-10 border-b border-black/5 bg-paper/90 backdrop-blur dark:border-border/40 dark:bg-background/80">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="group inline-flex flex-col font-semibold tracking-tight">
            <span>Lembra.</span>
            <span className="mt-1 h-0.5 w-10 rounded-full bg-primary transition-all duration-150 ease-brand group-hover:w-12" />
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
            <Link href="/today" className="ui-focus-surface inline-flex items-center rounded-full border px-3 py-1.5 text-sm text-black/85 focus-visible:outline-none dark:text-text">
              Hoje
            </Link>
            <Link href="/upcoming" className="ui-focus-surface inline-flex items-center rounded-full border px-3 py-1.5 text-sm text-black/85 focus-visible:outline-none dark:text-text">
              Próximos 7 dias
            </Link>
            <Link
              href={user ? "/today" : "/login?returnTo=%2Ftoday"}
              className="btn-primary-brand ui-cta-primary rounded-full bg-primary px-3 py-1.5 text-sm text-primaryForeground hover:bg-accentHover focus-visible:outline-none"
            >
              {configured && initialized && user ? "Continuar" : "Entrar"}
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-paper/90 backdrop-blur dark:border-border/40 dark:bg-background/80">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/today" className="group inline-flex flex-col font-semibold tracking-tight">
          <span>Lembra.</span>
          <span className="mt-1 h-0.5 w-10 rounded-full bg-primary transition-all duration-150 ease-brand group-hover:w-12" />
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
                    "rounded-full px-3 py-1.5 text-sm transform-gpu duration-150 ease-brand",
                    active
                      ? "scale-[1.02] bg-primary text-primaryForeground shadow-sm"
                      : "ui-focus-surface border text-black/85 focus-visible:outline-none dark:text-text"
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {configured && (
            <div className="ui-surface-elevated flex items-center gap-2 rounded-full border px-2 py-1">
              {user && syncMessage && (
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    syncStatus === "syncing"
                      ? "bg-warning/15 text-warning dark:bg-warning/20 dark:text-warning"
                      : syncStatus === "synced"
                        ? "bg-success/15 text-success dark:bg-success/20 dark:text-success"
                        : syncStatus === "error"
                          ? "bg-danger/12 text-danger dark:bg-danger/18 dark:text-danger"
                          : "bg-surface2 text-muted dark:bg-surface2/90 dark:text-muted"
                  ].join(" ")}
                >
                  {syncStatus === "syncing" ? "Atualizando..." : syncStatus === "synced" ? "Tudo em dia" : syncMessage}
                </span>
              )}
              <span className="max-w-40 truncate px-2 text-xs text-muted sm:max-w-52 dark:text-text" title={displayName}>
                {!initialized ? "Carregando sessão..." : user ? displayName : "Não conectado"}
              </span>
              {user ? (
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="ui-focus-surface rounded-full border px-2.5 py-1 text-xs focus-visible:outline-none"
                >
                  Sair
                </button>
              ) : (
                <Link href="/login" className="ui-focus-surface inline-flex items-center rounded-full border px-2.5 py-1 text-xs focus-visible:outline-none">
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
