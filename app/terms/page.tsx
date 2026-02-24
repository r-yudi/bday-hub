import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos",
  description: "Termos básicos de uso do Lembra.",
  alternates: {
    canonical: "/terms"
  }
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-3xl border border-black/10 bg-white/95 p-6 shadow-sm sm:p-8 dark:border-white/10 dark:bg-white/5">
        <p className="text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">Legal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black/90 sm:text-[2rem] dark:text-white/90">Termos de Uso</h1>
        <p className="mt-2 text-sm text-black/70 dark:text-white/70">Versão simples para início de produto público.</p>
      </section>

      <section className="space-y-4 rounded-2xl border border-black/10 bg-white/90 p-5 text-sm text-black/75 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white/75">
        <div>
          <h2 className="font-semibold tracking-tight text-black/85 dark:text-white/85">1. Uso do serviço</h2>
          <p className="mt-1">
            O Lembra é um aplicativo para organizar aniversários e lembretes pessoais. Você é responsável pelos dados
            que cadastrar e pelos links que compartilhar.
          </p>
        </div>
        <div>
          <h2 className="font-semibold tracking-tight text-black/85 dark:text-white/85">2. Disponibilidade</h2>
          <p className="mt-1">
            O serviço pode passar por mudanças e melhorias. Funcionalidades dependentes de navegador (ex.: notificações)
            podem variar por dispositivo/OS.
          </p>
        </div>
        <div>
          <h2 className="font-semibold tracking-tight text-black/85 dark:text-white/85">3. Conta e autenticação</h2>
          <p className="mt-1">
            O login pode ser feito com Google via Supabase Auth. Você deve manter sua conta segura e encerrar sessão em
            dispositivos compartilhados.
          </p>
        </div>
        <div>
          <h2 className="font-semibold tracking-tight text-black/85 dark:text-white/85">4. Contato</h2>
          <p className="mt-1">Contato inicial (placeholder): contato@uselembra.com.br</p>
        </div>
      </section>
    </div>
  );
}
