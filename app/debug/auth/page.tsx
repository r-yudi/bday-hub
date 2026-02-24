import { notFound } from "next/navigation";
import { AuthDebugPanel } from "@/components/AuthDebugPanel";

export default function DebugAuthPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <section className="rounded-3xl border border-black/10 bg-white/95 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-black/60">Debug</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black/90 sm:text-[2rem]">Auth + Supabase</h1>
        <p className="mt-2 text-sm text-black/70">
          Use esta tela em desenvolvimento para confirmar sessão OAuth e acesso à tabela `birthdays` com RLS.
        </p>
      </section>

      <AuthDebugPanel />
    </div>
  );
}
