"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ThemeModeControl } from "@/components/ThemeModeControl";
import { SiteHeader } from "@/components/nav/SiteHeader";

const navItems = [
  { href: "/today", label: "Hoje" },
  { href: "/people", label: "Pessoas" },
  { href: "/share", label: "Compartilhar" },
  { href: "/settings", label: "Configurações" }
];

export function TopNav() {
  const pathname = usePathname();
  const { configured, initialized, user, signOut, syncStatus, syncMessage } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email || "Conta";
  const isLanding = pathname === "/" || pathname === "/landing";

  if (isLanding) {
    const conversionCta = !(configured && initialized && user);
    return (
      <SiteHeader
        position="sticky"
        left={
          <Link href="/" className="topnav-brand gap-2 tracking-tight">
            <span className="topnav-brand-dot" aria-hidden />
            <span className="topnav-brand-title">Lembra.</span>
          </Link>
        }
        right={
          <div className="nav-header-end">
            <ThemeModeControl />
            <Link
              href={user ? "/today" : "/login?returnTo=%2Ftoday"}
              aria-label={configured && initialized && user ? "Continuar no app" : "Entrar com Google"}
              className={[
                conversionCta ? "topnav-pill-cta" : "topnav-pill-cta-quiet",
                "focus-visible:outline-none"
              ].join(" ")}
            >
              {configured && initialized && user ? "Continuar" : "Entrar com Google"}
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <SiteHeader
      position="sticky"
      left={
        <Link href="/today" className="topnav-brand gap-2 tracking-tight">
          <span className="topnav-brand-dot" aria-hidden />
          <span className="topnav-brand-title">Lembra.</span>
        </Link>
      }
      right={
        <div className="nav-header-end">
          <ThemeModeControl />
          <nav aria-label="Principal">
            <ul className="nav-header-links">
              {navItems.map((item) => {
                const active =
                  pathname === item.href || (item.href === "/share" && pathname.startsWith("/share/"));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className="nav-header-link"
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          {configured && (
            <div className="nav-header-account-cluster">
              {user && syncMessage && (
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-[11px] font-medium leading-tight",
                    syncStatus === "syncing"
                      ? "bg-warning/8 text-warning/95"
                      : syncStatus === "synced"
                        ? "bg-success/8 text-success/95"
                        : syncStatus === "error"
                          ? "bg-danger/8 text-danger/95"
                          : "bg-surface2/40 text-muted"
                  ].join(" ")}
                >
                  {syncStatus === "syncing"
                    ? "Atualizando..."
                    : syncStatus === "synced"
                      ? "Tudo em dia"
                      : syncMessage}
                </span>
              )}
              <span className="nav-header-account-label truncate" title={displayName}>
                {!initialized ? "Carregando sessão..." : user ? displayName : "Não conectado"}
              </span>
              {user ? (
                <button type="button" onClick={() => void signOut()} className="nav-header-subtle-action">
                  Sair
                </button>
              ) : (
                <Link href="/login" className="nav-header-subtle-action">
                  Entrar
                </Link>
              )}
            </div>
          )}
        </div>
      }
    />
  );
}
