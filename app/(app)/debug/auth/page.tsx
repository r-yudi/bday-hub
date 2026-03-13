import { notFound } from "next/navigation";
import { AuthDebugPanel } from "@/components/AuthDebugPanel";
import { AuthPreflightPanel } from "@/components/AuthPreflightPanel";

export default function DebugAuthPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <section className="ui-page-hero p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Debug</p>
        <h1 className="ui-title-editorial mt-2 text-3xl sm:text-[2rem]">Auth + Supabase</h1>
        <p className="ui-subtitle-editorial mt-2 text-sm">
          Use esta tela em desenvolvimento para confirmar sessão OAuth e acesso à tabela `birthdays` com RLS.
        </p>
      </section>

      <AuthDebugPanel />
      <AuthPreflightPanel />
    </div>
  );
}
