"use client";

import Link from "next/link";
import { useState } from "react";
import { encodeShareToken } from "@/lib/share";
import { formatDayMonth, formatRelativeLabel } from "@/lib/dates";
import type { BirthdayPerson } from "@/lib/types";
import { Templates } from "@/components/Templates";

type PersonCardProps = {
  person: BirthdayPerson;
  relativeDays?: number;
  onDelete?: (id: string) => Promise<void> | void;
};

export function PersonCard({ person, relativeDays, onDelete }: PersonCardProps) {
  const [shareCopied, setShareCopied] = useState(false);

  async function copyShareLink() {
    const token = encodeShareToken({
      name: person.name,
      day: person.day,
      month: person.month,
      issuedAt: Date.now()
    });
    const url = `${window.location.origin}/share/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1200);
    } catch {
      window.alert("Não foi possível copiar o link.");
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    const confirmed = window.confirm(`Excluir ${person.name}?`);
    if (!confirmed) return;
    await onDelete(person.id);
  }

  const links = person.links ?? {};

  return (
    <article className="rounded-2xl border border-black/10 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{person.name}</h3>
          <p className="text-sm text-black/70">
            {formatDayMonth(person.day, person.month)}
            {typeof relativeDays === "number" ? ` • ${formatRelativeLabel(relativeDays)}` : ""}
          </p>
          {person.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {person.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-black/5 px-2 py-0.5 text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/person?id=${person.id}`} className="rounded-lg bg-black/5 px-3 py-1.5 text-sm hover:bg-black/10">
            Editar
          </Link>
          <button
            type="button"
            onClick={() => void copyShareLink()}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm text-white hover:opacity-95"
          >
            {shareCopied ? "Link copiado" : "Copiar link"}
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={() => void handleDelete()}
              className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100"
            >
              Excluir
            </button>
          )}
        </div>
      </div>

      {(links.whatsapp || links.instagram || links.other) && (
        <div className="mt-4 flex flex-wrap gap-2">
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
          {links.instagram && (
            <a
              href={links.instagram}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5"
            >
              Abrir Instagram
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

      {person.notes && <p className="mt-4 text-sm text-black/70">{person.notes}</p>}

      <div className="mt-4">
        <Templates person={person} />
      </div>
    </article>
  );
}
