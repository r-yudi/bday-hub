"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
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
import { formatInstagramForInput, formatWhatsappForInput, persistInstagramLink, persistWhatsappLink } from "@/lib/personLinks";
import { normalizeNfc } from "@/lib/text";
import type { BirthdayPerson } from "@/lib/types";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { FieldGroup, FieldHelper, FieldLabel, SelectField, TextArea, TextInput } from "@/components/ui/Field";

type PersonFormProps = {
  initialPerson?: BirthdayPerson | null;
  onSave: (person: BirthdayPerson) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
};

const months = Array.from({ length: 12 }, (_, i) => i + 1);
const days = Array.from({ length: 31 }, (_, i) => i + 1);

type PersonFormHelpKey = "name" | "nickname" | "categories" | "whatsapp" | "instagram" | "other" | "notes";

function FieldHelpRow({
  htmlFor,
  label,
  helpKey,
  openHelp,
  setOpenHelp,
  children
}: {
  htmlFor: string;
  label: ReactNode;
  helpKey: PersonFormHelpKey;
  openHelp: PersonFormHelpKey | null;
  setOpenHelp: Dispatch<SetStateAction<PersonFormHelpKey | null>>;
  children: ReactNode;
}) {
  const panelId = `pf-help-${helpKey}`;
  const triggerId = `${panelId}-btn`;
  const isOpen = openHelp === helpKey;
  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <FieldLabel htmlFor={htmlFor} className="mb-0 flex flex-wrap items-center gap-1.5">
          {label}
        </FieldLabel>
        <button
          type="button"
          id={triggerId}
          className="inline-flex h-5 min-h-5 min-w-5 shrink-0 items-center justify-center rounded-full border border-border bg-surface2 text-[10px] font-semibold leading-none text-muted hover:bg-surface2/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-label="Mostrar ou ocultar dica sobre este campo"
          onClick={() => setOpenHelp((current) => (current === helpKey ? null : helpKey))}
        >
          ?
        </button>
      </div>
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        hidden={!isOpen}
        className="rounded-lg border border-border/80 bg-surface2/90 px-3 py-2 text-xs leading-snug text-text dark:border-border/60 dark:bg-surface2/70"
      >
        {children}
      </div>
    </div>
  );
}

function initialCategoriesFromPerson(person?: BirthdayPerson | null) {
  if (!person) return [];
  return extractCategoriesFromPerson(person);
}

function RequiredMark() {
  return <span className="rounded-full bg-primary/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">*</span>;
}

