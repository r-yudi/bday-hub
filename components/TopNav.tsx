"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const navItems = [
  { href: "/today", label: "Hoje" },
  { href: "/upcoming", label: "Próximos 7 dias" }
];

export function TopNav() {
  const pathname = usePathname();
  const { configured, initialized, user, signOut, syncStatus, syncMessage } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email || "Conta";
  const isLanding = pathname === "/" || pathname === "/landing";

  if (isLanding) {
    return (
      <header className="topnav-shell topnav-landing sticky top-0 z-10 border-b backdrop-blur">
        <div className="topnav-inner mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <Link href="/" className="topnav-brand inline-flex items-center gap-2 font-semibold tracking-tight">
            <span className="topnav-brand-dot" aria-hidden />
            <span className="topnav-brand-title">Lembra.</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={user ? "/today" : "/login?returnTo=%2Ftoday"}
              aria-label={configured && initialized && user ? "Continuar no app" : "Entrar com Google"}
              className="topnav-pill-cta btn-primary-brand ui-cta-primary text-primaryForeground focus-visible:outline-none"
            >
              {configured && initialized && user ? "Continuar" : "Entrar com Google"}
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="topnav-shell topnav-app sticky top-0 z-10 border-b backdrop-blur">
      <div className="topnav-inner mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <Link href="/today" className="topnav-brand inline-flex items-center gap-2 font-semibold tracking-tight">
          <span className="topnav-brand-dot" aria-hidden />
          <span className="topnav-brand-title">Lembra.</span>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2">
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
                      ? "topnav-pill-active scale-[1.02] text-primaryForeground shadow-sm"
                      : "topnav-pill ui-focus-surface border focus-visible:outline-none"
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {configured && (
            <div className="topnav-account-pill ui-surface-elevated flex items-center gap-2 rounded-full border px-2 py-1">
              {user && syncMessage && (
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    syncStatus === "syncing"
                      ? "bg-warning/15 text-warning"
                      : syncStatus === "synced"
                        ? "bg-success/15 text-success"
                        : syncStatus === "error"
                          ? "bg-danger/12 text-danger"
                          : "bg-surface2 text-muted"
                  ].join(" ")}
                >
                  {syncStatus === "syncing" ? "Atualizando..." : syncStatus === "synced" ? "Tudo em dia" : syncMessage}
                </span>
              )}
              <span className="max-w-40 truncate px-2 text-xs text-muted sm:max-w-52" title={displayName}>
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
