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
      <section className="ui-page-hero p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Legal</p>
        <h1 className="ui-title-editorial mt-2 text-3xl sm:text-[2rem]">Termos de Uso</h1>
        <p className="ui-subtitle-editorial mt-2 text-sm">Versão simples para início de produto público.</p>
      </section>

      <section className="ui-prose-panel space-y-4 p-5 text-sm text-muted">
        <div>
          <h2 className="font-semibold tracking-tight text-text">1. Uso do serviço</h2>
          <p className="mt-1">
            O Lembra é um aplicativo para organizar aniversários e lembretes pessoais. Você é responsável pelos dados
            que cadastrar e pelos links que compartilhar.
          </p>
        </div>
        <div>
          <h2 className="font-semibold tracking-tight text-text">2. Disponibilidade</h2>
          <p className="mt-1">
            O serviço pode passar por mudanças e melhorias. Funcionalidades dependentes de navegador (ex.: notificações)
            podem variar por dispositivo/OS.
          </p>
        </div>
        <div>
          <h2 className="font-semibold tracking-tight text-text">3. Conta e autenticação</h2>
          <p className="mt-1">
            O login pode ser feito com Google via Supabase Auth. Você deve manter sua conta segura e encerrar sessão em
            dispositivos compartilhados.
          </p>
        </div>
        <div>
          <h2 className="font-semibold tracking-tight text-text">4. Contato</h2>
          <p className="mt-1">Contato inicial (placeholder): contato@uselembra.com.br</p>
        </div>
      </section>
    </div>
  );
}
