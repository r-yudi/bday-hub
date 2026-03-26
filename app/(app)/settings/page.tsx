"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ThemeModeControl } from "@/components/ThemeModeControl";
import { ClearDataModal } from "@/components/settings/ClearDataModal";
import { EmailDailyCard } from "@/components/settings/EmailDailyCard";
import { NotificationCard } from "@/components/settings/NotificationCard";
import { PushCard } from "@/components/settings/PushCard";
import { listBirthdays } from "@/lib/birthdaysRepo";
import { clearOnboardingV2Seen } from "@/lib/onboarding-ui";
import { clearAllData } from "@/lib/storage";

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [listCount, setListCount] = useState<number | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState("");
  const [clearingData, setClearingData] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    void listBirthdays().then((people) => setListCount(people.length));
  }, [mounted]);

  function openClearModal() {
    setClearConfirmText("");
    setShowClearModal(true);
  }

  function closeClearModal() {
    if (clearingData) return;
    setShowClearModal(false);
    setClearConfirmText("");
  }

  async function confirmClearData() {
    if (clearConfirmText.trim().toUpperCase() !== "LIMPAR") return;
    setClearingData(true);
    try {
      await clearAllData();
      setShowClearModal(false);
      setClearConfirmText("");
    } finally {
      setClearingData(false);
    }
  }

  const displayName = user?.user_metadata?.full_name || user?.email || "Conta";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const listEmpty = listCount !== null && listCount === 0;

  return (
    <>
      <div className="ui-container" data-page-canonical="settings">
        <section className="ui-section">
          <div className="ui-panel mx-auto w-full max-w-4xl p-6 sm:p-8">
            <header className="ui-section-header">
              <p className="ui-eyebrow">Conta e hábitos</p>
              <h1 className="ui-title-editorial text-4xl sm:text-[2.45rem]">Configurações</h1>
              <p className="ui-subtitle-editorial max-w-[72ch] text-sm sm:text-[15px]">
                Veja como o Lembra te avisa no app, por email e neste aparelho. Outras preferências ficam abaixo.
              </p>
            </header>

            {!mounted ? (
              <div className="mt-10">
                <p className="text-sm text-muted">Carregando...</p>
              </div>
            ) : (
              <div className="mt-10 space-y-10">
                <section className="space-y-3" aria-label="Aparência">
                  <h2 className="text-base font-semibold tracking-tight text-text">Aparência</h2>
                  <p className="text-sm text-muted">Claro, escuro ou seguir o sistema. Vale para todo o app.</p>
                  <ThemeModeControl />
                </section>

                <section className="border-t border-border/50 pt-10" aria-label="Alertas">
                  <h2 className="text-base font-semibold tracking-tight text-text">Alertas</h2>
                  <p className="mt-1 max-w-[60ch] text-sm text-muted">
                    Ajuste o que faz sentido para você. Cada bloco tem uma ação principal.
                  </p>
                  <div className="mt-6 space-y-5 sm:space-y-6 [&_.ui-feature-block]:rounded-xl [&_.ui-feature-block]:border [&_.ui-feature-block]:border-border/50 [&_.ui-feature-block]:p-4 sm:[&_.ui-feature-block]:p-5">
                    <NotificationCard listEmpty={listEmpty} />
                    <EmailDailyCard listEmpty={listEmpty} />
                    <PushCard listEmpty={listEmpty} />
                  </div>
                </section>

                <section className="border-t border-border/50 pt-10" aria-label="Conta">
                  <h2 className="text-base font-semibold tracking-tight text-text">Conta</h2>
                  <p className="mt-1 text-sm text-muted">Sincronização entre dispositivos usa login Google.</p>
                  <div className="ui-panel-soft mt-5 rounded-2xl border p-5">
                    {user ? (
                      <div className="flex flex-wrap items-center gap-3">
                        {avatarUrl && (
                          <img
                            src={avatarUrl}
                            alt=""
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full border border-border object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-text">{displayName}</p>
                          {user.email && <p className="truncate text-sm text-muted">{user.email}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => void signOut()}
                          className="ui-cta-secondary ui-focus-surface rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline-none"
                        >
                          Sair
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-muted">
                          Você está no modo local: tudo fica neste aparelho até você entrar.
                        </p>
                        <Link
                          href="/login?returnTo=%2Fsettings"
                          className="ui-cta-primary mt-4 inline-flex h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium focus-visible:outline-none"
                        >
                          Entrar com Google
                        </Link>
                      </>
                    )}
                  </div>
                </section>

                <section className="border-t border-border/50 pt-10" aria-label="Dados">
                  <h2 className="text-base font-semibold tracking-tight text-text">Dados</h2>
                  <div className="ui-feature-block mt-5">
                    <h3 className="ui-feature-title text-muted text-sm">Limpar dados deste dispositivo</h3>
                    <p className="mt-2 text-sm text-muted">
                      Remove aniversários e preferências salvas aqui. Não pode ser desfeito.
                    </p>
                    <button
                      type="button"
                      onClick={openClearModal}
                      className="ui-focus-surface mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-danger/35 bg-danger/10 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
                    >
                      Limpar dados deste dispositivo
                    </button>
                  </div>
                </section>

                <section className="border-t border-border/30 pt-7 pb-2" aria-label="Introdução">
                  <div className="rounded-lg border border-dashed border-border/50 bg-surface/20 px-3 py-3 sm:px-4">
                    <h2 className="text-xs font-medium uppercase tracking-wide text-muted/90">Rever introdução</h2>
                    <p className="mt-1.5 text-sm text-muted">
                      Volta ao tour guiado na página Início: lista, alertas e dicas rápidas — o mesmo fluxo do primeiro uso.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        clearOnboardingV2Seen();
                        router.push("/today?onboarding=1&force=1");
                      }}
                      className="ui-link-tertiary mt-2 inline-flex text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      Abrir introdução no Início
                    </button>
                  </div>
                </section>
              </div>
            )}
          </div>
        </section>
      </div>

      <ClearDataModal
        open={showClearModal}
        value={clearConfirmText}
        loading={clearingData}
        onChange={setClearConfirmText}
        onCancel={closeClearModal}
        onConfirm={() => void confirmClearData()}
      />
    </>
  );
}
