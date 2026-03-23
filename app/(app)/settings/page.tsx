"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ImportCsv } from "@/components/ImportCsv";
import { ThemeModeControl } from "@/components/ThemeModeControl";
import { ClearDataModal } from "@/components/settings/ClearDataModal";
import { EmailDailyCard } from "@/components/settings/EmailDailyCard";
import { NotificationCard } from "@/components/settings/NotificationCard";
import { PushCard } from "@/components/settings/PushCard";
import { clearOnboardingV2Seen } from "@/lib/onboarding-ui";
import { clearAllData } from "@/lib/storage";
import { importCsvBirthdays } from "@/lib/birthdaysRepo";
import type { BirthdayPerson } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState("");
  const [clearingData, setClearingData] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleImport(imported: BirthdayPerson[]) {
    await importCsvBirthdays(imported);
    setShowImport(false);
  }

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

  return (
    <>
      <div className="ui-container" data-page-canonical="settings">
        <section className="ui-section">
          <div className="ui-panel mx-auto w-full max-w-4xl p-6 sm:p-8">
            <header className="ui-section-header">
              <p className="ui-eyebrow">Conta e hábitos</p>
              <h1 className="ui-title-editorial text-4xl sm:text-[2.45rem]">Configurações</h1>
              <p className="ui-subtitle-editorial max-w-[72ch] text-sm sm:text-[15px]">
                Alertas, aparência e dados — no mesmo ritmo do restante do app.
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
                  <p className="mt-1 text-sm text-muted">Escolha como o Lembra chama sua atenção.</p>
                  <div className="mt-5 space-y-4">
                    <NotificationCard />
                    <EmailDailyCard />
                    <PushCard />
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
                  <p className="mt-1 text-sm text-muted">Importação em lote e limpeza local.</p>

                  <div className="ui-panel-soft mt-5 space-y-5 rounded-2xl border p-5 sm:p-6">
                    <div>
                      <h3 className="text-sm font-semibold text-text">Importar CSV</h3>
                      <p className="mt-1 text-sm text-muted">
                        Mesmo fluxo de Pessoas: prévia, validação e confirmação antes de salvar.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowImport((v) => !v)}
                        className="ui-cta-secondary mt-4 rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline-none"
                      >
                        {showImport ? "Fechar" : "Abrir importação"}
                      </button>
                      {showImport && (
                        <div className="mt-6 border-t border-border/50 pt-6">
                          <ImportCsv embedded onImport={handleImport} />
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border/50 pt-5">
                      <h3 className="text-sm font-semibold text-text">Limpar dados locais</h3>
                      <p className="mt-1 text-sm text-muted">
                        Apaga aniversários e preferências guardadas neste dispositivo. Não desfaz.
                      </p>
                      <button
                        type="button"
                        onClick={openClearModal}
                        className="ui-cta-secondary mt-4 rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline-none"
                      >
                        Limpar tudo neste aparelho
                      </button>
                      <a
                        href="/sample-birthdays.csv"
                        download
                        className="ui-link-tertiary mt-3 block text-sm font-medium"
                      >
                        Baixar CSV de exemplo
                      </a>
                    </div>
                  </div>
                </section>

                <p className="border-t border-border/50 pt-8 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      clearOnboardingV2Seen();
                      router.push("/today?onboarding=1&force=1");
                    }}
                    className="ui-link-tertiary text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    Ver introdução outra vez
                  </button>
                </p>
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
