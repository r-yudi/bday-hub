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
      window.alert("NÃ£o foi possÃ­vel copiar o link automaticamente.");
    }
  }

  if (!validPayload) {
    return (
      <div className="grid min-h-[65vh] place-items-center">
        <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <h1 className="text-lg font-semibold">Link invÃ¡lido</h1>
          <p className="mt-2 text-sm">Este token nÃ£o pÃ´de ser lido ou estÃ¡ malformado.</p>
          <Link href="/today" className="mt-4 inline-block rounded-lg bg-white px-3 py-2 text-sm text-ink">
            Ir para o app
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[65vh] place-items-center py-4">
      <div className="mx-auto w-full max-w-xl space-y-4">
        <div className="rounded-3xl border border-black/10 bg-white/95 p-7 text-center shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-black/60">Lembra â€¢ Link compartilhado</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-black/90 sm:text-[2.1rem]">{validPayload.name}</h1>
          <p className="mt-2 text-sm text-black/70">
            AniversÃ¡rio: <span className="font-medium text-black/85">{formatDayMonth(validPayload.day, validPayload.month)}</span>
          </p>

          <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Este link compartilha apenas nome e dia/mÃªs. NÃ£o inclui ano.
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void handleCopyLink()}
              className="btn-primary-brand rounded-xl bg-accent px-4 py-2.5 text-sm text-white hover:bg-accentHover"
            >
              Copiar link
            </button>
            <button
              type="button"
              onClick={() => void handleAddToList()}
              disabled={saving || saved}
              aria-label={saved ? "Adicionado à minha lista" : "Adicionar à minha lista"}
              className="btn-primary-brand rounded-xl bg-accent px-4 py-2.5 text-sm text-white hover:bg-accentHover disabled:opacity-50"
            >
              {saved ? "Adicionado Ã  minha lista" : saving ? "Adicionando..." : "Adicionar Ã  minha lista"}
            </button>
          </div>

          <p aria-live="polite" className="mt-3 min-h-5 text-xs font-medium text-emerald-700">
            {copied ? "Link copiado ✓" : ""}
          </p>

          {saved && (
            <button
              type="button"
              onClick={() => router.push("/today")}
              className="mt-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
            >
              Ver minha lista
            </button>
          )}
        </div>

        <p className="text-center text-xs text-black/60">
          v1 sem backend: o token expÃµe apenas nome + dia/mÃªs e nÃ£o possui revogaÃ§Ã£o individual.
        </p>
      </div>
    </div>
  );
}


