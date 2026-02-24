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
  const isLanding = pathname === "/";

  if (isLanding) {
    return (
      <header className="sticky top-0 z-10 border-b border-black/5 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="group inline-flex flex-col font-semibold tracking-tight">
            <span>Lembra.</span>
            <span className="mt-1 h-0.5 w-10 rounded-full bg-accent transition-all duration-150 ease-out group-hover:w-12" />
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/today" className="rounded-full bg-white/85 px-3 py-1.5 text-sm hover:bg-white hover:shadow-sm">
              Hoje
            </Link>
            <Link href="/upcoming" className="rounded-full bg-white/85 px-3 py-1.5 text-sm hover:bg-white hover:shadow-sm">
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
    <header className="sticky top-0 z-10 border-b border-black/5 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/today" className="group inline-flex flex-col font-semibold tracking-tight">
          <span>Lembra.</span>
          <span className="mt-1 h-0.5 w-10 rounded-full bg-accent transition-all duration-150 ease-out group-hover:w-12" />
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
                    "rounded-full px-3 py-1.5 text-sm transform-gpu duration-150 ease-out",
                    active
                      ? "scale-[1.02] bg-accent text-white shadow-sm"
                      : "bg-white/80 hover:-translate-y-px hover:bg-white hover:shadow-sm"
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {configured && (
            <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-2 py-1">
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
                  {syncMessage}
                </span>
              )}
              <span className="max-w-40 truncate px-2 text-xs text-black/70 sm:max-w-52" title={displayName}>
                {!initialized ? "Carregando sessão..." : user ? displayName : "Não conectado"}
              </span>
              {user ? (
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs hover:bg-black/5"
                >
                  Sair
                </button>
              ) : (
                <Link href="/login" className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs hover:bg-black/5">
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
