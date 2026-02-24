"use client";

import { useEffect, useMemo, useState } from "react";
import { isValidDayMonth } from "@/lib/dates";
import { normalizeNfc } from "@/lib/text";
import type { BirthdayPerson } from "@/lib/types";

type PersonFormProps = {
  initialPerson?: BirthdayPerson | null;
  onSave: (person: BirthdayPerson) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
};

const months = Array.from({ length: 12 }, (_, i) => i + 1);
const days = Array.from({ length: 31 }, (_, i) => i + 1);

export function PersonForm({ initialPerson, onSave, onDelete }: PersonFormProps) {
  const [name, setName] = useState(initialPerson?.name ?? "");
  const [day, setDay] = useState<number>(initialPerson?.day ?? 1);
  const [month, setMonth] = useState<number>(initialPerson?.month ?? 1);
  const [notes, setNotes] = useState(initialPerson?.notes ?? "");
  const [whatsapp, setWhatsapp] = useState(initialPerson?.links?.whatsapp ?? "");
  const [instagram, setInstagram] = useState(initialPerson?.links?.instagram ?? "");
  const [otherLink, setOtherLink] = useState(initialPerson?.links?.other ?? "");
  const [tags, setTags] = useState<string[]>(initialPerson?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(initialPerson?.name ?? "");
    setDay(initialPerson?.day ?? 1);
    setMonth(initialPerson?.month ?? 1);
    setNotes(initialPerson?.notes ?? "");
    setWhatsapp(initialPerson?.links?.whatsapp ?? "");
    setInstagram(initialPerson?.links?.instagram ?? "");
    setOtherLink(initialPerson?.links?.other ?? "");
    setTags(initialPerson?.tags ?? []);
    setTagInput("");
    setError(null);
  }, [initialPerson]);

  const isEdit = Boolean(initialPerson);
  const source = initialPerson?.source ?? "manual";
  const tagSet = useMemo(() => new Set(tags.map((tag) => tag.toLowerCase())), [tags]);

  function addTag(raw: string) {
    const normalized = normalizeNfc(raw.trim());
    if (!normalized) return;
    if (tagSet.has(normalized.toLowerCase())) return;
    setTags((prev) => [...prev, normalized]);
    setTagInput("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    if (!isValidDayMonth(day, month)) {
      setError("Dia/mês inválidos.");
      return;
    }

    const now = Date.now();
    const person: BirthdayPerson = {
      id: initialPerson?.id ?? crypto.randomUUID(),
      name: normalizeNfc(name.trim()),
      day,
      month,
      source,
      tags: tags.map((tag) => normalizeNfc(tag)),
      notes: normalizeNfc(notes.trim()) || undefined,
      links: {
        whatsapp: whatsapp.trim() || undefined,
        instagram: instagram.trim() || undefined,
        other: otherLink.trim() || undefined
      },
      createdAt: initialPerson?.createdAt ?? now,
      updatedAt: now
    };

    setSaving(true);
    try {
      await onSave(person);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-black/10 bg-white/90 p-5 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-medium">Nome</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-black/15 px-3 py-2 outline-none focus:border-accent"
          placeholder="Ex.: Ana Silva"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Dia</label>
          <select value={day} onChange={(e) => setDay(Number(e.target.value))} className="w-full rounded-xl border border-black/15 px-3 py-2">
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Mês</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-full rounded-xl border border-black/15 px-3 py-2">
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Categorias</label>
        <div className="rounded-xl border border-black/15 px-3 py-2">
          <div className="mb-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs text-orange-700 hover:bg-orange-100"
                title="Remover categoria"
              >
                {tag} ×
              </button>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(tagInput);
              }
            }}
            placeholder="Digite e pressione Enter"
            className="w-full outline-none"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">WhatsApp (link)</label>
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full rounded-xl border border-black/15 px-3 py-2" placeholder="https://wa.me/..." />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Instagram (link)</label>
          <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full rounded-xl border border-black/15 px-3 py-2" placeholder="https://instagram.com/..." />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Outro link (opcional)</label>
        <input value={otherLink} onChange={(e) => setOtherLink(e.target.value)} className="w-full rounded-xl border border-black/15 px-3 py-2" placeholder="https://..." />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Observações</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-24 w-full rounded-xl border border-black/15 px-3 py-2" placeholder="Observações" />
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary-brand rounded-xl bg-accent px-4 py-2 text-sm text-white hover:bg-accentHover disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
        {isEdit && onDelete && initialPerson && (
          <button type="button" onClick={() => void onDelete(initialPerson.id)} className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">
            Excluir
          </button>
        )}
      </div>
    </form>
  );
}
