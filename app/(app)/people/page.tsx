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

function sourceLabel(source: SourceType) {
  if (source === "manual") return "Manual";
  if (source === "csv") return "CSV";
  return "Por link";
}

function PeoplePageFallback() {
  return (
    <div className="ui-container">
      <section className="ui-section">
        <div className="ui-panel mx-auto w-full max-w-4xl p-8">
          <p className="text-sm text-muted">Carregando...</p>
        </div>
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
    <div className="ui-container" data-page-canonical="people">
      <section className="ui-section">
        <div className="ui-panel mx-auto w-full max-w-4xl p-6 sm:p-8">
          <header className="ui-section-header">
            <p className="ui-eyebrow">Sua lista</p>
            <h1 className="ui-title-editorial text-4xl sm:text-[2.45rem]">Pessoas</h1>
            <p className="ui-subtitle-editorial text-sm sm:text-[15px] max-w-[72ch]">
              Busque pelo nome, etiqueta ou observação. Filtros só mudam o que você vê — nada é apagado.
            </p>
          </header>

          {error && (
            <div className="mt-6">
              <Alert variant="danger">{error}</Alert>
            </div>
          )}
          {notice && (
            <div className="mt-6">
              <Alert variant="success">{notice}</Alert>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Seções">
            <Link
              href="/people"
              role="tab"
              aria-selected={tab === "birthdays"}
              aria-current={tab === "birthdays" ? "page" : undefined}
              className={[
                "rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
                tab === "birthdays" ? "people-tab-link--active" : "people-tab-link--inactive"
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
                "rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
                tab === "categories" ? "people-tab-link--active" : "people-tab-link--inactive"
              ].join(" ")}
            >
              Categorias
            </Link>
          </div>

        {tab === "birthdays" && (
        <>
        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <input
            type="search"
            placeholder="Nome, categoria ou observação…"
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

        <details className="ui-disclosure mt-4 rounded-xl border border-border/80 bg-surface/40 px-4 py-3">
          <summary className="ui-disclosure-summary cursor-pointer font-medium text-text">
            Refinar lista
          </summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
          <div className="mt-8">
            <CategoriesManager people={people} categories={categories} onRefresh={loadData} />
          </div>
        )}

        {tab === "birthdays" &&
          (loading ? (
            <div className="ui-stack-lg mt-8">
              <p className="text-sm text-muted">Carregando...</p>
            </div>
          ) : people.length === 0 ? (
            <div className="ui-stack-lg mt-8">
              <div className="ui-empty-hero">
                <div className="ui-empty-icon" aria-hidden>
                  👤
                </div>
                <h2 className="ui-empty-title">Nenhuma pessoa cadastrada</h2>
                <p className="ui-empty-subtitle">
                  Comece com um cadastro ou traga vários de uma vez por CSV.
                </p>
                <div className="ui-empty-actions">
                  <Link
                    href="/person"
                    className="ui-cta-primary inline-flex h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium focus-visible:outline-none"
                  >
                    Adicionar
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowImport(true)}
                    className="ui-cta-secondary inline-flex h-11 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium focus-visible:outline-none"
                  >
                    Importar CSV
                  </button>
                </div>
              </div>
            </div>
          ) : filteredPeople.length === 0 ? (
            <div className="ui-stack-lg mt-8">
              <div className="ui-empty-hero">
                <div className="ui-empty-icon" aria-hidden>
                  🔍
                </div>
                <h2 className="ui-empty-title">Nenhum resultado</h2>
                <p className="ui-empty-subtitle">Ninguém corresponde a essa combinação. Limpe os filtros ou busque de outro jeito.</p>
                <div className="ui-empty-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setCategoryFilter("all");
                      setSourceFilter("all");
                      setMonthFilter("all");
                    }}
                    className="ui-cta-secondary inline-flex h-11 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium focus-visible:outline-none"
                  >
                    Limpar filtros
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <section className="ui-stack-lg mt-8" aria-label="Lista de aniversários">
              <div className="border-b border-border/55 pb-4">
                <p className="text-sm text-muted">
                  <span className="font-medium text-text">{filteredPeople.length}</span>
                  {" · "}
                  {people.length === 1 ? "1 pessoa na lista" : `${people.length} pessoas na lista`}
                </p>
                <p className="mt-1 text-xs text-muted">Seleção em lote virá em uma próxima versão.</p>
              </div>
              <div className="ui-list overflow-hidden rounded-2xl border border-border/60">
                {filteredPeople.map((person) => {
                  const personCategories = getPersonCategories(person);
                  const deleting = busyKey === `delete:${person.id}`;
                  return (
                    <div key={person.id} className="ui-list-item">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold tracking-tight text-text">
                              {normalizeNfc(person.name)}
                            </h3>
                            <Chip as="span" variant="subtle" className="ui-chip">
                              {formatDate(person.day, person.month)}
                            </Chip>
                            <Chip as="span" variant="accent" className="ui-chip">
                              {sourceLabel(person.source)}
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
                            className="ui-cta-secondary inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-medium focus-visible:outline-none"
                          >
                            Editar
                          </Link>
                          <button
                            type="button"
                            onClick={() => copyShareLink(person)}
                            title="Compartilhar por link: envie um link para alguém adicionar este aniversário à própria lista. O link mostra apenas nome e dia/mês (sem ano)."
                            className="ui-cta-secondary inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-medium focus-visible:outline-none"
                          >
                            Compartilhar
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={deleting}
                            className="h-9 border border-danger/25 text-danger hover:bg-danger/10"
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
          ))}
        </div>
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
              Hoje dá para importar por CSV. Outras fontes (como agenda Google) ainda não estão ligadas ao app.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                disabled
                className="ui-cta-secondary inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl border border-border/60 px-4 py-2 text-sm font-medium opacity-55"
                title="Em breve"
              >
                Google (em breve)
              </button>
              <button
                type="button"
                className="ui-cta-primary inline-flex h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium"
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
          <div className="ui-panel mx-auto w-full max-w-4xl p-6 sm:p-8">
            <header className="ui-section-header mb-8">
              <p className="ui-eyebrow">Importação</p>
              <h2 className="ui-title-editorial text-2xl sm:text-[1.65rem]">Arquivo CSV</h2>
              <p className="ui-subtitle-editorial max-w-[68ch] text-sm">
                Envie um .csv com cabeçalho válido. Você vê a prévia e confirma antes de salvar.
              </p>
            </header>
            <ImportCsv embedded onImport={handleImport} />
          </div>
        </section>
      )}
    </div>
  );
}
