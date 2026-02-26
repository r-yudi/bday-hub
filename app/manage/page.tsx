"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { FieldGroup, FieldHelper, FieldLabel, SelectField, TextInput } from "@/components/ui/Field";
import { deleteBirthday, listBirthdays, upsertBirthday } from "@/lib/birthdaysRepo";
import { deleteCategory, listCategories, upsertCategory } from "@/lib/categoriesRepo";
import {
  PREDEFINED_CATEGORIES,
  dedupeCategoryNames,
  extractCategoriesFromPerson,
  normalizeCategory,
  normalizeCategoryName
} from "@/lib/categories";
import type { BirthdayPerson, SourceType } from "@/lib/types";

type TabKey = "birthdays" | "categories";
type CategoryTypeFilter = "all" | "predefined" | "custom";
type CategoryUsageFilter = "all" | "used" | "unused";
type BirthdaySourceFilter = "all" | SourceType;
type MonthFilter = "all" | `${number}`;

type CategoryRow = {
  name: string;
  key: string;
  usageCount: number;
  isPredefined: boolean;
};

const MONTH_LABELS = [
  "",
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
] as const;

function formatDate(day: number, month: number) {
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
}

function getPersonCategories(person: BirthdayPerson) {
  return dedupeCategoryNames(extractCategoriesFromPerson(person));
}

