"use client";

import Link from "next/link";
import { useState } from "react";
import { encodeShareToken } from "@/lib/share";
import { formatDayMonth, formatRelativeLabel } from "@/lib/dates";
import type { BirthdayPerson } from "@/lib/types";
import { Templates, getMessageTemplates } from "@/components/Templates";

type PersonCardProps = {
  person: BirthdayPerson;
  relativeDays?: number;
  onDelete?: (id: string) => Promise<void> | void;
};

export function PersonCard({ person, relativeDays, onDelete }: PersonCardProps) {
  const [messageCopied, setMessageCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const links = person.links ?? {};

  function getShareUrl() {
    const token = encodeShareToken({
      name: person.name,
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
      window.alert("NÃ£o foi possÃ­vel copiar a mensagem.");
    }
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1400);
    } catch {
      window.alert("NÃ£o foi possÃ­vel copiar o link.");
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    const confirmed = window.confirm(`Excluir ${person.name}?`);
    if (!confirmed) return;
    await onDelete(person.id);
  }

  return (
    <article className="rounded-2xl border border-black/10 bg-white/95 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight">{person.name}</h3>
            {links.instagram && (
              <a
                href={links.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label={`Abrir Instagram de ${person.name}`}
                title="Abrir Instagram"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/10 text-xs text-black/70 hover:bg-black/5"
              >
                IG
              </a>
            )}
          </div>

          <p className="mt-0.5 text-sm text-black/70">
            {formatDayMonth(person.day, person.month)}
            {typeof relativeDays === "number" ? ` â€¢ ${formatRelativeLabel(relativeDays)}` : ""}
          </p>

          {person.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {person.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs text-amber-800 shadow-sm">
                  {tag}
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
          className="btn-primary-brand rounded-xl bg-accent px-3 py-2 text-sm text-white hover:bg-accentHover"
        >
          Copiar mensagem
        </button>

        <button
          type="button"
          onClick={() => void copyShareLink()}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/5"
        >
          Copiar link
        </button>

        <Link href={`/person?id=${person.id}`} className="rounded-xl bg-black/5 px-3 py-2 text-sm hover:bg-black/10">
          Editar
        </Link>

        {onDelete && (
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
          >
            Excluir
          </button>
        )}
      </div>

      <div className="mt-2 min-h-5 text-xs">
        {messageCopied && <span className="text-emerald-700">Mensagem pronta ✓</span>}
        {!messageCopied && linkCopied && <span className="text-emerald-700">Link copiado ✓</span>}
      </div>

      {(links.whatsapp || links.other) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {links.whatsapp && (
            <a
              href={links.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5"
            >
              Abrir WhatsApp
            </a>
          )}
          {links.other && (
            <a
              href={links.other}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5"
            >
              Abrir link
            </a>
          )}
        </div>
      )}

      {person.notes && <p className="mt-3 text-sm text-black/70">{person.notes}</p>}

      <div className="mt-4">
        <Templates person={person} />
      </div>
    </article>
  );
}

