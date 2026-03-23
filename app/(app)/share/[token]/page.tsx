"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
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
      window.alert("Não foi possível copiar o link.");
    }
  }

  if (!validPayload) {
    return (
      <div className="ui-container" data-page-canonical="share-invite" data-share-token-state="invalid">
        <section className="ui-section">
          <div className="ui-panel mx-auto w-full max-w-md p-6 sm:p-8">
            <div className="ui-empty-hero py-6">
              <div className="ui-empty-icon" aria-hidden>
                🔗
              </div>
              <h1 className="ui-empty-title text-xl sm:text-2xl">Este convite não abre</h1>
              <p className="ui-empty-subtitle">
                O endereço pode estar cortado, errado ou corrompido. Peça um novo link a quem enviou.
              </p>
              <div className="ui-empty-actions">
                <Link
                  href="/today"
                  className="ui-cta-primary inline-flex h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium focus-visible:outline-none"
                >
                  Ir para o app
                </Link>
                <Link href="/share" className="ui-link-tertiary text-sm font-medium">
                  Criar um link no Lembra
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="ui-container" data-page-canonical="share-invite" data-share-token-state="valid">
      <section className="ui-section">
        <div className="ui-panel mx-auto w-full max-w-md p-6 sm:p-8">
          <header className="ui-section-header text-left">
            <p className="ui-eyebrow">Convite</p>
            <h1 className="ui-title-editorial text-left text-3xl sm:text-[2.1rem]">{validPayload.name}</h1>
            <p className="ui-subtitle-editorial text-left text-sm sm:text-[15px]">
              Data do aniversário:{" "}
              <span className="font-medium text-text">{formatDayMonth(validPayload.day, validPayload.month)}</span>
              {" · "}
              sem ano de nascimento neste link.
            </p>
          </header>

          <div className="ui-callout mt-6 rounded-xl border border-border/70 px-4 py-3 text-sm text-muted">
            <p>
              Só entram na sua lista o <span className="font-medium text-text">nome</span> e o{" "}
              <span className="font-medium text-text">dia/mês</span>. Funciona sem login; com conta, pode sincronizar
              depois.
            </p>
          </div>

          {!saved ? (
            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={() => void handleAddToList()}
                disabled={saving}
                className="ui-cta-primary flex h-11 w-full items-center justify-center rounded-xl px-5 text-sm font-medium focus-visible:outline-none disabled:opacity-70"
              >
                {saving ? "Adicionando..." : "Adicionar à minha lista"}
              </button>
              <button
                type="button"
                onClick={() => void handleCopyLink()}
                className="ui-cta-secondary flex h-10 w-full items-center justify-center rounded-xl border px-4 text-sm font-medium focus-visible:outline-none"
              >
                Copiar link
              </button>
              <p aria-live="polite" className="min-h-5 text-center text-xs text-success">
                {copied ? "Link copiado." : ""}
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-5">
              <Alert variant="success" className="text-sm">
                <p className="font-medium text-text">Salvo na sua lista neste aparelho.</p>
                <p className="mt-1 text-muted">Em Conta você pode entrar com Google para manter os mesmos dados em outros dispositivos.</p>
              </Alert>
              <button
                type="button"
                onClick={() => router.push("/today")}
                className="ui-cta-primary flex h-11 w-full items-center justify-center rounded-xl px-5 text-sm font-medium focus-visible:outline-none"
              >
                Ver minha lista
              </button>
              <Link href="/people" className="ui-link-tertiary block text-center text-sm font-medium">
                Ver em Pessoas
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
