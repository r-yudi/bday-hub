"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { applyThemeToDocument } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import { FieldGroup, FieldLabel, TextInput } from "@/components/ui/Field";

const COPY = {
  headline: "Quem se importa, aparece.",
  sub: "O Lembra te encontra no dia. Você só celebra.",
  cta: "Me avisar no dia",
  link: "Já tenho conta"
};

const PARTICLE_LIGHT = Array.from({ length: 20 }, (_, i) => ({
  left: `${5 + ((i * 47 + 13) % 90)}%`,
  top: `${5 + ((i * 31 + 7) % 85)}%`,
  size: 2 + (i % 3),
  opacity: 0.08 + (i % 5) * 0.014,
  duration: 16 + (i % 7) * 1.7,
  delay: (i % 4) * 2
}));

const PARTICLE_DARK = [
  { left: "68%", top: "38%", size: 18, opacity: 0.10 },
  { left: "78%", top: "55%", size: 14, opacity: 0.08 }
];

const SPARK_DATA = [
  { x: "23%", y: "58%", d: "200ms", s: "4px" },
  { x: "26%", y: "56%", d: "160ms", s: "5px" },
  { x: "20%", y: "60%", d: "300ms", s: "3px" },
  { x: "28%", y: "59%", d: "120ms", s: "3px" },
  { x: "25%", y: "55%", d: "260ms", s: "4px" },
  { x: "18%", y: "57%", d: "340ms", s: "2px" },
  { x: "27%", y: "62%", d: "180ms", s: "4px" },
  { x: "21%", y: "63%", d: "380ms", s: "3px" },
  { x: "24%", y: "61%", d: "140ms", s: "2px" },
  { x: "16%", y: "59%", d: "420ms", s: "3px" }
];

type ModalStep = "closed" | "form" | "success";

const EMPTY_FORM = {
  title: "",
  date: "",
  channel: "email" as "email" | "whatsapp",
  email: ""
};

function validEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function HeroLabCampaign() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [step, setStep] = useState<ModalStep>("closed");
  const [form, setForm] = useState(EMPTY_FORM);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTheme = params.get("theme");
    if (urlTheme === "light" || urlTheme === "dark") {
      localStorage.setItem("themeOverride", urlTheme);
      applyThemeToDocument(urlTheme);
    } else {
      const stored = localStorage.getItem("themeOverride");
      if (stored === "light" || stored === "dark") {
        applyThemeToDocument(stored);
      }
    }

    const sync = () =>
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    });
    return () => observer.disconnect();
  }, []);

  const isLight = theme === "light";

  const isValid =
    form.date !== "" &&
    (form.channel !== "email" ||
      (form.email !== "" && validEmail(form.email)));

  const closeModal = useCallback(() => {
    setStep("closed");
    setForm(EMPTY_FORM);
  }, []);

  useEffect(() => {
    if (step !== "closed") {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() =>
        modalRef.current?.querySelector<HTMLElement>("input")?.focus()
      );
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [step]);

  useEffect(() => {
    if (step === "closed") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const els = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [step, closeModal]);

  const toggleTheme = useCallback(() => {
    const next = theme === "light" ? "dark" : "light";
    localStorage.setItem("themeOverride", next);
    applyThemeToDocument(next);
  }, [theme]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <>
      <div
        className={`hero-exp-wrap hero-exp-${theme} relative min-h-screen w-full overflow-x-clip`}
        style={{ minHeight: "100vh" }}
      >
        <div className="hero-exp-zone-a absolute inset-0 z-0" aria-hidden />
        <div className="hero-exp-zone-b absolute inset-0 z-0" aria-hidden />
        <div className="hero-exp-mass absolute z-[2]" aria-hidden />
        <div className="hero-exp-ribbon absolute" aria-hidden />

        {isLight && (
          <>
            <div className="hero-exp-burst" aria-hidden />
            <div className="hero-exp-wow" aria-hidden>
              {SPARK_DATA.map((s, i) => (
                <span
                  key={i}
                  style={{
                    ["--x" as string]: s.x,
                    ["--y" as string]: s.y,
                    ["--d" as string]: s.d,
                    ["--s" as string]: s.s
                  }}
                />
              ))}
            </div>
          </>
        )}

        <div className="hero-exp-particles absolute inset-0 z-[4]" aria-hidden>
          {isLight
            ? PARTICLE_LIGHT.map((p, i) => (
                <span
                  key={i}
                  className="hero-exp-particle hero-exp-particle--float absolute"
                  style={{
                    left: p.left,
                    top: p.top,
                    width: p.size,
                    height: p.size,
                    opacity: p.opacity,
                    ["--pf-dur" as string]: `${p.duration}s`,
                    ["--pf-delay" as string]: `${p.delay}s`
                  }}
                />
              ))
            : PARTICLE_DARK.map((p, i) => (
                <span
                  key={i}
                  className="hero-exp-particle absolute"
                  style={{
                    left: p.left,
                    top: p.top,
                    width: p.size,
                    height: p.size,
                    opacity: p.opacity
                  }}
                />
              ))}
        </div>

        <div
          className="hero-exp-spotlight absolute inset-0 z-[5] pointer-events-none"
          aria-hidden
        />

        <div className="hero-exp-copy absolute left-[9%] top-[40%] z-10 max-w-[42rem]">
          <h1 className="hero-exp-headline text-balance font-extrabold leading-[0.92] tracking-tight">
            {COPY.headline}
          </h1>
          <p className="hero-exp-sub mt-3 text-lg font-medium opacity-90">
            {COPY.sub}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => {
                setForm(EMPTY_FORM);
                setStep("form");
              }}
              className="hero-exp-cta inline-flex min-w-[12rem] items-center justify-center rounded-md px-6 py-3.5 text-center font-semibold text-white focus-visible:outline focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              {COPY.cta}
            </button>
            <Link
              href="/login?returnTo=%2Ftoday"
              className="hero-exp-link text-sm font-medium focus-visible:outline focus-visible:ring-2 focus-visible:ring-offset-2 rounded px-2 py-1"
            >
              {COPY.link}
            </Link>
          </div>
        </div>
      </div>

      {step !== "closed" && (
        <div
          className="hero-exp-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            ref={modalRef}
            className="hero-exp-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label={
              step === "form" ? "Criar lembrete" : "Lembrete criado"
            }
          >
            {step === "form" ? (
              <>
                <h2 className="text-lg font-semibold tracking-tight text-text">
                  Criar lembrete
                </h2>

                <div className="mt-4 space-y-4">
                  <FieldGroup>
                    <FieldLabel htmlFor="r-title">Evento</FieldLabel>
                    <TextInput
                      id="r-title"
                      placeholder="Aniversário da Ana"
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <FieldLabel htmlFor="r-date">Data *</FieldLabel>
                    <TextInput
                      id="r-date"
                      type="date"
                      required
                      value={form.date}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, date: e.target.value }))
                      }
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <FieldLabel>Avisar por</FieldLabel>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, channel: "email" }))
                        }
                        className={`hero-exp-channel-btn${form.channel === "email" ? " hero-exp-channel-btn--active" : ""}`}
                      >
                        Email
                      </button>
                      <button
                        type="button"
                        disabled
                        className="hero-exp-channel-btn"
                        title="Em breve"
                      >
                        WhatsApp · em breve
                      </button>
                    </div>
                  </FieldGroup>

                  {form.channel === "email" && (
                    <FieldGroup>
                      <FieldLabel htmlFor="r-email">Email *</FieldLabel>
                      <TextInput
                        id="r-email"
                        type="email"
                        placeholder="voce@email.com"
                        required
                        value={form.email}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, email: e.target.value }))
                        }
                      />
                    </FieldGroup>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="ghost" size="md" onClick={closeModal}>
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    disabled={!isValid}
                    onClick={() => setStep("success")}
                  >
                    Confirmar
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-4 text-center">
                <svg
                  className="h-12 w-12 text-success"
                  viewBox="0 0 48 48"
                  fill="none"
                  aria-hidden
                >
                  <circle
                    cx="24"
                    cy="24"
                    r="22"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    opacity="0.15"
                  />
                  <path
                    d="M15 25l6 6 12-14"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h2 className="mt-4 text-xl font-semibold tracking-tight text-text">
                  Pronto.
                </h2>
                <p className="mt-2 text-sm text-muted">
                  A gente te encontra no dia.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  className="mt-6"
                  onClick={closeModal}
                >
                  Fechar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {isDev && (
        <button
          type="button"
          onClick={toggleTheme}
          className="hero-exp-dev-toggle"
          title="Toggle theme (dev only)"
        >
          {theme === "light" ? "☀ Light" : "🌙 Dark"}
        </button>
      )}
    </>
  );
}
