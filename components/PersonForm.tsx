"use client";

import { useEffect, useMemo, useState } from "react";
import { dedupeCategoryNames } from "@/lib/categories";
import { listCategories, seedDefaultCategories, upsertCategory } from "@/lib/categoriesRepo";
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

function initialCategoriesFromPerson(person?: BirthdayPerson | null) {
  if (!person) return [];
  return dedupeCategoryNames([...(person.categories ?? []), ...(person.tags ?? []), person.category]);
}

export function PersonForm({ initialPerson, onSave, onDelete }: PersonFormProps) {
  const [name, setName] = useState(initialPerson?.name ?? "");
  const [day, setDay] = useState<number>(initialPerson?.day ?? 1);
  const [month, setMonth] = useState<number>(initialPerson?.month ?? 1);
  const [notes, setNotes] = useState(initialPerson?.notes ?? "");
  const [whatsapp, setWhatsapp] = useState(initialPerson?.links?.whatsapp ?? "");
  const [instagram, setInstagram] = useState(initialPerson?.links?.instagram ?? "");
  const [otherLink, setOtherLink] = useState(initialPerson?.links?.other ?? "");
  const [categories, setCategories] = useState<string[]>(initialCategoriesFromPerson(initialPerson));
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
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
    setCategories(initialCategoriesFromPerson(initialPerson));
    setCategoryInput("");
    setError(null);
  }, [initialPerson]);

  const isEdit = Boolean(initialPerson);
  const source = initialPerson?.source ?? "manual";

  const categorySet = useMemo(() => new Set(categories.map((value) => value.toLocaleLowerCase("pt-BR"))), [categories]);
  const availableOptions = useMemo(
    () => categoryOptions.filter((option) => !categorySet.has(option.toLocaleLowerCase("pt-BR"))),
    [categoryOptions, categorySet]
  );

  useEffect(() => {
    let active = true;
    void (async () => {
      await seedDefaultCategories();
      const options = await listCategories();
      if (!active) return;
      setCategoryOptions(options);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function addCategory(raw: string) {
    const normalized = normalizeNfc(raw.trim());
    if (!normalized) return;

    const saved = await upsertCategory(normalized);
    const finalValue = saved ?? normalized;

    setCategories((prev) => dedupeCategoryNames([...prev, finalValue]));
    setCategoryOptions((prev) => dedupeCategoryNames([...prev, finalValue]));
    setCategoryInput("");
  }

  function removeCategory(value: string) {
    const key = value.toLocaleLowerCase("pt-BR");
    setCategories((prev) => prev.filter((item) => item.toLocaleLowerCase("pt-BR") !== key));
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

    let resolvedCategories = categories;
    if (categoryInput.trim()) {
      await addCategory(categoryInput);
      resolvedCategories = dedupeCategoryNames([...categories, categoryInput]);
    }

    const normalizedCategories = dedupeCategoryNames(resolvedCategories.map((value) => normalizeNfc(value)));
    const now = Date.now();
    const person: BirthdayPerson = {
      id: initialPerson?.id ?? crypto.randomUUID(),
      name: normalizeNfc(name.trim()),
      day,
      month,
      source,
      categories: normalizedCategories,
      category: normalizedCategories[0] || undefined,
      tags: normalizedCategories,
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
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-black/10 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div>
        <label className="mb-1 block text-sm font-medium">Nome</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-black/15 px-3 py-2 outline-none focus:border-accent dark:border-white/15 dark:bg-white/5"
          placeholder="Ex.: Ana Silva"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Dia</label>
          <select value={day} onChange={(e) => setDay(Number(e.target.value))} className="w-full rounded-xl border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-white/5">
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Mês</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-full rounded-xl border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-white/5">
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
        <div className="space-y-2 rounded-xl border border-black/15 px-3 py-2 dark:border-white/15">
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {categories.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => removeCategory(value)}
                  className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-900 hover:bg-amber-100"
                  title="Remover categoria"
                >
                  {value} ×
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addCategory(categoryInput);
                }
              }}
              list="category-options"
              placeholder="Digite e pressione Enter"
              className="w-full bg-transparent outline-none"
            />
            <button
              type="button"
              onClick={() => void addCategory(categoryInput)}
              className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs hover:bg-black/5 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15"
            >
              Adicionar
            </button>
          </div>

          <datalist id="category-options">
            {availableOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>

          {availableOptions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {availableOptions.slice(0, 8).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => void addCategory(option)}
                  className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs text-black/75 hover:bg-black/5 dark:border-white/15 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15"
                >
                  + {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">WhatsApp (link)</label>
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full rounded-xl border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-white/5" placeholder="https://wa.me/..." />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Instagram (link)</label>
          <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full rounded-xl border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-white/5" placeholder="https://instagram.com/..." />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Outro link (opcional)</label>
        <input value={otherLink} onChange={(e) => setOtherLink(e.target.value)} className="w-full rounded-xl border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-white/5" placeholder="https://..." />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Observações</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-24 w-full rounded-xl border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-white/5" placeholder="Observações" />
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
