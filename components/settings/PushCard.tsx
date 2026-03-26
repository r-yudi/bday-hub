"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getSafeBrowserSession } from "@/lib/supabase-browser";
import { getPushSettings, savePushEnabled } from "@/lib/notificationSettingsRepo";

function toBase64Url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

type PushCardProps = { variant?: "default" | "compact"; listEmpty?: boolean };

export function PushCard({ variant = "default", listEmpty = false }: PushCardProps) {
  const compact = variant === "compact";
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [pushSettings, setPushSettings] = useState<{ pushEnabled: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as { standalone?: boolean }).standalone === true
    );
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !user) return;
    void getPushSettings().then((s) => setPushSettings(s ?? { pushEnabled: false }));
  }, [mounted, user?.id]);

  async function handleSubscribeToggle() {
    if (!user || !mounted) return;
    setSaving(true);
    setError(null);
    const enabling = !(pushSettings?.pushEnabled ?? false);

    try {
      if (enabling) {
        const reg = await navigator.serviceWorker.register("/sw-push.js", { scope: "/" });
        await ("ready" in reg && reg.ready ? reg.ready : Promise.resolve(reg));
        const notifPermission = await Notification.requestPermission();
        setPermission(notifPermission);
        if (notifPermission !== "granted") {
          setError("Permissão negada. As notificações no dispositivo permanecem desativadas.");
          setSaving(false);
          return;
        }
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          setError("Serviço indisponível no momento.");
          setSaving(false);
          return;
        }
        const keyBytes = Uint8Array.from(
          atob(vapidKey.replace(/-/g, "+").replace(/_/g, "/")),
          (c) => c.charCodeAt(0)
        );
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBytes
        });
        const { session } = await getSafeBrowserSession();
        if (!session?.access_token) {
          setError("Sessão expirada. Faça login novamente.");
          setSaving(false);
          return;
        }
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            endpoint: sub.endpoint,
            keys: {
              p256dh: toBase64Url(sub.getKey("p256dh")!),
              auth: toBase64Url(sub.getKey("auth")!)
            }
          })
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(
            data.message === "endpoint-already-used"
              ? "Este dispositivo já está em uso em outra conta."
              : "Não foi possível ativar."
          );
          setSaving(false);
          return;
        }
        const next = await savePushEnabled(true);
        if (next) setPushSettings(next);
      } else {
        const { session } = await getSafeBrowserSession();
        if (session?.access_token) {
          await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
        }
        const reg = await navigator.serviceWorker.getRegistration("/");
        if (reg?.pushManager) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) await sub.unsubscribe().catch(() => {});
        }
        const next = await savePushEnabled(false);
        if (next) setPushSettings(next);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar preferência.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRequestPermissionOnly() {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPermission(p);
  }

  const titleCls = "ui-feature-title text-muted text-sm";

  if (!mounted) {
    return (
      <section className={compact ? "rounded-xl border border-border bg-surface/50 p-3" : "ui-feature-block"}>
        <h2 className={titleCls}>Notificações no dispositivo</h2>
        <p className="mt-2 text-sm text-muted">Carregando...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className={compact ? "rounded-xl border border-border bg-surface/50 p-3" : "ui-feature-block"}>
        <h2 className={titleCls}>Notificações no dispositivo</h2>
        {!compact && (
          <p className="mt-2 text-sm text-muted">
            Neste aparelho: entre na sua conta e abra o Lembra a partir da tela inicial (cada aparelho configura à parte).
          </p>
        )}
        {compact && (
          <p className="mt-1 text-xs text-muted">Neste aparelho: conta + app na tela inicial.</p>
        )}
        <Link
          href={compact ? "/login?returnTo=%2Ftoday" : "/login?returnTo=%2Fsettings"}
          className="ui-cta-secondary mt-3 inline-flex h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline-none"
        >
          Entrar com Google
        </Link>
      </section>
    );
  }

  if (!isStandalone) {
    return (
      <section className={compact ? "rounded-xl border border-border bg-surface/50 p-3" : "ui-feature-block"}>
        <h2 className={titleCls}>Notificações no dispositivo</h2>
        <p className={compact ? "mt-1 text-xs text-muted" : "mt-2 text-sm text-muted"}>
          Para receber notificações neste dispositivo, adicione o Lembra à tela inicial.
        </p>
        {listEmpty && (
          <p className={compact ? "mt-1 text-xs text-muted" : "mt-2 text-xs text-muted"}>
            Lista vazia: nada para avisar ainda; instalar aqui só prepara este aparelho.
          </p>
        )}
        <button
          type="button"
          onClick={() => setShowInstallHelp((v) => !v)}
          className="ui-cta-secondary mt-3 inline-flex h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline-none"
        >
          Como instalar
        </button>
        {showInstallHelp && (
          <div className="ui-panel-soft mt-3 rounded-xl border p-4 text-sm text-muted">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-text">iPhone ou iPad:</strong> Compartilhar → Adicionar à Tela de Início.
              </li>
              <li>
                <strong className="text-text">Android:</strong> menu do navegador → Instalar app ou Adicionar à tela inicial.
              </li>
              <li>
                <strong className="text-text">Computador:</strong> procure o ícone de instalar na barra de endereços (nem sempre existe).
              </li>
            </ul>
          </div>
        )}
      </section>
    );
  }

  if (permission === "unsupported") {
    return (
      <section className={compact ? "rounded-xl border border-border bg-surface/50 p-3" : "ui-feature-block"}>
        <h2 className={titleCls}>Notificações no dispositivo</h2>
        <p className="mt-2 text-sm text-muted">Neste aparelho ou navegador, alertas fora do app não estão disponíveis.</p>
      </section>
    );
  }

  if (permission === "denied") {
    return (
      <section className={compact ? "rounded-xl border border-border bg-surface/50 p-3" : "ui-feature-block"}>
        <h2 className={titleCls}>Notificações no dispositivo</h2>
        <p className="mt-2 text-sm text-muted">
          Alertas deste site estão bloqueados. Para mudar, use as configurações do navegador para este endereço.
        </p>
      </section>
    );
  }

  if (permission === "default") {
    return (
      <section className={compact ? "rounded-xl border border-border bg-surface/50 p-3" : "ui-feature-block"}>
        <h2 className={titleCls}>Notificações no dispositivo</h2>
        <p className={compact ? "mt-1 text-xs text-muted" : "mt-2 text-sm text-muted"}>
          Toque abaixo para o navegador perguntar; neste aparelho, o sistema pode mostrar alertas com o app fechado (quando suportado).
        </p>
        <button
          type="button"
          onClick={() => void handleRequestPermissionOnly()}
          className="ui-cta-primary mt-3 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentHover focus-visible:outline-none"
        >
          Permitir notificações
        </button>
      </section>
    );
  }

  const active = Boolean(pushSettings?.pushEnabled);

  return (
    <section className={compact ? "rounded-xl border border-border bg-surface/50 p-3" : "ui-feature-block"}>
      <h2 className={titleCls}>Notificações no dispositivo</h2>
      {active ? (
        <>
          <p className={compact ? "mt-1 text-xs text-muted" : "mt-2 text-sm text-muted"}>
            {listEmpty
              ? "Ativado neste aparelho. Com aniversários na lista, o sistema pode mostrar alertas no horário combinado — nada é enviado enquanto a lista estiver vazia."
              : "Ativado neste aparelho. Com aniversários na lista, o sistema pode mostrar alertas no horário combinado (outros aparelhos precisam ser configurados à parte)."}
          </p>
          <button
            type="button"
            onClick={() => void handleSubscribeToggle()}
            disabled={saving}
            className="ui-cta-secondary mt-3 inline-flex h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline-none"
          >
            {saving ? "Salvando..." : "Desativar notificações no dispositivo"}
          </button>
        </>
      ) : (
        <>
          <p className={compact ? "mt-1 text-xs text-muted" : "mt-2 text-sm text-muted"}>
            {listEmpty
              ? "Só neste aparelho: com datas na lista, dá para avisar fora do app. Ative quando quiser; depende do sistema."
              : "Só neste aparelho: ative para alertas fora do app no horário combinado, quando o sistema permitir."}
          </p>
          <button
            type="button"
            onClick={() => void handleSubscribeToggle()}
            disabled={saving}
            className="ui-cta-primary mt-3 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentHover focus-visible:outline-none"
          >
            {saving ? "Salvando..." : "Ativar notificações no dispositivo"}
          </button>
        </>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </section>
  );
}