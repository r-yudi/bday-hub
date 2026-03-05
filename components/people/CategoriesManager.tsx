"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  PREDEFINED_CATEGORIES,
  dedupeCategoryNames,
  extractCategoriesFromPerson,
  normalizeCategory
} from "@/lib/categories";
import { deleteCategory, listCategories, upsertCategory } from "@/lib/categoriesRepo";
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
    if (!window.confirm(`Excluir a categoria "${name}"? Quem usa continuará com a categoria até editar a pessoa.`)) return;
    setDeleting(name);
    setError(null);
    try {
      await deleteCategory(name);
      setNotice(`Categoria "${name}" excluída.`);
      onRefresh();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir.");
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
      setNotice("Categoria atualizada.");
      setEditing(null);
      setEditValue("");
      onRefresh();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar.");
    }
  }

  async function handleAddCategory() {
    const name = window.prompt("Nome da nova categoria:");
    if (!name?.trim()) return;
    setError(null);
    try {
      await upsertCategory(name.trim());
      setNotice("Categoria adicionada.");
      onRefresh();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao adicionar.");
    }
  }

  return (
    <section className="ui-section space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-text">Categorias</h2>
        <button
          type="button"
          onClick={handleAddCategory}
          className="ui-cta-secondary inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-medium"
        >
          Adicionar categoria
        </button>
      </div>

      {notice && <p className="text-sm text-success">{notice}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      <details className="ui-disclosure mt-2 rounded-xl border border-border/80 bg-surface/50 px-4 py-3">
        <summary className="ui-disclosure-summary cursor-pointer font-medium text-muted">
          Filtros
        </summary>
        <div className="mt-3 flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm text-muted">
            <span>Tipo</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="ui-focus-surface rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
            >
              <option value="all">Todas</option>
              <option value="padrao">Padrão</option>
              <option value="custom">Personalizada</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            <span>Uso</span>
            <select
              value={usageFilter}
              onChange={(e) => setUsageFilter(e.target.value as UsageFilter)}
              className="ui-focus-surface rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
            >
              <option value="all">Todas</option>
              <option value="usada">Usada</option>
              <option value="nao_usada">Não usada</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            <span>Ordenar</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="ui-focus-surface rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
            >
              <option value="name">Nome</option>
              <option value="usage">Uso</option>
            </select>
          </label>
        </div>
      </details>

      <div className="ui-list rounded-2xl border border-border/80 divide-y divide-border/60">
        {filteredAndSorted.length === 0 ? (
          <div className="rounded-2xl border border-border/80 bg-surface2/30 p-6 text-center text-sm text-muted">
            Nenhuma categoria encontrada com os filtros atuais.
          </div>
        ) : (
          filteredAndSorted.map(({ name, isPredefined, usage }) => (
            <div
              key={name}
              className="ui-list-item flex flex-wrap items-center justify-between gap-2 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                {editing === name ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                      className="ui-focus-surface h-9 rounded-lg border border-border bg-surface px-2.5 text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="ui-cta-primary rounded-lg bg-accent px-3 py-1.5 text-sm text-white"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditing(null); setEditValue(""); }}
                      className="ui-cta-secondary rounded-lg border px-3 py-1.5 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium text-text">{name}</span>
                    <span
                      className={
                        isPredefined
                          ? "rounded-full border border-border bg-surface2 px-2 py-0.5 text-xs text-muted"
                          : "rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-primary"
                      }
                    >
                      {isPredefined ? "Padrão" : "Personalizada"}
                    </span>
                    <span className="text-xs text-muted">{usage} uso(s)</span>
                  </>
                )}
              </div>
              {editing !== name && (
                <div className="flex shrink-0 gap-2">
                  {isPredefined ? (
                    <>
                      <button type="button" disabled title="Categoria padrão não pode ser alterada" className="cursor-not-allowed rounded-lg border border-border bg-surface2/50 px-2.5 py-1 text-sm text-muted">
                        Editar
                      </button>
                      <button type="button" disabled title="Categoria padrão não pode ser alterada" className="cursor-not-allowed rounded-lg border border-border bg-surface2/50 px-2.5 py-1 text-sm text-muted">
                        Excluir
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => { setEditing(name); setEditValue(name); }}
                        className="ui-focus-surface rounded-lg border border-border px-2.5 py-1 text-sm"
                      >
                        Editar
                      </button>
                      <Button
                        variant="destructive"
                        size="sm"
                        loading={deleting === name}
                        onClick={() => void handleDelete(name)}
                      >
                        Excluir
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
