"use client";

import { type CSSProperties } from "react";

// Radial Cut Explosion: pure abstraction. Large particles (12–24px), few (4–8).
const RADIALCUT_PARTICLES: Array<{
  id: number;
  left: string;
  top: string;
  size: number;
  colorClass: string;
  delay: string;
}> = [
  { id: 1, left: "22%", top: "28%", size: 18, colorClass: "confetti-coral", delay: "-1s" },
  { id: 2, left: "48%", top: "18%", size: 14, colorClass: "confetti-lilac", delay: "-2s" },
  { id: 3, left: "68%", top: "38%", size: 20, colorClass: "confetti-mint", delay: "-0.5s" },
  { id: 4, left: "35%", top: "48%", size: 16, colorClass: "confetti-gold", delay: "-1.5s" },
  { id: 5, left: "78%", top: "22%", size: 14, colorClass: "confetti-coral", delay: "-2.5s" },
  { id: 6, left: "58%", top: "55%", size: 18, colorClass: "confetti-lilac", delay: "-1.2s" }
];

// Default variant (2-col legacy): orbs + confetti + illustration.
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

const CONFETTI_PIECES: Array<{
  id: number;
  left: string;
  top: string;
  rotate: number;
  colorClass: string;
  kind: "dot" | "streamer";
  delay: string;
}> = [
  { id: 1, left: "26%", top: "17%", rotate: -22, colorClass: "confetti-coral", kind: "streamer", delay: "-1.2s" },
  { id: 2, left: "33%", top: "24%", rotate: 14, colorClass: "confetti-lilac", kind: "dot", delay: "-2.8s" },
  { id: 3, left: "39%", top: "12%", rotate: 8, colorClass: "confetti-mint", kind: "streamer", delay: "-0.8s" },
  { id: 4, left: "44%", top: "20%", rotate: -35, colorClass: "confetti-gold", kind: "dot", delay: "-3.4s" },
  { id: 5, left: "49%", top: "16%", rotate: 26, colorClass: "confetti-coral", kind: "streamer", delay: "-1.9s" },
  { id: 6, left: "55%", top: "25%", rotate: -10, colorClass: "confetti-lilac", kind: "dot", delay: "-2.2s" },
  { id: 7, left: "59%", top: "13%", rotate: 30, colorClass: "confetti-mint", kind: "streamer", delay: "-1.1s" },
  { id: 8, left: "64%", top: "21%", rotate: -18, colorClass: "confetti-gold", kind: "dot", delay: "-2.6s" },
  { id: 9, left: "37%", top: "30%", rotate: 18, colorClass: "confetti-coral", kind: "dot", delay: "-3.1s" },
  { id: 10, left: "52%", top: "31%", rotate: -25, colorClass: "confetti-lilac", kind: "streamer", delay: "-1.6s" }
];

