"use client";

import { type CSSProperties, useEffect, useState } from "react";

type Orb = {
  id: number;
  className: string;
  style: CSSProperties;
};

const ORBS: Orb[] = [
  { id: 1, className: "glow-orb", style: { left: "56%", top: "8%", width: 34, height: 34, background: "hsl(var(--lilac) / 0.14)", animationDelay: "0s", animationDuration: "32s" } },
  { id: 2, className: "glow-orb", style: { left: "64%", top: "18%", width: 22, height: 22, background: "hsl(var(--primary) / 0.12)", animationDelay: "-5s", animationDuration: "28s" } },
  { id: 3, className: "glow-orb", style: { left: "82%", top: "14%", width: 26, height: 26, background: "hsl(var(--accent) / 0.10)", animationDelay: "-8s", animationDuration: "36s" } },
  { id: 4, className: "glow-orb", style: { left: "74%", top: "34%", width: 18, height: 18, background: "hsl(var(--warning) / 0.08)", animationDelay: "-12s", animationDuration: "30s" } },
  { id: 5, className: "glow-orb", style: { left: "90%", top: "28%", width: 42, height: 42, background: "hsl(var(--lilac) / 0.08)", animationDelay: "-4s", animationDuration: "38s" } },
  { id: 6, className: "glow-orb", style: { left: "68%", top: "52%", width: 28, height: 28, background: "hsl(var(--primary) / 0.10)", animationDelay: "-16s", animationDuration: "34s" } },
  { id: 7, className: "glow-orb hidden sm:block", style: { left: "60%", top: "62%", width: 20, height: 20, background: "hsl(var(--accent) / 0.08)", animationDelay: "-10s", animationDuration: "40s" } },
  { id: 8, className: "glow-orb hidden lg:block", style: { left: "86%", top: "58%", width: 24, height: 24, background: "hsl(var(--warning) / 0.07)", animationDelay: "-20s", animationDuration: "28s" } }
];

function HugIllustration() {
  return (
    <svg viewBox="0 0 280 240" className="hug-illustration h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hugBodyA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary) / 0.72)" />
          <stop offset="100%" stopColor="hsl(var(--primary) / 0.48)" />
        </linearGradient>
        <linearGradient id="hugBodyB" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--accent) / 0.72)" />
          <stop offset="100%" stopColor="hsl(var(--lilac) / 0.5)" />
        </linearGradient>
      </defs>

      <ellipse cx="144" cy="208" rx="82" ry="16" fill="hsl(var(--text) / 0.08)" />

      <g opacity="0.9">
        <path d="M76 164c0-34 18-58 48-58s52 24 52 58v22H76v-22Z" fill="url(#hugBodyA)" />
        <circle cx="118" cy="92" r="26" fill="hsl(var(--warning) / 0.75)" />
        <path d="M94 142c14-22 34-14 52 8" stroke="hsl(var(--surface) / 0.8)" strokeWidth="12" strokeLinecap="round" />
        <path d="M88 154c14-10 30-8 42 8" stroke="hsl(var(--primary) / 0.8)" strokeWidth="10" strokeLinecap="round" />
      </g>

      <g opacity="0.95">
        <path d="M124 170c0-38 24-64 60-64 30 0 54 24 54 60v20h-114v-16Z" fill="url(#hugBodyB)" />
        <circle cx="184" cy="88" r="28" fill="hsl(var(--surface) / 0.95)" />
        <path d="M152 148c18-20 40-10 56 12" stroke="hsl(var(--surface) / 0.85)" strokeWidth="14" strokeLinecap="round" />
        <path d="M136 152c18-14 34-14 52 8" stroke="hsl(var(--lilac) / 0.7)" strokeWidth="10" strokeLinecap="round" />
      </g>

      <path d="M122 144c8 12 18 20 30 24" stroke="hsl(var(--surface) / 0.8)" strokeWidth="8" strokeLinecap="round" />
      <path d="M158 144c-6 14-18 24-34 28" stroke="hsl(var(--surface) / 0.78)" strokeWidth="8" strokeLinecap="round" />

      <circle cx="98" cy="66" r="14" fill="hsl(var(--lilac) / 0.18)" />
      <circle cx="214" cy="62" r="12" fill="hsl(var(--primary) / 0.14)" />
    </svg>
  );
}

