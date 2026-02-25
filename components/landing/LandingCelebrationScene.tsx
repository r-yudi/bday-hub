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

function OutdoorPartyIllustration() {
  return (
    <img
      src="/illustrations/outdoor-party.svg"
      alt=""
      width={680}
      height={520}
      className="outdoor-party-illustration h-full w-full object-contain"
      loading="lazy"
      decoding="async"
    />
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
    <div className="celebration-scene pointer-events-none absolute inset-0 z-0 overflow-visible" aria-hidden>
      {ORBS.map((orb) => (
        <div key={orb.id} className={orb.className} style={orb.style} />
      ))}

      <div className="outdoor-party-wrap absolute right-[-6%] top-[6%] hidden h-[420px] w-[420px] md:block lg:right-[-2%] lg:top-[-2%] lg:h-[560px] lg:w-[560px] xl:right-[2%] xl:h-[640px] xl:w-[640px]">
        <div className="absolute inset-[8%] rounded-full bg-primary/8 blur-3xl dark:bg-primary/14" />
        <div className="absolute left-[8%] top-[22%] h-28 w-28 rounded-full bg-lilac/8 blur-2xl dark:bg-lilac/14" />
        <div className="absolute inset-0 outdoor-party-fade">
          <OutdoorPartyIllustration />
        </div>
      </div>

      <Balloon className="absolute right-[4%] top-[4%] h-16 w-8 sm:h-20 sm:w-10 lg:right-[10%] lg:top-[2%]" color="hsl(var(--primary) / 0.74)" delay="-2s" duration="13s" />
      <Balloon className="absolute right-[20%] top-[2%] hidden h-20 w-10 sm:block lg:right-[24%] lg:h-24 lg:w-12" color="hsl(var(--lilac) / 0.68)" delay="-7s" duration="16s" />
      <Balloon className="absolute right-[2%] top-[24%] hidden h-14 w-8 md:block lg:right-[6%]" color="hsl(var(--accent) / 0.66)" delay="-11s" duration="12s" />
      <Balloon className="absolute right-[30%] top-[18%] hidden h-14 w-8 lg:block" color="hsl(var(--warning) / 0.58)" delay="-4s" duration="18s" />

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
