"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";

type Orb = {
  id: number;
  className: string;
  style: CSSProperties;
};

// Debug visual temporário para calibrar bounding boxes/camadas da cena da landing.
const DEBUG_LANDING_SCENE = false;

// Ajuste aqui a quantidade/posição/intensidade dos glows (máx. 10 desktop; mobile <=4 visíveis).
const ORBS: Orb[] = [
  { id: 1, className: "glow-orb", style: { left: "58%", top: "10%", width: 30, height: 30, background: "hsl(var(--lilac) / 0.10)", animationDelay: "0s", animationDuration: "32s" } },
  { id: 2, className: "glow-orb", style: { left: "66%", top: "18%", width: 22, height: 22, background: "hsl(var(--primary) / 0.09)", animationDelay: "-5s", animationDuration: "28s" } },
  { id: 3, className: "glow-orb hidden md:block", style: { left: "82%", top: "14%", width: 26, height: 26, background: "hsl(var(--accent) / 0.08)", animationDelay: "-8s", animationDuration: "36s" } },
  { id: 4, className: "glow-orb hidden sm:block", style: { left: "76%", top: "34%", width: 18, height: 18, background: "hsl(var(--warning) / 0.06)", animationDelay: "-12s", animationDuration: "30s" } },
  { id: 5, className: "glow-orb hidden lg:block", style: { left: "90%", top: "28%", width: 44, height: 44, background: "hsl(var(--lilac) / 0.07)", animationDelay: "-4s", animationDuration: "38s" } },
  { id: 6, className: "glow-orb hidden md:block", style: { left: "70%", top: "54%", width: 26, height: 26, background: "hsl(var(--primary) / 0.08)", animationDelay: "-16s", animationDuration: "34s" } },
  { id: 7, className: "glow-orb hidden lg:block", style: { left: "62%", top: "62%", width: 22, height: 22, background: "hsl(var(--accent) / 0.06)", animationDelay: "-10s", animationDuration: "40s" } },
  { id: 8, className: "glow-orb hidden xl:block", style: { left: "86%", top: "58%", width: 24, height: 24, background: "hsl(var(--warning) / 0.06)", animationDelay: "-20s", animationDuration: "28s" } },
  // Bokeh extra premium (dark mais perceptível, light bem sutil)
  { id: 9, className: "glow-orb glow-orb-bokeh hidden lg:block", style: { left: "74%", top: "8%", width: 110, height: 110, background: "hsl(var(--lilac) / 0.04)", animationDelay: "-6s", animationDuration: "44s" } },
  { id: 10, className: "glow-orb glow-orb-bokeh hidden lg:block", style: { left: "88%", top: "42%", width: 96, height: 96, background: "hsl(var(--primary) / 0.04)", animationDelay: "-14s", animationDuration: "48s" } }
];

function OutdoorPartyIllustration() {
  return (
    <img
      src="/illustrations/outdoor-party.svg"
      alt=""
      width={680}
      height={520}
      className={`outdoor-party-illustration h-full w-full object-contain ${DEBUG_LANDING_SCENE ? "opacity-100" : ""}`}
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
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.85">
          <path d="M32 8v9" />
          <path d="M32 47v9" />
          <path d="M8 32h9" />
          <path d="M47 32h9" />
          <path d="M14 14l6 6" />
          <path d="M44 44l6 6" />
          <path d="M50 14l-6 6" />
          <path d="M20 44l-6 6" />
        </g>
        <circle cx="32" cy="32" r="2.4" fill="currentColor" opacity="0.85" />
      </svg>
    </div>
  );
}

