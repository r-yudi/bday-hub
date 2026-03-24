"use client";

import Link from "next/link";
import { ThemeModeControl } from "@/components/ThemeModeControl";
import { SiteHeader } from "@/components/nav/SiteHeader";

export function LandingNav() {
  return (
    <SiteHeader
      position="fixed"
      left={
        <Link href="/" className="topnav-brand gap-2 tracking-tight">
          <span className="topnav-brand-dot" aria-hidden />
          <span className="topnav-brand-title">Lembra.</span>
        </Link>
      }
      right={
        <ul className="nav-header-links landing-header-actions">
          <li className="nav-header-slot--landing-anchor">
            <Link href="#why" className="nav-header-link">
              Por que usar
            </Link>
          </li>
          <li className="nav-header-slot--landing-anchor">
            <Link href="#reminder" className="nav-header-link">
              Como funciona
            </Link>
          </li>
          <li className="nav-header-slot--landing-anchor">
            <Link href="#trust" className="nav-header-link">
              Privacidade
            </Link>
          </li>
          <li>
            <ThemeModeControl />
          </li>
          <li>
            <Link href="/today?onboarding=1" className="topnav-pill-cta focus-visible:outline-none">
              Começar grátis
            </Link>
          </li>
        </ul>
      }
    />
  );
}
