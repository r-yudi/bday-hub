"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { emojiForPersonId } from "@/lib/personListEmoji";
import { getTodaySuggestedMessage } from "@/lib/suggestedBirthdayMessage";
import { normalizeNfc } from "@/lib/text";
import type { BirthdayPerson } from "@/lib/types";

type TodayListItemProps = {
  person: BirthdayPerson;
};

export function TodayListItem({ person }: TodayListItemProps) {
  const [copyLabel, setCopyLabel] = useState<"Copiar msg" | "Copiado">("Copiar msg");
  const revertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const whatsapp = person.links?.whatsapp?.trim();
  const displayName = useMemo(() => normalizeNfc(person.name), [person.name]);
  const emoji = useMemo(() => emojiForPersonId(person.id), [person.id]);

  const clearRevertTimer = useCallback(() => {
    if (revertTimer.current != null) {
      clearTimeout(revertTimer.current);
      revertTimer.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearRevertTimer();
  }, [clearRevertTimer]);

  const copyMessage = useCallback(async () => {
    const text = getTodaySuggestedMessage({
      id: person.id,
      name: person.name,
      nickname: person.nickname
    });
    try {
      await navigator.clipboard.writeText(text);
      clearRevertTimer();
      setCopyLabel("Copiado");
      revertTimer.current = setTimeout(() => {
        setCopyLabel("Copiar msg");
        revertTimer.current = null;
      }, 1500);
    } catch {
      window.alert("Não foi possível copiar a mensagem.");
    }
  }, [clearRevertTimer, person.id, person.name, person.nickname]);

  return (
    <li className="ui-list-item flex flex-wrap items-center gap-4">
      <div
        className="ui-panel-soft flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-lg"
        aria-hidden
      >
        {emoji}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold tracking-tight text-text">
          <Link
            href={`/person?id=${encodeURIComponent(person.id)}`}
            className="ui-link-tertiary ui-focus-surface rounded-sm font-semibold text-text decoration-transparent hover:decoration-inherit focus-visible:outline-none"
          >
            {displayName}
          </Link>
        </h3>
        <p className="mt-0.5 text-sm text-muted">Aniversário hoje</p>
      </div>
      <div className="shrink-0">
        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="ui-cta-primary ui-focus-surface inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium focus-visible:outline-none"
          >
            Abrir Zap
          </a>
        ) : (
          <button
            type="button"
            onClick={() => void copyMessage()}
            className="ui-cta-primary ui-focus-surface inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium focus-visible:outline-none"
          >
            {copyLabel}
          </button>
        )}
      </div>
    </li>
  );
}
