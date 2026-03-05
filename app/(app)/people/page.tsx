"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ImportCsv } from "@/components/ImportCsv";
import { deleteBirthday, importCsvBirthdays, listBirthdays } from "@/lib/birthdaysRepo";
import { listCategories } from "@/lib/categoriesRepo";
import {
  PREDEFINED_CATEGORIES,
  dedupeCategoryNames,
  extractCategoriesFromPerson,
  normalizeCategory
} from "@/lib/categories";
import { encodeShareToken } from "@/lib/share";
import { normalizeNfc } from "@/lib/text";
import type { BirthdayPerson, SourceType } from "@/lib/types";
import { CategoriesManager } from "@/components/people/CategoriesManager";

type BirthdaySourceFilter = "all" | SourceType;
type MonthFilter = "all" | `${number}`;

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

function sortPeople(people: BirthdayPerson[]) {
  return [...people].sort((a, b) => {
    if (a.month !== b.month) return a.month - b.month;
    if (a.day !== b.day) return a.day - b.day;
    return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
  });
}

function PeoplePageFallback() {
  return (
    <div className="ui-app-shell">
      <section className="ui-section ui-panel-soft rounded-2xl border p-8">
        <p className="text-sm text-muted">Carregando...</p>
      </section>
    </div>
  );
}

export default function PeoplePage() {
  return (
    <Suspense fallback={<PeoplePageFallback />}>
      <PeoplePageContent />
    </Suspense>
  );
}

function PeoplePageContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "categories" ? "categories" : "birthdays";

  const [people, setPeople] = useState<BirthdayPerson[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showImportContactsModal, setShowImportContactsModal] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<BirthdaySourceFilter>("all");
  const [monthFilter, setMonthFilter] = useState<MonthFilter>("all");

  const deferredSearch = useDeferredValue(search.trim());

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
      setError(err instanceof Error ? err.message : "Falha ao carregar pessoas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredPeople = useMemo(() => {
    const term = normalizeCategory(deferredSearch);
    return people.filter((person) => {
      const personCategories = getPersonCategories(person);
      const matchesSearch =
        !term ||
        normalizeCategory(person.name).includes(term) ||
        normalizeCategory(person.notes ?? "").includes(term) ||
        personCategories.some((cat) => normalizeCategory(cat).includes(term));
      const matchesCategory =
        categoryFilter === "all" ||
        personCategories.some((cat) => normalizeCategory(cat) === normalizeCategory(categoryFilter));
      const matchesSource = sourceFilter === "all" || person.source === sourceFilter;
      const matchesMonth = monthFilter === "all" || String(person.month) === monthFilter;
      return matchesSearch && matchesCategory && matchesSource && matchesMonth;
    });
  }, [people, deferredSearch, categoryFilter, sourceFilter, monthFilter]);

  async function handleDelete(person: BirthdayPerson) {
    const confirmed = window.confirm(`Excluir aniversário de ${person.name}?`);
    if (!confirmed) return;
    setBusyKey(`delete:${person.id}`);
    setError(null);
    setNotice(null);
    try {
      await deleteBirthday(person.id);
      setNotice(`Aniversário de ${person.name} excluído.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir.");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleImport(imported: BirthdayPerson[]) {
    await importCsvBirthdays(imported);
    await loadData();
    setShowImport(false);
  }

  function copyShareLink(person: BirthdayPerson) {
    const token = encodeShareToken({
      name: normalizeNfc(person.name),
      day: person.day,
      month: person.month,
      issuedAt: Date.now()
    });
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${token}`;
    void navigator.clipboard.writeText(url).then(() => setNotice("Link copiado."));
  }

  const categoryOptions = useMemo(() => ["all", ...categories], [categories]);

  return (
    <div className="ui-container space-y-8">
      <section className="ui-section ui-panel p-6 sm:p-8">
        <div className="ui-section-header">
          <p className="ui-eyebrow text-muted">Painel</p>
          <h1 className="ui-title-editorial text-4xl sm:text-[2.45rem]">Pessoas</h1>
          <p className="ui-subtitle-editorial text-sm sm:text-[15px] max-w-[72ch]">
            Encontre, edite e organize seus aniversários.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Seções">
          <Link
            href="/people"
            role="tab"
            aria-selected={tab === "birthdays"}
            aria-current={tab === "birthdays" ? "page" : undefined}
            className={[
              "rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              tab === "birthdays"
                ? "bg-accent text-white"
                : "border border-border bg-surface text-muted hover:bg-surface2 hover:text-text"
            ].join(" ")}
          >
            Aniversários
          </Link>
          <Link
            href="/people?tab=categories"
            role="tab"
            aria-selected={tab === "categories"}
            aria-current={tab === "categories" ? "page" : undefined}
            className={[
              "rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              tab === "categories"
                ? "bg-accent text-white"
                : "border border-border bg-surface text-muted hover:bg-surface2 hover:text-text"
            ].join(" ")}
          >
            Categorias
          </Link>
        </div>

        {tab === "birthdays" && (
        <>
        <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <input
            type="search"
            placeholder="Buscar por nome, categoria, observação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ui-focus-surface h-10 flex-1 rounded-xl border border-border bg-surface px-3 text-sm text-text placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Buscar aniversários"
          />
          <div className="flex flex-wrap gap-2">
            <Link
              href="/person"
              className="ui-cta-primary inline-flex h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium"
            >
              Adicionar
            </Link>
            <button
              type="button"
              onClick={() => setShowImportContactsModal(true)}
              className="ui-cta-secondary inline-flex h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium"
            >
              Importar contatos
            </button>
            <button
              type="button"
              onClick={() => setShowImport((v) => !v)}
              className="ui-cta-secondary inline-flex h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium"
            >
              {showImport ? "Fechar CSV" : "Importar CSV"}
            </button>
          </div>
        </div>

        <details className="ui-disclosure mt-4 rounded-xl border border-border/80 bg-surface/50 px-4 py-3">
          <summary className="ui-disclosure-summary cursor-pointer font-medium text-muted">
            Filtros
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block text-xs text-muted">
              Categoria
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="ui-focus-surface mt-1 block w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm"
              >
                <option value="all">Todas</option>
                {categoryOptions.filter((o) => o !== "all").map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-muted">
              Origem
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as BirthdaySourceFilter)}
                className="ui-focus-surface mt-1 block w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm"
              >
                <option value="all">Todas</option>
                <option value="manual">Manual</option>
                <option value="csv">CSV</option>
                <option value="shared">Compartilhado</option>
              </select>
            </label>
            <label className="block text-xs text-muted">
              Mês
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value as MonthFilter)}
                className="ui-focus-surface mt-1 block w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm"
              >
                <option value="all">Todos</option>
                {MONTH_LABELS.slice(1).map((label, i) => (
                  <option key={label} value={String(i + 1)}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </details>
        </>
        )}

        {tab === "categories" && (
          <div className="mt-6">
            <CategoriesManager
              people={people}
              categories={categories}
              onRefresh={loadData}
            />
          </div>
        )}
      </section>

      {showImportContactsModal && (
        <div
          className="ui-overlay-backdrop fixed inset-0 z-40 grid place-items-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-contacts-title"
        >
          <div className="ui-modal-surface w-full max-w-sm border p-6">
            <h2 id="import-contacts-title" className="text-lg font-semibold tracking-tight text-text">
              Importar contatos
            </h2>
            <p className="mt-2 text-sm text-muted">
              Encontre aniversários automaticamente nos seus contatos.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                className="ui-cta-secondary inline-flex h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium"
                onClick={() => setShowImportContactsModal(false)}
              >
                Importar do Google
              </button>
              <button
                type="button"
                className="ui-cta-secondary inline-flex h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium"
                onClick={() => {
                  setShowImportContactsModal(false);
                  setShowImport(true);
                }}
              >
                Importar CSV
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowImportContactsModal(false)}
              className="ui-link-tertiary mt-4 text-sm font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {showImport && (
        <section className="ui-section">
          <ImportCsv onImport={handleImport} />
        </section>
      )}

      {error && <Alert variant="danger">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}

      {tab === "birthdays" && (loading ? (
        <section className="ui-section ui-panel-soft rounded-2xl border p-8">
          <p className="text-sm text-muted">Carregando...</p>
        </section>
      ) : people.length === 0 ? (
        <section className="ui-section">
          <div className="ui-empty-hero">
            <div className="ui-empty-icon" aria-hidden>
              👤
            </div>
            <h2 className="ui-empty-title">Nenhuma pessoa cadastrada</h2>
            <p className="ui-empty-subtitle">
              Adicione aniversários manualmente ou importe um CSV para começar.
            </p>
            <div className="ui-empty-actions">
              <Link href="/person" className="ui-cta-primary inline-flex h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium">
                Adicionar
              </Link>
              <button
                type="button"
                onClick={() => setShowImport(true)}
                className="ui-cta-secondary inline-flex h-11 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium"
              >
                Importar CSV
              </button>
            </div>
          </div>
        </section>
      ) : filteredPeople.length === 0 ? (
        <section className="ui-section">
          <div className="ui-empty-hero">
            <div className="ui-empty-icon" aria-hidden>
              🔍
            </div>
            <h2 className="ui-empty-title">Nenhum resultado</h2>
            <p className="ui-empty-subtitle">
              Ajuste a busca ou os filtros para encontrar aniversários.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategoryFilter("all");
                setSourceFilter("all");
                setMonthFilter("all");
              }}
              className="ui-cta-secondary inline-flex h-11 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium"
            >
              Limpar filtros
            </button>
          </div>
        </section>
      ) : (
        <section className="ui-section" aria-label="Lista de aniversários">
          <p className="mb-2 text-sm text-muted">
            {filteredPeople.length} de {people.length} pessoa(s).
          </p>
          <p className="mb-3 text-xs text-muted">Toque e segure para selecionar (em breve).</p>
          <div className="ui-list">
            {filteredPeople.map((person) => {
              const personCategories = getPersonCategories(person);
              const deleting = busyKey === `delete:${person.id}`;
              return (
                <div key={person.id} className="ui-list-item">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-semibold tracking-tight text-text">
                          {normalizeNfc(person.name)}
                        </h2>
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
                      <button
                        type="button"
                        onClick={() => copyShareLink(person)}
                        title="Compartilhar por link: envie um link para alguém adicionar este aniversário à própria lista. O link mostra apenas nome e dia/mês (sem ano)."
                        className="ui-focus-surface inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium text-text hover:bg-surface/80"
                      >
                        Compartilhar
                      </button>
                      <Button
                        variant="destructive"
                        size="sm"
                        loading={deleting}
                        onClick={() => void handleDelete(person)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) )}
    </div>
  );
}
