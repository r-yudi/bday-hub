"use client";

import { type CSSProperties } from "react";

// Ajuste aqui a quantidade/posição dos orbs (mantido minimalista: 2 no desktop).
const ORBS: Array<{ id: number; className: string; style: CSSProperties }> = [
  {
    id: 1,
    className: "hero-art-orb hidden lg:block",
    style: { left: "14%", top: "12%", width: 86, height: 86, background: "hsl(var(--lilac) / 0.05)", animationDelay: "-4s" }
  },
  {
    id: 2,
    className: "hero-art-orb hidden lg:block",
    style: { right: "4%", top: "30%", width: 106, height: 106, background: "hsl(var(--primary) / 0.05)", animationDelay: "-10s" }
  }
];

function OutdoorPartyIllustration() {
  return (
    <img
      src="/illustrations/outdoor-party.svg"
      alt=""
      width={720}
      height={560}
      className="hero-art-illustration h-full w-full object-contain"
      loading="lazy"
      decoding="async"
    />
  );
}

function Balloon({ className, color, delay, duration }: { className?: string; color: string; delay: string; duration: string }) {
  return (
    <div className={`hero-art-balloon ${className ?? ""}`} style={{ animationDelay: delay, animationDuration: duration }}>
      <svg viewBox="0 0 44 86" className="h-full w-full" aria-hidden>
        <path d="M22 64c1.2 0 2.3-.5 3.2-1.3 7-6 11.3-15 11.3-25.1C36.5 20 30 8 22 8S7.5 20 7.5 37.6c0 10.2 4.2 19.1 11.3 25.1.9.8 2 1.3 3.2 1.3Z" fill={color} opacity="0.94" />
        <path d="M17 62h10l-5 7-5-7Z" fill={color} opacity="0.78" />
        <path d="M22 69c1 6-4 7-1 13" stroke="hsl(var(--surface) / 0.7)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

export function LandingCelebrationScene() {
  return (
    <div className="hero-art-shell pointer-events-none relative isolate overflow-visible" aria-hidden>
      <div className="hero-art-backdrop" />

      {ORBS.map((orb) => (
        <div key={orb.id} className={orb.className} style={orb.style} />
      ))}

      {/* Ajuste aqui o tamanho/posição da arte (wrapper e transform) para calibrar protagonismo. */}
      <div className="hero-art-stage relative z-[20] mx-auto w-full max-w-[420px] md:max-w-[540px] md:-translate-y-1 lg:max-w-[740px] lg:-translate-x-2 lg:-translate-y-1 xl:max-w-[800px] xl:-translate-x-3 xl:-translate-y-2 2xl:max-w-[840px]">
        <OutdoorPartyIllustration />
      </div>

      {/* Ajuste aqui os balões (quantidade/posição); mantidos fora da área do texto. */}
      <Balloon className="hidden lg:block absolute right-[6%] top-[2%] h-[4.5rem] w-[2.25rem] opacity-75" color="hsl(var(--primary) / 0.62)" delay="-2s" duration="14s" />
      <Balloon className="hidden lg:block absolute right-[21%] top-[0%] h-[3.5rem] w-[1.75rem] opacity-70" color="hsl(var(--lilac) / 0.58)" delay="-8s" duration="17s" />
    </div>
  );
}