export function LandingCelebrationScene() {
  const [showBursts, setShowBursts] = useState(false);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const parallaxEnabledRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 1024px)");

    const syncFlags = () => {
      parallaxEnabledRef.current = !reduceMotion.matches && desktop.matches;
      if (!parallaxEnabledRef.current && sceneRef.current) {
        sceneRef.current.style.setProperty("--landing-parallax-x", "0px");
        sceneRef.current.style.setProperty("--landing-parallax-y", "0px");
      }
    };

    syncFlags();
    reduceMotion.addEventListener?.("change", syncFlags);
    desktop.addEventListener?.("change", syncFlags);

    // Ajuste aqui o timing dos spark bursts (1x por sessão + duração/atrasos abaixo).
    const key = "lembra_landing_celebration_bursts_seen";
    if (!reduceMotion.matches && !window.matchMedia("(max-width: 767px)").matches && !window.sessionStorage.getItem(key)) {
      window.sessionStorage.setItem(key, "1");
      setShowBursts(true);
      const timer = window.setTimeout(() => setShowBursts(false), 900);
      const cleanupBurst = () => window.clearTimeout(timer);

      const onPointerMove = (event: PointerEvent) => {
        if (!parallaxEnabledRef.current || !sceneRef.current) return;
        const rect = sceneRef.current.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width - 0.5;
        const ny = (event.clientY - rect.top) / rect.height - 0.5;
        targetRef.current.x = Math.max(-1, Math.min(1, nx));
        targetRef.current.y = Math.max(-1, Math.min(1, ny));
        if (rafRef.current != null) return;
        rafRef.current = window.requestAnimationFrame(() => {
          rafRef.current = null;
          if (!sceneRef.current) return;
          // Ajuste aqui a intensidade do parallax (2-6px recomendado).
          sceneRef.current.style.setProperty("--landing-parallax-x", `${targetRef.current.x * 4}px`);
          sceneRef.current.style.setProperty("--landing-parallax-y", `${targetRef.current.y * 3}px`);
        });
      };

      const onPointerLeave = () => {
        targetRef.current.x = 0;
        targetRef.current.y = 0;
        if (rafRef.current != null) return;
        rafRef.current = window.requestAnimationFrame(() => {
          rafRef.current = null;
          if (!sceneRef.current) return;
          sceneRef.current.style.setProperty("--landing-parallax-x", "0px");
          sceneRef.current.style.setProperty("--landing-parallax-y", "0px");
        });
      };

      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerleave", onPointerLeave);

      return () => {
        cleanupBurst();
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerleave", onPointerLeave);
        if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
        reduceMotion.removeEventListener?.("change", syncFlags);
        desktop.removeEventListener?.("change", syncFlags);
      };
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!parallaxEnabledRef.current || !sceneRef.current) return;
      const rect = sceneRef.current.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      targetRef.current.x = Math.max(-1, Math.min(1, nx));
      targetRef.current.y = Math.max(-1, Math.min(1, ny));
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        if (!sceneRef.current) return;
        sceneRef.current.style.setProperty("--landing-parallax-x", `${targetRef.current.x * 4}px`);
        sceneRef.current.style.setProperty("--landing-parallax-y", `${targetRef.current.y * 3}px`);
      });
    };
    const onPointerLeave = () => {
      targetRef.current.x = 0;
      targetRef.current.y = 0;
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        if (!sceneRef.current) return;
        sceneRef.current.style.setProperty("--landing-parallax-x", "0px");
        sceneRef.current.style.setProperty("--landing-parallax-y", "0px");
      });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      reduceMotion.removeEventListener?.("change", syncFlags);
      desktop.removeEventListener?.("change", syncFlags);
    };
  }, []);

  return (
    <div
      ref={sceneRef}
      className={`celebration-scene pointer-events-none absolute inset-0 overflow-visible ${DEBUG_LANDING_SCENE ? "z-[20]" : "z-[20]"}`}
      aria-hidden
    >
      {/* Mantém a cena fora da área do headline/CTA: cluster concentrado na metade direita. */}
      <div className="celebration-parallax-layer celebration-parallax-soft absolute inset-0 z-[10]">
        {ORBS.map((orb) => (
          <div key={orb.id} className={orb.className} style={orb.style} />
        ))}
      </div>

      <div className="celebration-parallax-layer celebration-parallax-strong absolute inset-0 z-[20]">
        {/* Ajuste aqui tamanho/posição da ilustração para “abraçar” melhor o mock card. */}
        <div className={`outdoor-party-wrap absolute right-[-8%] top-[4%] hidden h-[420px] w-[420px] md:block lg:right-[-4%] lg:top-[-4%] lg:h-[580px] lg:w-[580px] xl:right-[0%] xl:top-[-6%] xl:h-[680px] xl:w-[680px] ${DEBUG_LANDING_SCENE ? "outline outline-2 outline-fuchsia-400" : ""}`}>
          <div className="absolute inset-[7%] rounded-full bg-primary/8 blur-3xl dark:bg-primary/14" />
          <div className="absolute left-[14%] top-[18%] h-24 w-24 rounded-full bg-lilac/8 blur-2xl dark:bg-lilac/12" />
          <div className={`absolute inset-0 ${DEBUG_LANDING_SCENE ? "" : "outdoor-party-fade"}`}>
            <OutdoorPartyIllustration />
          </div>
          {/* Overlay para integrar ilustração com o card (fade orgânico próximo ao mock card). */}
          {!DEBUG_LANDING_SCENE && <div className="outdoor-party-card-blend absolute inset-0" />}
        </div>
      </div>

      <div className="celebration-parallax-layer celebration-parallax-soft absolute inset-0 z-[25]">
        {/* Ajuste aqui composição dos balões (triângulo visual sem cobrir texto/CTA). */}
        <Balloon className="absolute right-[4%] top-[3%] h-14 w-7 sm:h-18 sm:w-9 lg:right-[9%] lg:top-[1%] lg:h-20 lg:w-10" color="hsl(var(--primary) / 0.68)" delay="-2s" duration="13s" />
        <Balloon className="absolute right-[19%] top-[2%] hidden h-18 w-9 sm:block lg:right-[22%] lg:h-22 lg:w-11" color="hsl(var(--lilac) / 0.64)" delay="-7s" duration="16s" />
        <Balloon className="absolute right-[4%] top-[24%] hidden h-12 w-7 md:block lg:right-[7%]" color="hsl(var(--accent) / 0.62)" delay="-11s" duration="12s" />
        <Balloon className="absolute right-[28%] top-[18%] hidden h-12 w-7 lg:block" color="hsl(var(--warning) / 0.52)" delay="-4s" duration="18s" />
      </div>

      {showBursts && (
        <div className="celebration-parallax-layer celebration-parallax-soft absolute inset-0 hidden md:block">
          <SparkBurst className="absolute right-[18%] top-[14%] h-9 w-9 text-primary/60 dark:text-primary/76" delay="80ms" />
          <SparkBurst className="absolute right-[8%] top-[29%] h-7 w-7 text-lilac/45 dark:text-lilac/64" delay="220ms" />
          <SparkBurst className="absolute right-[30%] top-[30%] h-8 w-8 text-accent/40 dark:text-accent/56" delay="360ms" />
        </div>
      )}
    </div>
  );
}
