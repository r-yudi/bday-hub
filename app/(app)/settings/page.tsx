"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { clearOnboardingV2Seen } from "@/lib/onboarding-ui";
import { ImportCsv } from "@/components/ImportCsv";
import { ClearDataModal } from "@/components/settings/ClearDataModal";
import { EmailDailyCard } from "@/components/settings/EmailDailyCard";
import { NotificationCard } from "@/components/settings/NotificationCard";
import { PushCard } from "@/components/settings/PushCard";
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
      <div className="ui-container space-y-9 lg:space-y-12">
        <section className="ui-section ui-panel p-6 sm:p-8">
          <div className="ui-section-header">
            <p className="ui-eyebrow">PREFERÊNCIAS</p>
            <h1 className="ui-title-editorial text-4xl sm:text-[2.45rem]">Configurações</h1>
            <p className="ui-subtitle-editorial text-sm sm:text-[15px]">
              Ajuste como o Lembra te lembra e como seus dados ficam organizados.
            </p>
          </div>
        </section>

        {!mounted ? (
          <section className="ui-section ui-panel-soft rounded-2xl border p-8">
            <p className="text-sm text-muted">Carregando...</p>
          </section>
        ) : (
          <>
            <section className="ui-section" aria-label="Alertas">
              <h2 className="ui-section-header mb-4 text-lg font-semibold tracking-tight text-text">
                Alertas
              </h2>
              <div className="space-y-4">
                <NotificationCard />
                <EmailDailyCard />
                <PushCard />
              </div>
            </section>

            <section className="ui-section" aria-label="Conta">
              <h2 className="ui-section-header mb-4 text-lg font-semibold tracking-tight text-text">
                Conta
              </h2>
              <div className="ui-feature-block">
                {!mounted ? (
                  <p className="text-sm text-muted">Carregando...</p>
                ) : user ? (
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
                    <div className="min-w-0">
                      <p className="font-medium text-text">{displayName}</p>
                      {user.email && (
                        <p className="truncate text-sm text-muted">{user.email}</p>
                      )}
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
                    <p className="text-sm text-muted">Você está usando o app sem conta. Entre para sincronizar entre dispositivos.</p>
                    <Link
                      href="/login?returnTo=%2Fsettings"
                      className="ui-cta-primary mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentHover focus-visible:outline-none"
                    >
                      Entrar com Google
                    </Link>
                  </>
                )}
              </div>
            </section>

            <section className="ui-section" aria-label="Dados">
              <h2 className="ui-section-header mb-4 text-lg font-semibold tracking-tight text-text">
                Dados
              </h2>
              <div className="space-y-4">
                <div className="ui-feature-block">
                  <h3 className="ui-feature-title text-muted">Importar CSV</h3>
                  <p className="mt-2 text-sm leading-5 text-muted">
                    Adicione aniversários em lote a partir de um arquivo CSV.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowImport((v) => !v)}
                    className="ui-cta-secondary mt-3 rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline-none"
                  >
                    {showImport ? "Fechar" : "Abrir importação CSV"}
                  </button>
                  {showImport && (
                    <div className="mt-4">
                      <ImportCsv onImport={handleImport} />
                    </div>
                  )}
                </div>

                <div className="ui-feature-block">
                  <h3 className="ui-feature-title text-muted">Limpar dados locais</h3>
                  <p className="mt-2 text-sm leading-5 text-muted">
                    Seus aniversários ficam salvos neste dispositivo. Você pode limpar tudo (ação irreversível).
                  </p>
                  <button
                    type="button"
                    onClick={openClearModal}
                    className="ui-cta-secondary mt-3 rounded-lg border px-3 py-2 text-sm font-medium focus-visible:outline-none"
                  >
                    Limpar todos os dados
                  </button>
                  <a
                    href="/sample-birthdays.csv"
                    download
                    className="ui-focus-surface mt-3 block rounded-lg border px-3 py-2 text-center text-sm font-medium focus-visible:outline-none"
                  >
                    Baixar CSV de exemplo
                  </a>
                </div>
              </div>
            </section>

            <p className="text-center">
              <button
                type="button"
                onClick={() => {
                  clearOnboardingV2Seen();
                  router.push("/today?onboarding=1&force=1");
                }}
                className="ui-link-tertiary text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Ver tutorial novamente
              </button>
            </p>
          </>
        )}
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
