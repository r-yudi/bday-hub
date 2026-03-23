"use client";

import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import {
  PREDEFINED_CATEGORIES,
  dedupeCategoryNames,
  extractCategoriesFromPerson,
  normalizeCategory
} from "@/lib/categories";
import { deleteCategory, upsertCategory } from "@/lib/categoriesRepo";
import type { BirthdayPerson } from "@/lib/types";

type CategoriesManagerProps = {
  people: BirthdayPerson[];
  categories: string[];
  onRefresh: () => void;
};

type TypeFilter = "all" | "padrao" | "custom";
type UsageFilter = "all" | "usada" | "nao_usada";
type SortBy = "name" | "usage";

const PREDEFINED_SET = new Set(
  PREDEFINED_CATEGORIES.map((c) => normalizeCategory(c))
);

function getPersonCategories(person: BirthdayPerson): string[] {
  return dedupeCategoryNames(extractCategoriesFromPerson(person));
}

function countCategoryUsage(category: string, people: BirthdayPerson[]): number {
  const key = normalizeCategory(category);
  return people.filter((person) =>
    getPersonCategories(person).some((c) => normalizeCategory(c) === key)
  ).length;
}

function usageLabel(n: number) {
  if (n === 0) return "Ninguém usa ainda";
  if (n === 1) return "1 pessoa";
  return `${n} pessoas`;
}

export function CategoriesManager({
  people,
  categories,
  onRefresh
}: CategoriesManagerProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [usageFilter, setUsageFilter] = useState<UsageFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categoryUsage = useMemo(() => {
    const map = new Map<string, number>();
    for (const cat of categories) {
      map.set(cat, countCategoryUsage(cat, people));
    }
    return map;
  }, [categories, people]);

  const filteredAndSorted = useMemo(() => {
    let list = categories.map((name) => ({
      name,
      isPredefined: PREDEFINED_SET.has(normalizeCategory(name)),
      usage: categoryUsage.get(name) ?? 0
    }));

    if (typeFilter === "padrao") list = list.filter((c) => c.isPredefined);
    else if (typeFilter === "custom") list = list.filter((c) => !c.isPredefined);

    if (usageFilter === "usada") list = list.filter((c) => c.usage > 0);
    else if (usageFilter === "nao_usada") list = list.filter((c) => c.usage === 0);

    if (sortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
    } else {
      list = [...list].sort((a, b) => b.usage - a.usage || a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
    }

    return list;
  }, [categories, typeFilter, usageFilter, sortBy, categoryUsage]);

  async function handleDelete(name: string) {
    if (!window.confirm(`Excluir a categoria "${name}"? Quem já usa continua vendo a etiqueta até editar a pessoa.`)) return;
    setDeleting(name);
    setError(null);
    try {
      await deleteCategory(name);
      setNotice(`Categoria "${name}" removida.`);
      onRefresh();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir.");
    } finally {
      setDeleting(null);
    }
  }

  async function handleSaveEdit() {
    if (!editing) return;
    const trimmed = editValue.trim();
    if (!trimmed) {
      setEditing(null);
      return;
    }
    setError(null);
    try {
      await upsertCategory(trimmed);
      if (normalizeCategory(trimmed) !== normalizeCategory(editing)) await deleteCategory(editing);
      setNotice("Nome da categoria atualizado.");
      setEditing(null);
      setEditValue("");
      onRefresh();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    }
  }

  async function handleAddCategory() {
    const name = window.prompt("Nome da nova categoria:");
    if (!name?.trim()) return;
    setError(null);
    try {
      await upsertCategory(name.trim());
      setNotice("Categoria criada.");
      onRefresh();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar.");
    }
  }

  return (
    <div className="space-y-6">
      <header className="ui-section-header">
        <p className="ui-eyebrow">Organização</p>
        <h2 className="ui-title-editorial text-2xl sm:text-[1.65rem]">Categorias</h2>
        <p className="ui-subtitle-editorial max-w-[72ch] text-sm">
          Etiquetas para agrupar aniversários. As sugeridas pelo app não podem ser renomeadas; as suas você edita ou remove aqui.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted sm:max-w-[48ch]">
          Categorias personalizadas vêm do cadastro ou do CSV.
        </p>
        <Button type="button" variant="primary" size="md" onClick={() => void handleAddCategory()}>
          Nova categoria
        </Button>
      </div>

      {notice && (
        <Alert variant="success" className="text-sm">
          {notice}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" className="text-sm">
          {error}
        </Alert>
      )}

      <details className="ui-disclosure rounded-xl border border-border/80 bg-surface/40 px-4 py-3">
        <summary className="ui-disclosure-summary cursor-pointer font-medium text-text">
          Refinar lista
        </summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="block text-xs text-muted">
            Tipo
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="ui-focus-surface mt-1 block w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-sm text-text"
            >
              <option value="all">Todas</option>
              <option value="padrao">Sugeridas</option>
              <option value="custom">Suas</option>
            </select>
          </label>
          <label className="block text-xs text-muted">
            Uso
            <select
              value={usageFilter}
              onChange={(e) => setUsageFilter(e.target.value as UsageFilter)}
              className="ui-focus-surface mt-1 block w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-sm text-text"
            >
              <option value="all">Todas</option>
              <option value="usada">Em uso</option>
              <option value="nao_usada">Sem uso</option>
            </select>
          </label>
          <label className="block text-xs text-muted">
            Ordenar por
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="ui-focus-surface mt-1 block w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-sm text-text"
            >
              <option value="name">Nome</option>
              <option value="usage">Quantidade de uso</option>
            </select>
          </label>
        </div>
      </details>

      {filteredAndSorted.length === 0 ? (
        <div className="ui-empty-hero py-10">
          <div className="ui-empty-icon" aria-hidden>
            🏷️
          </div>
          <h3 className="ui-empty-title text-lg">Nada com esses filtros</h3>
          <p className="ui-empty-subtitle">Troque tipo, uso ou ordenação — ou limpe os filtros acima.</p>
        </div>
      ) : (
        <ul className="ui-list overflow-hidden rounded-2xl border border-border/60" role="list">
          {filteredAndSorted.map(({ name, isPredefined, usage }) => (
            <li key={name} className="ui-list-item">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  {editing === name ? (
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && void handleSaveEdit()}
                        className="ui-focus-surface h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text sm:max-w-xs"
                        autoFocus
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="primary" size="sm" onClick={() => void handleSaveEdit()}>
                          Salvar nome
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditing(null);
                            setEditValue("");
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold tracking-tight text-text">{name}</span>
                        <Chip as="span" variant={isPredefined ? "subtle" : "accent"} className="ui-chip">
                          {isPredefined ? "Sugerida" : "Sua"}
                        </Chip>
                      </div>
                      <p className="text-sm text-muted">{usageLabel(usage)}</p>
                      {isPredefined && (
                        <p className="text-xs text-muted">Não editável — faz parte do conjunto base do Lembra.</p>
                      )}
                    </>
                  )}
                </div>
                {editing !== name && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {isPredefined ? null : (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditing(name);
                            setEditValue(name);
                          }}
                        >
                          Renomear
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={deleting === name}
                          className="border border-danger/30 text-danger hover:bg-danger/10"
                          onClick={() => void handleDelete(name)}
                        >
                          Excluir
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
