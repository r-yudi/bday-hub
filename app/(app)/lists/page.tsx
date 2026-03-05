"use client";

export default function ListsPage() {
  return (
    <div className="ui-container space-y-8">
      <section className="ui-section ui-panel p-6 sm:p-8">
        <div className="ui-section-header">
          <p className="ui-eyebrow text-muted">Colaboração</p>
          <h1 className="ui-title-editorial text-4xl sm:text-[2.45rem]">
            Listas compartilhadas
          </h1>
          <p className="ui-subtitle-editorial mt-2 text-sm text-muted max-w-[72ch]">
            Convide familiares ou amigos para ajudar a manter aniversários atualizados.
          </p>
        </div>
        <div className="mt-6">
          <button
            type="button"
            className="ui-cta-primary inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentHover focus-visible:outline-none"
          >
            Criar lista
          </button>
        </div>
      </section>
    </div>
  );
}
