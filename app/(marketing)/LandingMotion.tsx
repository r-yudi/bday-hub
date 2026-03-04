"use client";

import { useEffect, useRef } from "react";

export function LandingMotion({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    const observeFadeEls = container.querySelectorAll(".observe-fade");
    observeFadeEls.forEach((el) => observer.observe(el));

    const cards = container.querySelectorAll(".cards-grid .feature-card");
    cards.forEach((card, i) => {
      (card as HTMLElement).style.transitionDelay = `${i * 0.08}s`;
    });

    return () => {
      observeFadeEls.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