export function PersonForm({ initialPerson, onSave, onDelete }: PersonFormProps) {
  const [name, setName] = useState(initialPerson?.name ?? "");
  const [nickname, setNickname] = useState(initialPerson?.nickname ?? "");
  const [day, setDay] = useState<number>(initialPerson?.day ?? 1);
  const [month, setMonth] = useState<number>(initialPerson?.month ?? 1);
  const [notes, setNotes] = useState(initialPerson?.notes ?? "");
  const [whatsapp, setWhatsapp] = useState(() => formatWhatsappForInput(initialPerson?.links?.whatsapp));
  const [instagram, setInstagram] = useState(() => formatInstagramForInput(initialPerson?.links?.instagram));
  const [otherLink, setOtherLink] = useState(initialPerson?.links?.other ?? "");
  const [categories, setCategories] = useState<string[]>(initialCategoriesFromPerson(initialPerson));
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [openHelp, setOpenHelp] = useState<PersonFormHelpKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(initialPerson?.name ?? "");
    setNickname(initialPerson?.nickname ?? "");
    setDay(initialPerson?.day ?? 1);
    setMonth(initialPerson?.month ?? 1);
    setNotes(initialPerson?.notes ?? "");
    setWhatsapp(formatWhatsappForInput(initialPerson?.links?.whatsapp));
    setInstagram(formatInstagramForInput(initialPerson?.links?.instagram));
    setOtherLink(initialPerson?.links?.other ?? "");
    setCategories(initialCategoriesFromPerson(initialPerson));
    setCategoryInput("");
    setShowAllSuggestions(false);
    setOpenHelp(null);
    setError(null);
  }, [initialPerson]);

  useEffect(() => {
    if (openHelp === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenHelp(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openHelp]);

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
      nickname: normalizeNfc(nickname.trim()) || undefined,
      notes: normalizeNfc(notes.trim()) || undefined,
      links: {
        whatsapp: persistWhatsappLink(whatsapp),
        instagram: persistInstagramLink(instagram),
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
    <div className="ui-panel-soft rounded-2xl border p-5 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Alert variant="info" className="text-xs">
          Campos com <span className="font-semibold text-primary">*</span> são obrigatórios. Os demais são opcionais.
        </Alert>

        <FieldGroup>
          <FieldHelpRow
            htmlFor="person-name"
            helpKey="name"
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
            label={
              <>
                <span>Nome</span>
                <RequiredMark />
              </>
            }
          >
            Nome completo ou do jeito que você quer ver na lista.
          </FieldHelpRow>
          <TextInput id="person-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Ana Silva" />
          <FieldHelper>Na mensagem do dia usamos Como chamar, se tiver, senão o primeiro nome.</FieldHelper>
        </FieldGroup>

        <FieldGroup>
          <FieldHelpRow
            htmlFor="person-nickname"
            helpKey="nickname"
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
            label={<span>Como chamar</span>}
          >
            É o jeito que você chama essa pessoa.
          </FieldHelpRow>
          <TextInput
            id="person-nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Ex: Ju, titia, Dr. Paulo"
          />
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
          <FieldHelpRow
            htmlFor="person-category-input"
            helpKey="categories"
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
            label={<span>Categorias</span>}
          >
            Serve para organizar sua lista.
          </FieldHelpRow>
          <FieldHelper>
            Opcional. Ex.: Família, Amigos, Trabalho.{" "}
            <Link href="/people?tab=categories" className="ui-link-tertiary">
              Gerenciar categorias
            </Link>
          </FieldHelper>
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
            <FieldHelpRow
              htmlFor="person-whatsapp"
              helpKey="whatsapp"
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
              label={<span>WhatsApp</span>}
            >
              Só o número. A gente monta o link.
            </FieldHelpRow>
            <TextInput
              id="person-whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Ex.: 11 98765-4321"
              inputMode="tel"
              autoComplete="tel"
            />
          </FieldGroup>
          <FieldGroup>
            <FieldHelpRow
              htmlFor="person-instagram"
              helpKey="instagram"
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
              label={<span>Instagram</span>}
            >
              Só o @ ou o nome de usuário.
            </FieldHelpRow>
            <TextInput
              id="person-instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="Ex.: @ana ou ana"
              autoComplete="username"
            />
          </FieldGroup>
        </div>

        <FieldGroup>
          <FieldHelpRow
            htmlFor="person-other"
            helpKey="other"
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
            label={<span>Outro link (opcional)</span>}
          >
            Um link que você usa para falar com essa pessoa.
          </FieldHelpRow>
          <TextInput id="person-other" value={otherLink} onChange={(e) => setOtherLink(e.target.value)} placeholder="https://..." />
        </FieldGroup>

        <FieldGroup>
          <FieldHelpRow
            htmlFor="person-notes"
            helpKey="notes"
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
            label={<span>Sobre essa pessoa</span>}
          >
            Só para você lembrar. Não entra na mensagem automática.
          </FieldHelpRow>
          <TextArea
            id="person-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: chama de Ju, ama café, sempre mando áudio"
          />
          {!notes.trim() && (
            <p className="text-xs text-muted">
              Opcional. Lembrete para você ao parabenizar; use Como chamar para a saudação na mensagem sugerida.
            </p>
          )}
        </FieldGroup>

        {error && <Alert variant="danger">{error}</Alert>}

        <div className="flex flex-col gap-3 border-t border-border/50 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <Button
            type="submit"
            loading={saving}
            className="ui-cta-primary order-1 w-full sm:order-none sm:w-auto"
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
          {isEdit && onDelete && initialPerson && (
            <Button
              type="button"
              variant="ghost"
              className="order-2 w-full border border-danger/25 text-danger hover:bg-danger/10 sm:order-none sm:w-auto"
              onClick={() => void onDelete(initialPerson.id)}
            >
              Excluir aniversário
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