function getUsageMap(people: BirthdayPerson[]) {
  const map = new Map<string, number>();
  for (const person of people) {
    for (const category of getPersonCategories(person)) {
      const key = normalizeCategory(category);
      if (!key) continue;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  return map;
}

function arraysEqualByNormalized(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const aKeys = a.map(normalizeCategory);
  const bKeys = b.map(normalizeCategory);
  return aKeys.every((key, index) => key === bKeys[index]);
}

function sortPeople(people: BirthdayPerson[]) {
  return [...people].sort((a, b) => {
    if (a.month !== b.month) return a.month - b.month;
    if (a.day !== b.day) return a.day - b.day;
    return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
  });
}

export default function ManagePage() {
  const [tab, setTab] = useState<TabKey>("birthdays");
  const [people, setPeople] = useState<BirthdayPerson[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [birthdaySearch, setBirthdaySearch] = useState("");
  const [birthdayCategoryFilter, setBirthdayCategoryFilter] = useState<string>("all");
  const [birthdaySourceFilter, setBirthdaySourceFilter] = useState<BirthdaySourceFilter>("all");
  const [birthdayMonthFilter, setBirthdayMonthFilter] = useState<MonthFilter>("all");

  const [categorySearch, setCategorySearch] = useState("");
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<CategoryTypeFilter>("all");
  const [categoryUsageFilter, setCategoryUsageFilter] = useState<CategoryUsageFilter>("all");
  const [editingCategoryKey, setEditingCategoryKey] = useState<string | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState("");

  const deferredBirthdaySearch = useDeferredValue(birthdaySearch.trim());
  const deferredCategorySearch = useDeferredValue(categorySearch.trim());

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [loadedPeople, loadedCategories] = await Promise.all([listBirthdays(), listCategories()]);
      setPeople(sortPeople(loadedPeople));
      setCategories(
        dedupeCategoryNames([...PREDEFINED_CATEGORIES, ...loadedCategories]).sort((a, b) =>
          a.localeCompare(b, "pt-BR", { sensitivity: "base" })
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar dados de gestão.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const predefinedCategoryKeys = useMemo(
    () => new Set(PREDEFINED_CATEGORIES.map((value) => normalizeCategory(value))),
    []
  );

  const usageMap = useMemo(() => getUsageMap(people), [people]);

  const categoryRows = useMemo<CategoryRow[]>(() => {
    return categories
      .map((name) => {
        const key = normalizeCategory(name);
        return {
          name,
          key,
          usageCount: usageMap.get(key) ?? 0,
          isPredefined: predefinedCategoryKeys.has(key)
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
  }, [categories, usageMap, predefinedCategoryKeys]);

  const filteredPeople = useMemo(() => {
    const search = normalizeCategory(deferredBirthdaySearch);
    return people.filter((person) => {
      const personCategories = getPersonCategories(person);
      const matchesSearch =
        !search ||
        normalizeCategory(person.name).includes(search) ||
        normalizeCategory(person.notes ?? "").includes(search) ||
        personCategories.some((category) => normalizeCategory(category).includes(search));

      const matchesCategory =
        birthdayCategoryFilter === "all" ||
        personCategories.some((category) => normalizeCategory(category) === normalizeCategory(birthdayCategoryFilter));

      const matchesSource = birthdaySourceFilter === "all" || person.source === birthdaySourceFilter;
      const matchesMonth = birthdayMonthFilter === "all" || String(person.month) === birthdayMonthFilter;

      return matchesSearch && matchesCategory && matchesSource && matchesMonth;
    });
  }, [people, deferredBirthdaySearch, birthdayCategoryFilter, birthdaySourceFilter, birthdayMonthFilter]);

  const filteredCategoryRows = useMemo(() => {
    const search = normalizeCategory(deferredCategorySearch);
    return categoryRows.filter((row) => {
      const matchesSearch = !search || row.key.includes(search);
      const matchesType =
        categoryTypeFilter === "all" ||
        (categoryTypeFilter === "predefined" && row.isPredefined) ||
        (categoryTypeFilter === "custom" && !row.isPredefined);
      const matchesUsage =
        categoryUsageFilter === "all" ||
        (categoryUsageFilter === "used" && row.usageCount > 0) ||
        (categoryUsageFilter === "unused" && row.usageCount === 0);

      return matchesSearch && matchesType && matchesUsage;
    });
  }, [categoryRows, deferredCategorySearch, categoryTypeFilter, categoryUsageFilter]);

  async function handleDeleteBirthday(person: BirthdayPerson) {
    const confirmed = window.confirm(`Excluir aniversário de ${person.name}?`);
    if (!confirmed) return;

    setBusyKey(`birthday-delete:${person.id}`);
    setError(null);
    setNotice(null);
    try {
      await deleteBirthday(person.id);
      setNotice(`Aniversário de ${person.name} excluído.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir aniversário.");
    } finally {
      setBusyKey(null);
    }
  }

  function startCategoryEdit(row: CategoryRow) {
    if (row.isPredefined) return;
    setEditingCategoryKey(row.key);
    setEditingCategoryValue(row.name);
    setNotice(null);
    setError(null);
  }

  function cancelCategoryEdit() {
    setEditingCategoryKey(null);
    setEditingCategoryValue("");
  }

  async function propagateCategoryRename(oldName: string, nextName: string) {
    const oldKey = normalizeCategory(oldName);
    const nextPretty = normalizeCategoryName(nextName);
    const nextKey = normalizeCategory(nextPretty);
    if (!nextPretty) {
      throw new Error("Nome da categoria é obrigatório.");
    }
    if (!oldKey || !nextKey) {
      throw new Error("Categoria inválida.");
    }

    const affectedPeople = people.filter((person) =>
      getPersonCategories(person).some((category) => normalizeCategory(category) === oldKey)
    );

    let bump = 0;
    for (const person of affectedPeople) {
      const currentCategories = getPersonCategories(person);
      const updatedCategories = dedupeCategoryNames(
        currentCategories.map((category) => (normalizeCategory(category) === oldKey ? nextPretty : category))
      );
      if (arraysEqualByNormalized(currentCategories, updatedCategories)) {
        continue;
      }
      const now = Date.now() + bump;
      bump += 1;
      await upsertBirthday({
        ...person,
        categories: updatedCategories,
        tags: updatedCategories,
        updatedAt: now
      });
    }

    await upsertCategory(nextPretty);
    if (oldKey !== nextKey || normalizeCategoryName(oldName) !== nextPretty) {
      await deleteCategory(oldName);
    }
  }

  async function handleSaveCategoryRename(row: CategoryRow) {
    if (row.isPredefined) return;
    const nextPretty = normalizeCategoryName(editingCategoryValue);
    if (!nextPretty) {
      setError("Nome da categoria é obrigatório.");
      return;
    }

    setBusyKey(`category-rename:${row.key}`);
    setError(null);
    setNotice(null);
    try {
      await propagateCategoryRename(row.name, nextPretty);
      cancelCategoryEdit();
      setNotice(`Categoria atualizada para "${nextPretty}".`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao editar categoria.");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDeleteCategory(row: CategoryRow) {
    if (row.isPredefined) return;
    const confirmed = window.confirm(
      row.usageCount > 0
        ? `Excluir categoria "${row.name}" e removê-la de ${row.usageCount} aniversário(s)?`
        : `Excluir categoria "${row.name}"?`
    );
    if (!confirmed) return;

    setBusyKey(`category-delete:${row.key}`);
    setError(null);
    setNotice(null);
    try {
      if (row.usageCount > 0) {
        let bump = 0;
        for (const person of people) {
          const currentCategories = getPersonCategories(person);
          if (!currentCategories.some((category) => normalizeCategory(category) === row.key)) continue;
          const updatedCategories = currentCategories.filter((category) => normalizeCategory(category) !== row.key);
          const now = Date.now() + bump;
          bump += 1;
          await upsertBirthday({
            ...person,
            categories: updatedCategories,
            tags: updatedCategories,
            updatedAt: now
          });
        }
      }

      await deleteCategory(row.name);
      if (editingCategoryKey === row.key) cancelCategoryEdit();
      setNotice(`Categoria "${row.name}" excluída.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir categoria.");
    } finally {
      setBusyKey(null);
    }
  }

  const allCategoryOptions = useMemo(
    () => ["all", ...categoryRows.map((row) => row.name)] as const,
    [categoryRows]
  );

  return (
    <div className="ui-page-shell mx-auto max-w-6xl space-y-5">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="ui-title-editorial text-3xl sm:text-[2.15rem]">Gestão</h1>
          <p className="ui-subtitle-editorial mt-2 max-w-[72ch] text-sm sm:text-[15px]">
            Gerencie aniversários e categorias em uma única tela, com busca, filtros e ações rápidas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/person" className="btn-primary-brand ui-cta-primary inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 text-sm text-white">
            Adicionar aniversário
          </Link>
          <Link href="/today" className="ui-cta-secondary inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium">
            Voltar para Hoje
          </Link>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="ui-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Aniversários</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-text">{people.length}</p>
          <p className="mt-1 text-xs text-muted">Total cadastrado (guest/local-first ou sync via Supabase).</p>
        </Card>
        <Card className="ui-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Categorias</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-text">{categoryRows.length}</p>
          <p className="mt-1 text-xs text-muted">Predefinidas + custom (custom são editáveis/excluíveis nesta tela).</p>
        </Card>
        <Card className="ui-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Em uso</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-text">
            {categoryRows.filter((row) => row.usageCount > 0).length}
          </p>
          <p className="mt-1 text-xs text-muted">Categorias com pelo menos um aniversário associado.</p>
        </Card>
      </div>

      <div role="tablist" aria-label="Gestão de aniversários e categorias" className="flex flex-wrap gap-2">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "birthdays"}
          onClick={() => setTab("birthdays")}
          className={[
            "rounded-full px-3 py-1.5 text-sm",
            tab === "birthdays" ? "bg-primary text-primaryForeground shadow-sm" : "ui-focus-surface border"
          ].join(" ")}
        >
          Aniversários
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "categories"}
          onClick={() => setTab("categories")}
          className={[
            "rounded-full px-3 py-1.5 text-sm",
            tab === "categories" ? "bg-primary text-primaryForeground shadow-sm" : "ui-focus-surface border"
          ].join(" ")}
        >
          Categorias
        </button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}

      {loading ? (
        <Card variant="elevated" className="p-5">
          <p className="text-sm text-muted">Carregando dados de gestão...</p>
        </Card>
      ) : tab === "birthdays" ? (
        <section className="space-y-4" role="tabpanel" aria-label="Lista de aniversários">
          <Card variant="elevated" className="p-4 sm:p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <FieldGroup>
                <FieldLabel htmlFor="manage-birthday-search">Buscar</FieldLabel>
                <TextInput
                  id="manage-birthday-search"
                  value={birthdaySearch}
                  onChange={(e) => setBirthdaySearch(e.target.value)}
                  placeholder="Nome, categoria, observação..."
                />
              </FieldGroup>

              <FieldGroup>
                <FieldLabel htmlFor="manage-birthday-category">Categoria</FieldLabel>
                <SelectField
                  id="manage-birthday-category"
                  value={birthdayCategoryFilter}
                  onChange={(e) => setBirthdayCategoryFilter(e.target.value)}
                >
                  {allCategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "all" ? "Todas" : option}
                    </option>
                  ))}
                </SelectField>
              </FieldGroup>

              <FieldGroup>
                <FieldLabel htmlFor="manage-birthday-source">Origem</FieldLabel>
                <SelectField
                  id="manage-birthday-source"
                  value={birthdaySourceFilter}
                  onChange={(e) => setBirthdaySourceFilter(e.target.value as BirthdaySourceFilter)}
                >
                  <option value="all">Todas</option>
                  <option value="manual">Manual</option>
                  <option value="csv">CSV</option>
                  <option value="shared">Compartilhado</option>
                </SelectField>
              </FieldGroup>

              <FieldGroup>
                <FieldLabel htmlFor="manage-birthday-month">Mês</FieldLabel>
                <SelectField
                  id="manage-birthday-month"
                  value={birthdayMonthFilter}
                  onChange={(e) => setBirthdayMonthFilter(e.target.value as MonthFilter)}
                >
                  <option value="all">Todos</option>
                  {MONTH_LABELS.slice(1).map((label, index) => (
                    <option key={label} value={String(index + 1)}>
                      {label}
                    </option>
                  ))}
                </SelectField>
              </FieldGroup>
            </div>

            <FieldHelper className="mt-3">
              {filteredPeople.length} resultado(s) de {people.length}.
            </FieldHelper>
          </Card>

          {filteredPeople.length === 0 ? (
            <Card className="ui-surface p-5">
              <p className="text-sm text-muted">Nenhum aniversário encontrado com os filtros atuais.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredPeople.map((person) => {
                const personCategories = getPersonCategories(person);
                const deleting = busyKey === `birthday-delete:${person.id}`;
                return (
                  <Card key={person.id} className="ui-surface-elevated p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-base font-semibold tracking-tight text-text">{person.name}</h2>
                          <Chip as="span" variant="subtle" className="ui-chip">
                            {formatDate(person.day, person.month)}
                          </Chip>
                          <Chip as="span" variant="accent" className="ui-chip">
                            {person.source}
                          </Chip>
                        </div>

                        {personCategories.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {personCategories.map((category) => (
                              <Chip key={`${person.id}:${category}`} as="span" variant="warning" className="ui-chip">
                                {category}
                              </Chip>
                            ))}
                          </div>
                        )}

                        {person.notes && <p className="text-sm text-muted">{person.notes}</p>}
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Link
                          href={`/person?id=${encodeURIComponent(person.id)}`}
                          className="ui-cta-secondary inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-medium"
                        >
                          Editar
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          loading={deleting}
                          onClick={() => void handleDeleteBirthday(person)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-4" role="tabpanel" aria-label="Lista de categorias">
          <Card variant="elevated" className="p-4 sm:p-5">
            <div className="grid gap-3 md:grid-cols-3">
              <FieldGroup>
                <FieldLabel htmlFor="manage-category-search">Buscar categoria</FieldLabel>
                <TextInput
                  id="manage-category-search"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Ex.: Família"
                />
              </FieldGroup>

              <FieldGroup>
                <FieldLabel htmlFor="manage-category-type">Tipo</FieldLabel>
                <SelectField
                  id="manage-category-type"
                  value={categoryTypeFilter}
                  onChange={(e) => setCategoryTypeFilter(e.target.value as CategoryTypeFilter)}
                >
                  <option value="all">Todas</option>
                  <option value="predefined">Predefinidas</option>
                  <option value="custom">Custom</option>
                </SelectField>
              </FieldGroup>

              <FieldGroup>
                <FieldLabel htmlFor="manage-category-usage">Uso</FieldLabel>
                <SelectField
                  id="manage-category-usage"
                  value={categoryUsageFilter}
                  onChange={(e) => setCategoryUsageFilter(e.target.value as CategoryUsageFilter)}
                >
                  <option value="all">Todas</option>
                  <option value="used">Em uso</option>
                  <option value="unused">Sem uso</option>
                </SelectField>
              </FieldGroup>
            </div>

            <details className="ui-disclosure mt-3 px-3 py-2">
              <summary className="ui-disclosure-summary">Detalhes da gestão de categorias neste MVP</summary>
              <div className="ui-callout mt-2 px-3 py-2 text-xs leading-5">
                <p>Categorias predefinidas são exibidas para referência, mas ficam como somente leitura nesta tela.</p>
                <p className="mt-1">Ao editar/excluir categoria custom, a alteração é propagada para os aniversários que usam essa categoria.</p>
              </div>
            </details>
          </Card>

          {filteredCategoryRows.length === 0 ? (
            <Card className="ui-surface p-5">
              <p className="text-sm text-muted">Nenhuma categoria encontrada com os filtros atuais.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredCategoryRows.map((row) => {
                const isEditing = editingCategoryKey === row.key;
                const renameBusy = busyKey === `category-rename:${row.key}`;
                const deleteBusy = busyKey === `category-delete:${row.key}`;
                return (
                  <Card
                    key={row.key}
                    className={[
                      "ui-surface-elevated p-4 transition-opacity",
                      row.isPredefined ? "border-l-2 border-l-border/70" : "border-l-2 border-l-primary/45",
                      isEditing ? "ring-1 ring-primary/25" : "",
                      deleteBusy ? "opacity-70" : "opacity-100"
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="space-y-2">
                            <FieldGroup>
                              <FieldLabel htmlFor={`edit-category-${row.key}`}>Editar categoria</FieldLabel>
                              <TextInput
                                id={`edit-category-${row.key}`}
                                value={editingCategoryValue}
                                onChange={(e) => setEditingCategoryValue(e.target.value)}
                                autoFocus
                              />
                            </FieldGroup>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                className="ui-cta-primary"
                                loading={renameBusy}
                                onClick={() => void handleSaveCategoryRename(row)}
                              >
                                Salvar
                              </Button>
                              <Button size="sm" variant="secondary" className="ui-cta-secondary" onClick={cancelCategoryEdit}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-base font-semibold tracking-tight text-text">{row.name}</h2>
                              <Chip
                                as="span"
                                variant={row.isPredefined ? "subtle" : "accent"}
                                className={row.isPredefined ? "ui-chip ui-badge-predefined" : "ui-chip ui-badge-custom"}
                              >
                                {row.isPredefined ? "Predefinida" : "Custom"}
                              </Chip>
                              <Chip as="span" variant="warning" className="ui-chip ui-badge-usage">
                                {row.usageCount} uso(s)
                              </Chip>
                            </div>
                            <p className="text-xs text-muted">
                              {row.isPredefined
                                ? "Categoria base do sistema (somente leitura nesta tela)."
                                : "Categoria custom editável/excluível."}
                            </p>
                          </div>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="ui-cta-secondary"
                            onClick={() => startCategoryEdit(row)}
                            disabled={row.isPredefined}
                            title={row.isPredefined ? "Categorias predefinidas são somente leitura neste MVP." : undefined}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            loading={deleteBusy}
                            onClick={() => void handleDeleteCategory(row)}
                            disabled={row.isPredefined}
                            title={row.isPredefined ? "Categorias predefinidas são somente leitura neste MVP." : undefined}
                          >
                            Excluir
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