function Balloon({ className, color, delay, duration }: { className?: string; color: string; delay: string; duration: string }) {
  return (
    <div className={`balloon ${className ?? ""}`} style={{ animationDelay: delay, animationDuration: duration }}>
      <svg viewBox="0 0 44 86" className="h-full w-full" aria-hidden>
        <path d="M22 64c1.2 0 2.3-.5 3.2-1.3 7-6 11.3-15 11.3-25.1C36.5 20 30 8 22 8S7.5 20 7.5 37.6c0 10.2 4.2 19.1 11.3 25.1.9.8 2 1.3 3.2 1.3Z" fill={color} opacity="0.95" />
        <path d="M17 62h10l-5 7-5-7Z" fill={color} opacity="0.8" />
        <path d="M22 69c1 6-4 7-1 13" stroke="hsl(var(--surface) / 0.7)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

function SparkBurst({ className, delay }: { className?: string; delay: string }) {
  return (
    <div className={`spark-burst ${className ?? ""}`} style={{ animationDelay: delay }}>
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden>
        <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.92">
          <path d="M32 6v10" />
          <path d="M32 48v10" />
          <path d="M6 32h10" />
          <path d="M48 32h10" />
          <path d="M13 13l7 7" />
          <path d="M44 44l7 7" />
          <path d="M51 13l-7 7" />
          <path d="M20 44l-7 7" />
        </g>
        <circle cx="32" cy="32" r="3.5" fill="currentColor" opacity="0.95" />
      </svg>
    </div>
  );
}

export function LandingCelebrationScene() {
  const [showBursts, setShowBursts] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "lembra_landing_celebration_bursts_seen";
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    setShowBursts(true);
    const timer = window.setTimeout(() => setShowBursts(false), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="celebration-scene absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
      {ORBS.map((orb) => (
        <div key={orb.id} className={orb.className} style={orb.style} />
      ))}

      <div className="absolute right-[-2%] top-[10%] h-[280px] w-[280px] opacity-70 sm:right-[4%] sm:top-[8%] sm:h-[320px] sm:w-[320px] lg:right-[10%] lg:top-[6%] lg:h-[360px] lg:w-[360px]">
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl dark:bg-primary/16" />
        <div className="absolute -left-10 top-16 h-24 w-24 rounded-full bg-lilac/10 blur-2xl dark:bg-lilac/16" />
        <HugIllustration />
      </div>

      <Balloon className="absolute right-[7%] top-[6%] h-20 w-10 sm:h-24 sm:w-12 lg:right-[14%]" color="hsl(var(--primary) / 0.78)" delay="-2s" duration="13s" />
      <Balloon className="absolute right-[18%] top-[3%] hidden h-24 w-12 sm:block lg:right-[26%] lg:h-28 lg:w-14" color="hsl(var(--lilac) / 0.72)" delay="-7s" duration="16s" />
      <Balloon className="absolute right-[2%] top-[20%] hidden h-16 w-9 md:block lg:right-[8%]" color="hsl(var(--accent) / 0.72)" delay="-11s" duration="12s" />
      <Balloon className="absolute right-[28%] top-[14%] hidden h-16 w-9 lg:block" color="hsl(var(--warning) / 0.66)" delay="-4s" duration="18s" />

      {showBursts && (
        <>
          <SparkBurst className="absolute right-[22%] top-[12%] hidden h-10 w-10 text-primary/70 sm:block dark:text-primary/80" delay="120ms" />
          <SparkBurst className="absolute right-[8%] top-[26%] h-8 w-8 text-lilac/50 dark:text-lilac/70" delay="240ms" />
          <SparkBurst className="absolute right-[30%] top-[28%] hidden h-9 w-9 text-accent/45 md:block dark:text-accent/65" delay="420ms" />
        </>
      )}
    </div>
  );
}
