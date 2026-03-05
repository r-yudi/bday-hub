"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getSafeBrowserSession } from "@/lib/supabase-browser";
import { getPushSettings, savePushEnabled } from "@/lib/notificationSettingsRepo";

type PushState = "unsupported" | "denied" | "default" | "granted";

function toBase64Url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function PushCard() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [pushSettings, setPushSettings] = useState<{ pushEnabled: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");

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
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !user) return;
    void getPushSettings().then((s) => setPushSettings(s ?? { pushEnabled: false }));
  }, [mounted, user?.id]);

  async function handleToggle() {
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
          setError("Permissão negada. Push permanece desativado.");
          setSaving(false);
          return;
        }
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          setError("Push não configurado no servidor.");
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
              : "Falha ao ativar push."
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
      setError(e instanceof Error ? e.message : "Erro ao alterar push.");
    } finally {
      setSaving(false);
    }
  }

  const stateLabel: Record<PushState | "guest" | "no-standalone", string> = {
    unsupported: "Não suportado (navegador)",
    denied: "Permissão negada",
    default: "Permissão não solicitada",
    granted: pushSettings?.pushEnabled ? "Ativo" : "Permissão concedida (push desativado no app)",
    guest: "Disponível para contas conectadas",
    "no-standalone": "Requer PWA instalado"
  };

  return (
    <section className="ui-feature-block">
      <h2 className="ui-feature-title text-muted">Push (complementar)</h2>

      {!mounted ? (
        <p className="mt-2 text-sm text-muted">Carregando...</p>
      ) : !user ? (
        <>
          <p className="mt-2 text-sm leading-5 text-muted">
            Notificações push estão disponíveis para contas conectadas (PWA instalada).
          </p>
          <p className="mt-1 text-xs text-muted">Estado: {stateLabel.guest}</p>
          <Link
            href="/login?returnTo=%2Fsettings"
            className="ui-cta-secondary mt-3 inline-flex h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline-none"
          >
            Entrar para ativar push
          </Link>
        </>
      ) : !isStandalone ? (
        <>
          <p className="mt-2 text-sm leading-5 text-muted">
            Para ativar notificações push, instale o Lembra (PWA) na tela inicial.
          </p>
          <p className="mt-1 text-xs text-muted">Estado: {stateLabel["no-standalone"]}</p>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm leading-5 text-muted">
            Receba um lembrete no dispositivo quando houver aniversários no dia (complementar ao email).
          </p>
          <p className="mt-1 text-xs text-muted">
            Estado: {permission === "unsupported" ? stateLabel.unsupported : permission === "denied" ? stateLabel.denied : permission === "default" ? stateLabel.default : stateLabel.granted}
          </p>
          {permission === "unsupported" ? (
            <p className="mt-2 text-xs text-muted">Indisponível por enquanto neste navegador.</p>
          ) : permission === "denied" ? (
            <p className="mt-2 text-xs text-warning">Reative a permissão nas configurações do site para poder ativar push.</p>
          ) : (
            <button
              type="button"
              onClick={() => void handleToggle()}
              disabled={saving}
              className={[
                "mt-3 inline-flex h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium focus-visible:outline-none",
                pushSettings?.pushEnabled ? "ui-cta-secondary border" : "btn-primary-brand ui-cta-primary bg-accent text-white"
              ].join(" ")}
            >
              {saving ? "Salvando..." : pushSettings?.pushEnabled ? "Desativar push" : "Ativar push"}
            </button>
          )}
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        </>
      )}
    </section>
  );
}
