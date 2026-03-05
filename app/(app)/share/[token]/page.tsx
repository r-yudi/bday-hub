"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { decodeShareToken } from "@/lib/share";
import { formatDayMonth, isValidDayMonth } from "@/lib/dates";
import { upsertBirthday } from "@/lib/birthdaysRepo";
import { queueBirthdayAddedToast } from "@/lib/onboarding-ui";
import type { BirthdayPerson } from "@/lib/types";

export default function ShareTokenPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const payload = useMemo(() => {
    const token = Array.isArray(params?.token) ? params.token[0] : params?.token;
    if (!token) return null;
    return decodeShareToken(token);
  }, [params]);

  const validPayload = payload && isValidDayMonth(payload.day, payload.month) ? payload : null;

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleAddToList() {
    if (!validPayload) return;
    setSaving(true);
    try {
      const now = Date.now();
      const person: BirthdayPerson = {
        id: crypto.randomUUID(),
        name: validPayload.name,
        day: validPayload.day,
        month: validPayload.month,
        source: "shared",
        categories: ["Compartilhado"],
        tags: ["compartilhado"],
        createdAt: now,
        updatedAt: now
      };
      await upsertBirthday(person);
      queueBirthdayAddedToast();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      window.alert("Não foi possível copiar o link automaticamente.");
    }
  }

  if (!validPayload) {
    return (
      <div className="grid min-h-[65vh] place-items-center">
        <div className="ui-panel-soft mx-auto w-full max-w-xl rounded-2xl border p-6 text-text">
          <h1 className="text-lg font-semibold tracking-tight">Link inválido</h1>
          <p className="mt-2 text-sm text-muted">Este link não pôde ser reconhecido. Pode estar incompleto ou incorreto.</p>
          <Link href="/today" className="ui-cta-secondary mt-4 inline-flex items-center rounded-lg border px-3 py-2 text-sm focus-visible:outline-none">
            Ir para o app
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ui-container grid min-h-[65vh] place-items-center py-4">
      <div className="mx-auto w-full max-w-xl space-y-4">
        <div className="ui-panel rounded-3xl border p-6 text-center sm:p-8">
          <p className="ui-eyebrow text-muted">Lembra • Link compartilhado</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-text sm:text-[2.1rem]">{validPayload.name}</h1>
          <p className="mt-2 text-sm text-muted">
            Aniversário: <span className="font-medium text-text">{formatDayMonth(validPayload.day, validPayload.month)}</span>
          </p>

          <div className="ui-surface ui-border-subtle mt-5 rounded-2xl border px-4 py-3 text-left text-sm text-muted">
            <p>
              <span className="font-medium text-text">Importante:</span> Este link compartilha apenas nome e dia/mês. Não inclui ano.
            </p>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void handleCopyLink()}
              className="btn-primary-brand ui-cta-primary rounded-xl bg-accent px-4 py-2.5 text-sm text-white hover:bg-accentHover focus-visible:outline-none"
            >
              Copiar link
            </button>
            <button
              type="button"
              onClick={() => void handleAddToList()}
              disabled={saving || saved}
              aria-label={saved ? "Adicionado à minha lista" : "Adicionar à minha lista"}
              className="ui-cta-secondary rounded-xl border px-4 py-2.5 text-sm font-medium focus-visible:outline-none disabled:opacity-70"
            >
              {saved ? "Adicionado à minha lista" : saving ? "Adicionando..." : "Adicionar à minha lista"}
            </button>
          </div>

          <p aria-live="polite" className="mt-3 min-h-5 text-xs font-medium text-success">
            {copied ? "Link copiado ✓" : ""}
          </p>

          {saved && (
            <button
              type="button"
              onClick={() => router.push("/today")}
              className="ui-focus-surface mt-2 rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline-none"
            >
              Ver minha lista
            </button>
          )}
        </div>

        <p className="text-center text-xs text-muted">
          O link mostra apenas nome e dia/mês (sem ano).
        </p>
      </div>
    </div>
  );
}
