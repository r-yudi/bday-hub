"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { emojiForPersonId } from "@/lib/personListEmoji";
import type { OnboardingToast } from "@/lib/onboarding-ui";
import { getTodaySuggestedMessage } from "@/lib/suggestedBirthdayMessage";
import { normalizeNfc } from "@/lib/text";
import type { BirthdayPerson } from "@/lib/types";

function isSafeHttpUrl(raw: string | undefined): boolean {
  const t = raw?.trim();
  if (!t) return false;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

type TodayListItemProps = {
  person: BirthdayPerson;
  onToast?: (toast: OnboardingToast) => void;
};

export function TodayListItem({ person, onToast }: TodayListItemProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const congratsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const sheetWasOpenRef = useRef(false);

  const whatsappRaw = person.links?.whatsapp?.trim();
  const instagramRaw = person.links?.instagram?.trim();
  const hasWhatsapp = Boolean(whatsappRaw);
  const hasInstagram = Boolean(instagramRaw);
  const whatsappOk = hasWhatsapp && isSafeHttpUrl(whatsappRaw);
  const instagramOk = hasInstagram && isSafeHttpUrl(instagramRaw);

  const displayName = useMemo(() => normalizeNfc(person.name), [person.name]);
  const emoji = useMemo(() => emojiForPersonId(person.id), [person.id]);
  const suggestedMessage = useMemo(
    () => getTodaySuggestedMessage({ id: person.id, name: person.name, nickname: person.nickname }),
    [person.id, person.name, person.nickname]
  );

  const personEditHref = `/person?id=${encodeURIComponent(person.id)}&returnTo=${encodeURIComponent("/today")}`;
  const congratsSheetId = `dar-parabens-sheet-${person.id}`;

  const copyMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(suggestedMessage);
      onToast?.({ title: "Mensagem copiada", tone: "success" });
    } catch {
      onToast?.({ title: "Não deu para copiar", tone: "info" });
    }
  }, [onToast, suggestedMessage]);

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  useEffect(() => {
    if (sheetWasOpenRef.current && !sheetOpen) {
      congratsTriggerRef.current?.focus({ preventScroll: true });
    }
    sheetWasOpenRef.current = sheetOpen;
  }, [sheetOpen]);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen, closeSheet]);

  useEffect(() => {
    if (!sheetOpen) return;
    const t = window.setTimeout(() => {
      sheetRef.current?.querySelector<HTMLElement>("button, a")?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(t);
  }, [sheetOpen]);

  return (
    <>
      <li className="mt-3 list-none first:mt-0">
        <article className="ui-panel-soft rounded-xl border p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <div
              className="ui-panel-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-base"
              aria-hidden
            >
              {emoji}
            </div>
            <div className="min-w-0 flex-1 pr-1">
              <h3 className="text-base font-semibold leading-snug tracking-tight text-text">
                <Link
                  href={personEditHref}
                  className="ui-link-tertiary ui-focus-surface break-words rounded-sm font-semibold text-text decoration-transparent hover:decoration-inherit focus-visible:outline-none"
                >
                  {displayName}
                </Link>
              </h3>
              <p className="mt-0.5 text-sm text-muted">faz aniversário hoje</p>
              <Link
                href={personEditHref}
                className="ui-link-tertiary ui-focus-surface mt-1 inline-block text-sm font-medium focus-visible:outline-none"
              >
                Editar
              </Link>
            </div>
            <button
              ref={congratsTriggerRef}
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
              aria-controls={sheetOpen ? congratsSheetId : undefined}
              className="ui-cta-primary ui-focus-surface mt-0.5 h-10 shrink-0 whitespace-nowrap rounded-xl px-3 text-sm font-medium focus-visible:outline-none sm:px-4"
            >
              Dar parabéns
            </button>
          </div>

          <div className="mt-3 border-t border-border/20 pt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Mensagem sugerida</p>
            <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-text">{suggestedMessage}</p>
          </div>
        </article>
      </li>

      {sheetOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-4"
          role="presentation"
        >
          <button
            type="button"
            tabIndex={-1}
            className="ui-overlay-backdrop absolute inset-0 z-0 cursor-default border-0 p-0"
            aria-label="Fechar"
            onClick={closeSheet}
          />
          <div
            ref={sheetRef}
            id={congratsSheetId}
            role="dialog"
            aria-modal="true"
            aria-labelledby="congrats-sheet-title"
            className="ui-modal-surface relative z-[1] max-h-[min(88dvh,640px)] w-full overflow-y-auto rounded-t-2xl border p-5 shadow-lg sm:max-w-md sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-border/80 sm:hidden" aria-hidden />

            <h2 id="congrats-sheet-title" className="text-lg font-semibold tracking-tight text-text">
              Dar parabéns
            </h2>
            <p className="mt-1 text-sm text-muted">
              Escolha como você quer falar com {displayName}.
            </p>

            <div className="ui-panel-soft mt-4 rounded-xl border px-3 py-2.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Mensagem sugerida</p>
              <p className="mt-1 line-clamp-4 text-sm leading-relaxed text-text">{suggestedMessage}</p>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => void copyMessage()}
                className="ui-cta-secondary ui-focus-surface inline-flex h-11 w-full items-center justify-center rounded-xl border px-4 text-sm font-medium focus-visible:outline-none"
              >
                Copiar mensagem
              </button>

              {whatsappOk ? (
                <a
                  href={whatsappRaw}
                  target="_blank"
                  rel="noreferrer"
                  onClick={closeSheet}
                  className="ui-cta-secondary ui-focus-surface inline-flex h-11 w-full items-center justify-center rounded-xl border px-4 text-sm font-medium focus-visible:outline-none"
                >
                  Abrir WhatsApp
                </a>
              ) : (
                <div className="rounded-xl border border-border/35 bg-surface2/20 px-3 py-2.5">
                  <button
                    type="button"
                    disabled
                    className="w-full cursor-not-allowed text-left text-sm font-medium text-muted opacity-80"
                  >
                    Abrir WhatsApp
                  </button>
                  <p className="mt-1 text-xs text-muted">
                    {hasWhatsapp ? "Esse link do WhatsApp não está pronto para abrir." : "WhatsApp não adicionado"}
                  </p>
                </div>
              )}

              {instagramOk ? (
                <a
                  href={instagramRaw}
                  target="_blank"
                  rel="noreferrer"
                  onClick={closeSheet}
                  className="ui-cta-secondary ui-focus-surface inline-flex h-11 w-full items-center justify-center rounded-xl border px-4 text-sm font-medium focus-visible:outline-none"
                >
                  Abrir Instagram
                </a>
              ) : (
                <div className="rounded-xl border border-border/35 bg-surface2/20 px-3 py-2.5">
                  <button
                    type="button"
                    disabled
                    className="w-full cursor-not-allowed text-left text-sm font-medium text-muted opacity-80"
                  >
                    Abrir Instagram
                  </button>
                  <p className="mt-1 text-xs text-muted">
                    {hasInstagram ? "Esse link do Instagram não está pronto para abrir." : "Instagram não adicionado"}
                  </p>
                </div>
              )}
            </div>

            <p className="mt-4 text-center text-xs leading-relaxed text-muted">
              Você pode copiar a mensagem e mandar onde preferir.
            </p>

            <div className="mt-5 flex flex-col gap-2 border-t border-border/25 pt-4">
              <Link
                href={personEditHref}
                onClick={closeSheet}
                className="ui-link-tertiary text-center text-sm"
              >
                Editar canais dessa pessoa
              </Link>
              <button
                type="button"
                onClick={closeSheet}
                className="ui-cta-secondary ui-focus-surface h-10 w-full rounded-xl border text-sm font-medium focus-visible:outline-none"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