function Balloon({ className, color, delay, duration }: { className?: string; color: string; delay: string; duration: string }) {
  return (
    <div className={`hero-art-balloon ${className ?? ""}`} style={{ animationDelay: delay, animationDuration: duration }}>
      <svg viewBox="0 0 44 86" className="h-full w-full" aria-hidden>
        <path className="hero-art-balloon-body" d="M22 64c1.2 0 2.3-.5 3.2-1.3 7-6 11.3-15 11.3-25.1C36.5 20 30 8 22 8S7.5 20 7.5 37.6c0 10.2 4.2 19.1 11.3 25.1.9.8 2 1.3 3.2 1.3Z" fill={color} opacity="0.94" />
        <path className="hero-art-balloon-knot" d="M17 62h10l-5 7-5-7Z" fill={color} opacity="0.78" />
        <path className="hero-art-balloon-string" d="M22 69c1 6-4 7-1 13" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

export function LandingCelebrationScene({ variant = "default" }: { variant?: "default" | "sideblast" | "radialcut" }) {
  if (variant === "radialcut") {
    return (
      <div className="hero-radialcut-scene pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
        {/* Layer 2: orbs large deep blur (massa) */}
        <div className="hero-radialcut-orb hero-radialcut-orb-1" aria-hidden />
        <div className="hero-radialcut-orb hero-radialcut-orb-2" aria-hidden />
        <div className="hero-radialcut-orb hero-radialcut-orb-3" aria-hidden />
        {/* Layer 3: main shape >= 60vw, origin outside viewport (top-right) */}
        <div className="hero-radialcut-shape" aria-hidden />
        {/* Layer 4: diagonal ribbon crossing screen */}
        <div className="hero-radialcut-ribbon" aria-hidden />
        {/* Layer 5: large particles (4–8) */}
        <div className="hero-radialcut-particles" aria-hidden>
          {RADIALCUT_PARTICLES.map((p) => (
            <span
              key={p.id}
              className={`hero-radialcut-particle ${p.colorClass}`}
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                animationDelay: p.delay
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "sideblast") {
    return (
      <div className="hero-sideblast-blast pointer-events-none relative flex min-h-[260px] flex-1 items-center justify-end overflow-visible lg:min-h-[360px]" aria-hidden>
        <div className="hero-sideblast-glow" aria-hidden />
        <div className="hero-confetti-burst absolute inset-0 overflow-visible" aria-hidden>
          {[
            { id: 1, left: "12%", top: "22%", rotate: -22, colorClass: "confetti-coral", kind: "streamer" as const, invader: true },
            { id: 2, left: "38%", top: "32%", rotate: 14, colorClass: "confetti-lilac", kind: "dot" as const, invader: true },
            { id: 3, left: "28%", top: "38%", rotate: 8, colorClass: "confetti-mint", kind: "streamer" as const, invader: true },
            { id: 4, left: "52%", top: "18%", rotate: -35, colorClass: "confetti-gold", kind: "dot" as const, invader: false },
            { id: 5, left: "58%", top: "28%", rotate: 26, colorClass: "confetti-coral", kind: "streamer" as const, invader: false },
            { id: 6, left: "68%", top: "35%", rotate: -10, colorClass: "confetti-lilac", kind: "dot" as const, invader: false },
            { id: 7, left: "75%", top: "24%", rotate: 30, colorClass: "confetti-mint", kind: "streamer" as const, invader: false },
            { id: 8, left: "82%", top: "40%", rotate: -18, colorClass: "confetti-gold", kind: "dot" as const, invader: false }
          ].map((piece) => (
            <span
              key={piece.id}
              className={[
                "hero-confetti-piece",
                piece.kind === "dot" ? "hero-confetti-dot" : "hero-confetti-streamer",
                piece.colorClass,
                piece.invader ? "hero-sideblast-invader" : ""
              ].join(" ")}
              style={{ left: piece.left, top: piece.top, rotate: `${piece.rotate}deg` }}
            />
          ))}
        </div>
        <div className="hero-sideblast-illustration relative flex h-full w-full items-center justify-end lg:min-w-[35%] lg:pr-2">
          <img
            src="/illustrations/outdoor-party.svg"
            alt=""
            width={720}
            height={560}
            className="outdoor-party-illustration h-full max-h-[280px] w-full max-w-[320px] object-contain opacity-95 dark:opacity-90 lg:max-h-[340px] lg:max-w-[420px]"
            loading="lazy"
            decoding="async"
          />
        </div>
        <Balloon className="absolute right-[8%] top-[8%] h-[3rem] w-[1.5rem] opacity-70 lg:right-[12%] lg:top-[5%] lg:h-[3.5rem] lg:w-[1.75rem]" color="hsl(var(--primary) / 0.62)" delay="-2s" duration="14s" />
        <Balloon className="absolute right-[22%] top-[2%] h-[2.5rem] w-[1.25rem] opacity-65 lg:right-[28%] lg:top-[0%] lg:h-[3rem] lg:w-[1.5rem]" color="hsl(var(--lilac) / 0.58)" delay="-8s" duration="17s" />
      </div>
    );
  }

  return (
    <div className="hero-art-shell pointer-events-none relative isolate overflow-visible" aria-hidden>
      <div className="hero-art-backdrop" />
      <div className="hero-confetti-burst">
        {CONFETTI_PIECES.map((piece) => (
          <span
            key={piece.id}
            className={[
              "hero-confetti-piece",
              piece.kind === "dot" ? "hero-confetti-dot" : "hero-confetti-streamer",
              piece.colorClass
            ].join(" ")}
            style={{ left: piece.left, top: piece.top, rotate: `${piece.rotate}deg`, animationDelay: piece.delay }}
          />
        ))}
        <svg className="hero-confetti-ribbons" viewBox="0 0 320 150" aria-hidden>
          <path className="hero-confetti-ribbon ribbon-a" d="M58 44c-6 9-3 18 6 25" />
          <path className="hero-confetti-ribbon ribbon-b" d="M96 30c7 8 8 18 1 27" />
          <path className="hero-confetti-ribbon ribbon-c" d="M126 50c-8 7-10 16-5 24" />
          <path className="hero-confetti-ribbon ribbon-d" d="M166 28c8 8 10 17 4 27" />
          <path className="hero-confetti-ribbon ribbon-e" d="M206 48c-7 6-10 15-5 23" />
          <path className="hero-confetti-ribbon ribbon-f" d="M238 24c7 8 9 17 3 26" />
          <path className="hero-confetti-ribbon ribbon-g" d="M270 42c-6 8-5 17 3 24" />
        </svg>
      </div>

      {ORBS.map((orb) => (
        <div key={orb.id} className={orb.className} style={orb.style} />
      ))}

      <div className="hero-art-stage relative z-[20] mx-auto w-full max-w-[420px] md:max-w-[540px] md:-translate-y-1 lg:max-w-[740px] lg:-translate-x-2 lg:-translate-y-1 xl:max-w-[800px] xl:-translate-x-3 xl:-translate-y-2 2xl:max-w-[840px]">
        <img
          src="/illustrations/outdoor-party.svg"
          alt=""
          width={720}
          height={560}
          className="outdoor-party-illustration h-full w-full object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>

      <Balloon className="hidden lg:block absolute right-[6%] top-[2%] h-[4.5rem] w-[2.25rem] opacity-75" color="hsl(var(--primary) / 0.62)" delay="-2s" duration="14s" />
      <Balloon className="hidden lg:block absolute right-[21%] top-[0%] h-[3.5rem] w-[1.75rem] opacity-70" color="hsl(var(--lilac) / 0.58)" delay="-8s" duration="17s" />
    </div>
  );
}
