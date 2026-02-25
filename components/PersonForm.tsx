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
import { FieldGroup, FieldHelper, FieldLabel, SelectField, TextArea, TextInput } from "@/components/ui/Field";

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

function RequiredMark() {
  return <span className="rounded-full bg-primary/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">*</span>;
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
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
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
    setShowAllSuggestions(false);
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
  const visibleCategoryOptions = useMemo(
    () => (showAllSuggestions ? availableOptions : availableOptions.slice(0, 6)),
    [availableOptions, showAllSuggestions]
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

  function HelpDot({ title }: { title: string }) {
    return (
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border bg-surface2 text-[10px] font-semibold leading-none text-muted"
        title={title}
        aria-label={title}
      >
        ?
      </span>
    );
  }

  return (
    <Card variant="elevated" className="p-5 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Alert variant="info" className="text-xs">
          Campos com <span className="font-semibold text-primary">*</span> são obrigatórios. Os demais são opcionais.
        </Alert>

        <FieldGroup>
          <FieldLabel htmlFor="person-name" className="flex items-center gap-1.5">
            <span>Nome</span>
            <RequiredMark />
            <HelpDot title="Use o nome como você prefere ver nos lembretes." />
          </FieldLabel>
          <TextInput id="person-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Ana Silva" />
          <FieldHelper>Esse nome aparece nos lembretes e nas mensagens prontas.</FieldHelper>
        </FieldGroup>

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup>
            <FieldLabel htmlFor="person-day" className="flex items-center gap-1.5">
              <span>Dia</span>
              <RequiredMark />
            </FieldLabel>
            <SelectField id="person-day" required value={day} onChange={(e) => setDay(Number(e.target.value))}>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </SelectField>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="person-month" className="flex items-center gap-1.5">
              <span>Mês</span>
              <RequiredMark />
            </FieldLabel>
            <SelectField id="person-month" required value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </SelectField>
          </FieldGroup>
        </div>

        <FieldGroup>
          <FieldLabel htmlFor="person-category-input" className="flex items-center gap-1.5">
            <span>Categorias</span>
            <HelpDot title="Categorias ajudam a organizar sua lista (ex.: Família, Amigos, Trabalho)." />
          </FieldLabel>
          <FieldHelper>Opcional. Ex.: Família, Amigos, Trabalho.</FieldHelper>
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
                    className="ui-chip"
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
              <Button type="button" variant="secondary" size="sm" className="ui-cta-secondary" onClick={() => void addCategory(categoryInput)}>
                Adicionar
              </Button>
            </div>
            <FieldHelper>Pressione Enter para adicionar rapidamente.</FieldHelper>

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
                {visibleCategoryOptions.map((option) => (
                  <Chip key={option} interactive variant="subtle" className="ui-chip" onClick={() => void addCategory(option)}>
                    + {option}
                  </Chip>
                ))}
                {availableOptions.length > 6 && !showAllSuggestions && (
                  <button
                    type="button"
                    onClick={() => setShowAllSuggestions(true)}
                    className="text-xs font-medium text-muted underline decoration-border underline-offset-2 hover:text-text"
                  >
                    Mostrar mais
                  </button>
                )}
                {availableOptions.length > 6 && showAllSuggestions && (
                  <button
                    type="button"
                    onClick={() => setShowAllSuggestions(false)}
                    className="text-xs font-medium text-muted underline decoration-border underline-offset-2 hover:text-text"
                  >
                    Mostrar menos
                  </button>
                )}
              </div>
            )}
          </div>
        </FieldGroup>

        <div className="grid gap-3 sm:grid-cols-2">
          <FieldGroup>
            <FieldLabel htmlFor="person-whatsapp" className="flex items-center gap-1.5">
              <span>WhatsApp (link)</span>
              <HelpDot title="Opcional. Cole um link para abrir conversa ou perfil." />
            </FieldLabel>
            <TextInput id="person-whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="https://wa.me/..." />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="person-instagram" className="flex items-center gap-1.5">
              <span>Instagram (link)</span>
              <HelpDot title="Opcional. Pode ser perfil ou link direto." />
            </FieldLabel>
            <TextInput id="person-instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." />
          </FieldGroup>
        </div>

        <FieldGroup>
          <FieldLabel htmlFor="person-other" className="flex items-center gap-1.5">
            <span>Outro link (opcional)</span>
            <HelpDot title="Você pode salvar qualquer link útil: perfil, site, presente, etc." />
          </FieldLabel>
          <TextInput id="person-other" value={otherLink} onChange={(e) => setOtherLink(e.target.value)} placeholder="https://..." />
        </FieldGroup>

        <FieldGroup>
          <FieldLabel htmlFor="person-notes" className="flex items-center gap-1.5">
            <span>Observações</span>
            <HelpDot title="Anote preferências, detalhes de presente ou mensagens." />
          </FieldLabel>
          <TextArea id="person-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações" />
        </FieldGroup>

        {error && <Alert variant="danger">{error}</Alert>}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button type="submit" loading={saving} className="ui-cta-primary">
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
