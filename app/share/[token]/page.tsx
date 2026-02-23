"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { decodeShareToken } from "@/lib/share";
import { formatDayMonth, isValidDayMonth } from "@/lib/dates";
import { upsertPerson } from "@/lib/storage";
import type { BirthdayPerson } from "@/lib/types";

export default function ShareTokenPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const payload = useMemo(() => {
    const token = Array.isArray(params?.token) ? params.token[0] : params?.token;
    if (!token) return null;
    return decodeShareToken(token);
  }, [params]);

  const validPayload = payload && isValidDayMonth(payload.day, payload.month) ? payload : null;

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
        tags: ["compartilhado"],
        createdAt: now,
        updatedAt: now
      };
      await upsertPerson(person);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!validPayload) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
        <h1 className="text-lg font-semibold">Link inválido</h1>
        <p className="mt-2 text-sm">Este token não pôde ser lido ou está malformado.</p>
        <Link href="/today" className="mt-4 inline-block rounded-lg bg-white px-3 py-2 text-sm text-ink">
          Ir para o app
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="rounded-2xl border border-black/10 bg-white/90 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-black/60">BdayHub • Link compartilhado</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{validPayload.name}</h1>
        <p className="mt-1 text-sm text-black/70">Aniversário: {formatDayMonth(validPayload.day, validPayload.month)}</p>

        <button
          type="button"
          onClick={() => void handleAddToList()}
          disabled={saving || saved}
          className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {saved ? "Adicionado à minha lista" : saving ? "Adicionando..." : "Adicionar à minha lista"}
        </button>

        {saved && (
          <button
            type="button"
            onClick={() => router.push("/today")}
            className="ml-2 mt-4 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
          >
            Ver minha lista
          </button>
        )}
      </div>

      <p className="text-xs text-black/60">
        v1 sem backend: o token expõe apenas nome + dia/mês e não possui revogação individual.
      </p>
    </div>
  );
}
