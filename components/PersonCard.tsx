"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { encodeShareToken } from "@/lib/share";
import { formatDayMonth, formatRelativeLabel } from "@/lib/dates";
import { normalizeNfc } from "@/lib/text";
import type { BirthdayPerson } from "@/lib/types";
import { Templates, getMessageTemplates } from "@/components/Templates";
import { dedupeCategoryNames } from "@/lib/categories";

type PersonCardProps = {
  person: BirthdayPerson;
  relativeDays?: number;
  onDelete?: (id: string) => Promise<void> | void;
};

export function PersonCard({ person, relativeDays, onDelete }: PersonCardProps) {
  const [messageCopied, setMessageCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const links = person.links ?? {};
  const categories = useMemo(
    () => dedupeCategoryNames([...(person.categories ?? []), ...(person.tags ?? []), person.category]),
    [person.categories, person.tags, person.category]
  );

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
    const primaryMessage = getMessageTemplates(person)[0];
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
    <article className="rounded-2xl border border-border/70 bg-surface/75 p-4 shadow-sm dark:bg-surface/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight">{normalizeNfc(person.name)}</h3>
            {links.instagram && (
              <a
                href={links.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label={`Abrir Instagram de ${person.name}`}
                title="Abrir Instagram"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/10 text-xs text-black/70 hover:bg-black/5 dark:border-white/15 dark:text-white/75 dark:hover:bg-white/10"
              >
                IG
              </a>
            )}
          </div>

          <p className="mt-0.5 text-sm text-black/70 dark:text-white/70">
            {formatDayMonth(person.day, person.month)}
            {typeof relativeDays === "number" ? ` • ${formatRelativeLabel(relativeDays)}` : ""}
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
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void copyPrimaryMessage()}
          className="btn-primary-brand ui-cta-primary rounded-xl bg-accent px-3 py-2 text-sm text-white hover:bg-accentHover focus-visible:outline-none"
        >
          Copiar mensagem
        </button>

        <button
          type="button"
          onClick={() => void copyShareLink()}
          className="ui-cta-secondary rounded-xl border px-3 py-2 text-sm focus-visible:outline-none"
        >
          Copiar link
        </button>

        <Link href={`/person?id=${person.id}`} className="ui-focus-surface inline-flex items-center rounded-xl border px-3 py-2 text-sm focus-visible:outline-none">
          Editar
        </Link>

        {onDelete && (
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="rounded-xl border border-rose-200/80 bg-white/90 px-3 py-2 text-sm text-rose-700 shadow-sm hover:-translate-y-px hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200 dark:border-rose-300/30 dark:bg-white/10 dark:text-rose-200 dark:hover:bg-rose-500/10"
          >
            Excluir
          </button>
        )}
      </div>

      <div className="mt-2 min-h-5 text-xs">
        {messageCopied && <span className="text-emerald-700">Mensagem copiada ✓</span>}
        {!messageCopied && linkCopied && <span className="text-emerald-700">Link copiado ✓</span>}
      </div>

      {(links.whatsapp || links.other) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {links.whatsapp && (
            <a
              href={links.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="ui-focus-surface inline-flex items-center rounded-lg border px-3 py-1.5 text-sm focus-visible:outline-none"
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

      {person.notes && <p className="mt-3 text-sm text-black/70 dark:text-white/70">{normalizeNfc(person.notes)}</p>}

      <div className="mt-4">
        <Templates person={person} />
      </div>
    </article>
  );
}
