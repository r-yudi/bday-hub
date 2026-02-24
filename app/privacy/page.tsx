import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | Lembra.",
  description: "Como o Lembra trata dados de login, aniversários, preferências e sessões.",
  alternates: {
    canonical: "/privacy"
  }
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-3xl border border-black/10 bg-white/95 p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-black/60">Legal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black/90 sm:text-[2rem]">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-black/70">Última atualização: 24 de fevereiro de 2026</p>
      </section>

      <section className="space-y-4 rounded-2xl border border-black/10 bg-white/90 p-5 shadow-sm text-sm text-black/75">
        <div>
          <h2 className="font-semibold tracking-tight text-black/85">1. Dados coletados</h2>
          <p className="mt-1">
            O Lembra pode tratar dados de login Google (como identificador e e-mail), aniversários cadastrados por você
            (nome, dia/mês e campos opcionais) e preferências do app, como lembretes.
          </p>
        </div>

        <div>
          <h2 className="font-semibold tracking-tight text-black/85">2. Onde os dados ficam</h2>
          <p className="mt-1">
            Sem login, os dados ficam no navegador/dispositivo (IndexedDB/localStorage). Com login, aniversários e
            preferências podem ser armazenados no Supabase com acesso restrito por usuário (RLS).
          </p>
        </div>

        <div>
          <h2 className="font-semibold tracking-tight text-black/85">3. Sessão e cookies</h2>
          <p className="mt-1">
            O login usa Supabase Auth (Google). A sessão é mantida no navegador para manter você autenticado entre
            recarregamentos.
          </p>
        </div>

        <div>
          <h2 className="font-semibold tracking-tight text-black/85">4. Como apagar dados</h2>
          <p className="mt-1">
            Dados locais podem ser removidos pela opção “Limpar todos os dados” dentro do app. Para remover dados da
            conta associada ao login, use as configurações da sua conta Google/Supabase ou entre em contato (placeholder:
            contato@uselembra.com.br).
          </p>
        </div>

        <div>
          <h2 className="font-semibold tracking-tight text-black/85">5. Compartilhamento</h2>
          <p className="mt-1">
            Links de compartilhamento expõem apenas nome e dia/mês (sem ano), conforme o fluxo atual do app.
          </p>
        </div>
      </section>
    </div>
  );
}
