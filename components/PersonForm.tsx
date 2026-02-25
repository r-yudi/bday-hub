"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildCategoryIndex,
  dedupeCategoryNames,
  extractCategoriesFromPerson,
  findCloseCategorySuggestion,
  mergeSuggestions,
  normalizeCategory,
  normalizeCategoryName,
  PREDEFINED_CATEGORIES
} from "@/lib/categories";
import { listCategories, seedDefaultCategories, upsertCategory } from "@/lib/categoriesRepo";
import { listBirthdays } from "@/lib/birthdaysRepo";
import { isValidDayMonth } from "@/lib/dates";
import { normalizeNfc } from "@/lib/text";
import type { BirthdayPerson } from "@/lib/types";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Card } from "@/components/ui/Card";
import { FieldGroup, FieldLabel, SelectField, TextArea, TextInput } from "@/components/ui/Field";

type PersonFormProps = {
  initialPerson?: BirthdayPerson | null;
  onSave: (person: BirthdayPerson) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
};

const months = Array.from({ length: 12 }, (_, i) => i + 1);
const days = Array.from({ length: 31 }, (_, i) => i + 1);

function initialCategoriesFromPerson(person?: BirthdayPerson | null) {
  if (!person) return [];
  return extractCategoriesFromPerson(person);
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

  const categoryIndex = useMemo(() => buildCategoryIndex([...categoryOptions, ...categories]), [categoryOptions, categories]);
  const selectedKeys = useMemo(() => new Set(categories.map((value) => normalizeCategory(value))), [categories]);
  const availableOptions = useMemo(
    () => categoryOptions.filter((option) => !selectedKeys.has(normalizeCategory(option))),
    [categoryOptions, selectedKeys]
  );

  const typoSuggestion = useMemo(() => {
    if (!categoryInput.trim()) return null;
    const suggestion = findCloseCategorySuggestion(categoryInput, categoryOptions);
    if (!suggestion) return null;
    const inputKey = normalizeCategory(categoryInput);
    const suggestionKey = normalizeCategory(suggestion);
    if (!inputKey || inputKey === suggestionKey) return null;
    return suggestion;
  }, [categoryInput, categoryOptions]);

  useEffect(() => {
    let active = true;
    void (async () => {
      await seedDefaultCategories();
      const [repoCategories, people] = await Promise.all([listCategories(), listBirthdays()]);
      if (!active) return;

      const categoriesFromPeople = people.flatMap((person) => extractCategoriesFromPerson(person));
      setCategoryOptions(mergeSuggestions(PREDEFINED_CATEGORIES, categoriesFromPeople, repoCategories));
    })();
    return () => {
      active = false;
    };
  }, []);

  async function addCategory(raw: string) {
    const pretty = normalizeCategoryName(raw);
    if (!pretty) return;

    const exactExisting = categoryIndex.get(normalizeCategory(pretty));
    const chosen = exactExisting ?? pretty;

    const saved = await upsertCategory(chosen);
    const finalValue = saved ?? chosen;

    setCategories((prev) => dedupeCategoryNames([...prev, finalValue]));
    setCategoryOptions((prev) => mergeSuggestions(PREDEFINED_CATEGORIES, prev, [finalValue]));
    setCategoryInput("");
  }

  function removeCategory(value: string) {
    const key = normalizeCategory(value);
    setCategories((prev) => prev.filter((item) => normalizeCategory(item) !== key));
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
      const pretty = normalizeCategoryName(categoryInput);
      const exactExisting = categoryIndex.get(normalizeCategory(pretty));
      const finalInput = exactExisting ?? pretty;
      if (finalInput) {
        await addCategory(finalInput);
        resolvedCategories = dedupeCategoryNames([...categories, finalInput]);
      }
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
    <Card variant="elevated" className="p-5 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <FieldGroup>
          <FieldLabel htmlFor="person-name">Nome</FieldLabel>
          <TextInput id="person-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Ana Silva" />
        </FieldGroup>

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup>
            <FieldLabel htmlFor="person-day">Dia</FieldLabel>
            <SelectField id="person-day" value={day} onChange={(e) => setDay(Number(e.target.value))}>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </SelectField>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="person-month">Mês</FieldLabel>
            <SelectField id="person-month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </SelectField>
          </FieldGroup>
        </div>

        <FieldGroup>
          <FieldLabel htmlFor="person-category-input">Categorias</FieldLabel>
          <div className="space-y-2 rounded-lg border border-border bg-surface2/70 p-3">
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {categories.map((value) => (
                  <Chip
                    key={value}
                    variant="warning"
                    interactive
                    onClick={() => removeCategory(value)}
                    title="Remover categoria"
                  >
                    {value} ×
                  </Chip>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <TextInput
                id="person-category-input"
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
                className="shadow-none"
              />
              <Button type="button" variant="secondary" size="sm" onClick={() => void addCategory(categoryInput)}>
                Adicionar
              </Button>
            </div>

            {typoSuggestion && (
              <Alert variant="warning" className="text-xs">
                <span>Você quis dizer </span>
                <span className="font-semibold">{typoSuggestion}</span>
                <span>?</span>{" "}
                <Button type="button" variant="ghost" size="sm" className="ml-1 h-auto px-1.5 py-0.5 text-xs" onClick={() => void addCategory(typoSuggestion)}>
                  Usar {typoSuggestion}
                </Button>
              </Alert>
            )}

            <datalist id="category-options">
              {availableOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>

            {availableOptions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {availableOptions.slice(0, 8).map((option) => (
                  <Chip key={option} interactive variant="subtle" onClick={() => void addCategory(option)}>
                    + {option}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        </FieldGroup>

        <div className="grid gap-3 sm:grid-cols-2">
          <FieldGroup>
            <FieldLabel htmlFor="person-whatsapp">WhatsApp (link)</FieldLabel>
            <TextInput id="person-whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="https://wa.me/..." />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="person-instagram">Instagram (link)</FieldLabel>
            <TextInput id="person-instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." />
          </FieldGroup>
        </div>

        <FieldGroup>
          <FieldLabel htmlFor="person-other">Outro link (opcional)</FieldLabel>
          <TextInput id="person-other" value={otherLink} onChange={(e) => setOtherLink(e.target.value)} placeholder="https://..." />
        </FieldGroup>

        <FieldGroup>
          <FieldLabel htmlFor="person-notes">Observações</FieldLabel>
          <TextArea id="person-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações" />
        </FieldGroup>

        {error && <Alert variant="danger">{error}</Alert>}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" loading={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
          {isEdit && onDelete && initialPerson && (
            <Button type="button" variant="destructive" onClick={() => void onDelete(initialPerson.id)}>
              Excluir
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
