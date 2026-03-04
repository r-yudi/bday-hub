import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como o Lembra trata dados de login, aniversários, preferências e sessões.",
  alternates: {
    canonical: "/privacy"
  }
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="ui-page-hero p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Legal</p>
        <h1 className="ui-title-editorial mt-2 text-3xl sm:text-[2rem]">Política de Privacidade</h1>
        <p className="ui-subtitle-editorial mt-2 text-sm">Última atualização: 24 de fevereiro de 2026</p>
      </section>

      <section className="ui-prose-panel space-y-4 p-5 text-sm text-muted">
        <div>
          <h2 className="font-semibold tracking-tight text-text">1. Dados coletados</h2>
          <p className="mt-1">
            O Lembra pode tratar dados de login Google (como identificador e e-mail), aniversários cadastrados por você
            (nome, dia/mês e campos opcionais) e preferências do app, como lembretes.
          </p>
        </div>

        <div>
          <h2 className="font-semibold tracking-tight text-text">2. Onde os dados ficam</h2>
          <p className="mt-1">
            Sem login, os dados ficam no navegador/dispositivo (IndexedDB/localStorage). Com login, aniversários e
            preferências podem ser armazenados no Supabase com acesso restrito por usuário (RLS).
          </p>
        </div>

        <div>
          <h2 className="font-semibold tracking-tight text-text">3. Sessão e cookies</h2>
          <p className="mt-1">
            O login usa Supabase Auth (Google). A sessão é mantida no navegador para manter você autenticado entre
            recarregamentos.
          </p>
        </div>

        <div>
          <h2 className="font-semibold tracking-tight text-text">4. Como apagar dados</h2>
          <p className="mt-1">
            Dados locais podem ser removidos pela opção “Limpar todos os dados” dentro do app. Para remover dados da
            conta associada ao login, use as configurações da sua conta Google/Supabase ou entre em contato (placeholder:
            contato@uselembra.com.br).
          </p>
        </div>

        <div>
          <h2 className="font-semibold tracking-tight text-text">5. Compartilhamento</h2>
          <p className="mt-1">Links de compartilhamento expõem apenas nome e dia/mês (sem ano), conforme o fluxo atual do app.</p>
        </div>
      </section>
    </div>
  );
}
