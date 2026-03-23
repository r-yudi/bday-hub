"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { encodeShareToken } from "@/lib/share";
import { emojiForPersonId } from "@/lib/personListEmoji";
import { formatDayMonth, formatRelativeLabel } from "@/lib/dates";
import { normalizeNfc } from "@/lib/text";
import type { BirthdayPerson } from "@/lib/types";
import { Templates, getMessageTemplates } from "@/components/Templates";
import { dedupeCategoryNames } from "@/lib/categories";
import { getTodaySuggestedMessage } from "@/lib/suggestedBirthdayMessage";

const NICKNAME_HINT =
  "Quer uma saudação mais natural na mensagem? Preencha Como chamar ao editar a pessoa.";

type UpcomingListItemProps = {
  person: BirthdayPerson;
  relativeDays: number;
  onDelete?: (id: string) => Promise<void> | void;
};

export function UpcomingListItem({ person, relativeDays, onDelete }: UpcomingListItemProps) {
  const [messageCopied, setMessageCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const links = person.links ?? {};
  const isBirthdayToday = relativeDays === 0;
  const suggestedTodayMessage = useMemo(
    () => (isBirthdayToday ? getTodaySuggestedMessage({ id: person.id, name: person.name, nickname: person.nickname }) : ""),
    [isBirthdayToday, person.id, person.name, person.nickname]
  );
  const categories = useMemo(
    () => dedupeCategoryNames([...(person.categories ?? []), ...(person.tags ?? []), person.category]),
    [person.categories, person.tags, person.category]
  );
  const displayName = useMemo(() => normalizeNfc(person.name), [person.name]);
  const emoji = useMemo(() => emojiForPersonId(person.id), [person.id]);

  function getShareUrl() {
    const token = encodeShareToken({
      name: normalizeNfc(person.name),
      day: person.day,
      month: person.month,
      issuedAt: Date.now()
    });
    return `${window.location.origin}/share/${token}`;
  }

  async function copyPrimaryMessage() {
    const primaryMessage = isBirthdayToday
      ? getTodaySuggestedMessage({ id: person.id, name: person.name, nickname: person.nickname })
      : getMessageTemplates(person)[0];
    try {
      await navigator.clipboard.writeText(primaryMessage);
      setMessageCopied(true);
      window.setTimeout(() => setMessageCopied(false), 1400);
    } catch {
      window.alert("Não foi possível copiar a mensagem.");
    }
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1400);
    } catch {
      window.alert("Não foi possível copiar o link.");
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    const confirmed = window.confirm(`Remover ${person.name} da sua lista?`);
    if (!confirmed) return;
    await onDelete(person.id);
  }

  return (
    <li className="ui-list-item">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <div
          className="ui-panel-soft flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-lg"
          aria-hidden
        >
          {emoji}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold tracking-tight text-text">
                <Link
                  href={`/person?id=${encodeURIComponent(person.id)}`}
                  className="ui-link-tertiary ui-focus-surface rounded-sm font-semibold text-text decoration-transparent hover:decoration-inherit focus-visible:outline-none"
                >
                  {displayName}
                </Link>
              </h3>
              {links.instagram && (
                <a
                  href={links.instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Abrir Instagram de ${person.name}`}
                  title="Abrir Instagram"
                  className="ui-focus-surface inline-flex h-7 w-7 items-center justify-center rounded-full border p-0 text-xs focus-visible:outline-none"
                >
                  IG
                </a>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted">
              {formatDayMonth(person.day, person.month)} · {formatRelativeLabel(relativeDays)}
            </p>
            {categories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {categories.map((category) => (
                  <span key={category} className="ui-chip inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs">
                    {normalizeNfc(category)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {isBirthdayToday && (
            <div className="space-y-2">
              <p className="ui-feature-title text-text">Mensagem sugerida</p>
              <button
                type="button"
                onClick={() => void copyPrimaryMessage()}
                className="ui-focus-surface w-full rounded-xl border border-border bg-surface/80 px-3 py-2 text-left text-sm text-text transition-colors hover:border-primary/35 hover:bg-surface2/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                aria-label={`Copiar mensagem: ${suggestedTodayMessage}`}
              >
                <span aria-live="polite">{suggestedTodayMessage}</span>
              </button>
              <p className="text-xs text-muted">Clique ou toque na mensagem para copiar.</p>
              {!person.nickname?.trim() && <p className="text-xs text-muted">{NICKNAME_HINT}</p>}
              {person.notes?.trim() && (
                <p className="text-xs text-muted">
                  <span className="font-medium text-text/80">Sobre essa pessoa: </span>
                  {normalizeNfc(person.notes)}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void copyPrimaryMessage()}
              className="ui-cta-primary ui-focus-surface inline-flex h-9 items-center justify-center rounded-xl px-3 text-sm font-medium focus-visible:outline-none"
              aria-label={isBirthdayToday ? "Copiar mensagem sugerida" : "Copiar mensagem"}
            >
              {isBirthdayToday ? "Copiar" : "Copiar mensagem"}
            </button>
            <button
              type="button"
              onClick={() => void copyShareLink()}
              className="ui-cta-secondary ui-focus-surface inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-medium focus-visible:outline-none"
            >
              Copiar link
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                className="ui-focus-surface inline-flex h-9 items-center justify-center rounded-xl border border-danger/35 bg-danger/10 px-3 text-sm font-medium text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
              >
                Excluir
              </button>
            )}
          </div>

          <div className="min-h-4 text-xs">
            {messageCopied && <span className="text-success">Mensagem copiada ✓</span>}
            {!messageCopied && linkCopied && <span className="text-success">Link copiado ✓</span>}
          </div>

          {(links.whatsapp || links.other) && (
            <div className="flex flex-wrap gap-2">
              {links.whatsapp && (
                <a
                  href={links.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="ui-cta-secondary ui-focus-surface inline-flex items-center rounded-lg border px-3 py-1.5 text-sm focus-visible:outline-none"
                >
                  Abrir WhatsApp
                </a>
              )}
              {links.other && (
                <a
                  href={links.other}
                  target="_blank"
                  rel="noreferrer"
                  className="ui-focus-surface inline-flex items-center rounded-lg border px-3 py-1.5 text-sm focus-visible:outline-none"
                >
                  Abrir link
                </a>
              )}
            </div>
          )}

          {person.notes?.trim() && !isBirthdayToday && <p className="text-sm text-muted">{normalizeNfc(person.notes)}</p>}

          <div className="border-t border-border/40 pt-3">
            <Templates person={person} />
          </div>
        </div>
      </div>
    </li>
  );
}
