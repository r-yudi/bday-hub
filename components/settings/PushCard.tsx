"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

type PushCardProps = { variant?: "default" | "compact" };

const PUSH_HOW = "Depende do navegador. No iOS, funciona melhor com o app instalado.";

export function PushCard({ variant = "default" }: PushCardProps) {
  const compact = variant === "compact";
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [pushSettings, setPushSettings] = useState<{ pushEnabled: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [showHow, setShowHow] = useState(false);
  const howTriggerRef = useRef<HTMLButtonElement>(null);
  const howPanelRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!showHow) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowHow(false); };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (howTriggerRef.current?.contains(t) || howPanelRef.current?.contains(t)) return;
      setShowHow(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer, { passive: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [showHow]);

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
    <section className={compact ? "rounded-xl border border-border bg-surface/50 p-3" : "ui-feature-block"}>
      <div className="flex items-center gap-2">
        <h2 className="ui-feature-title text-muted text-sm">Push (complementar)</h2>
        {!compact && (
          <span className="relative">
            <button
              ref={howTriggerRef}
              type="button"
              onClick={() => setShowHow((v) => !v)}
              className="ui-focus-surface flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted hover:bg-surface2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Como funciona?"
              aria-expanded={showHow}
            >
              ?
            </button>
            {showHow && (
              <div
                ref={howPanelRef}
                className="ui-panel-soft absolute left-0 top-full z-20 mt-1 min-w-[16rem] rounded-lg border p-2 text-xs shadow-lg"
                role="tooltip"
                aria-label="Como funciona?"
              >
                {PUSH_HOW}
              </div>
            )}
          </span>
        )}
      </div>

      {!mounted ? (
        <p className="mt-2 text-sm text-muted">Carregando...</p>
      ) : !user ? (
        <>
          {!compact && (
            <p className="mt-2 text-sm leading-5 text-muted">
              Notificações push estão disponíveis para contas conectadas (PWA instalada).
            </p>
          )}
          <p className={compact ? "mt-1 text-xs text-muted" : "mt-1 text-xs text-muted"}>Estado: {stateLabel.guest}</p>
          <Link
            href={compact ? "/login?returnTo=%2Ftoday" : "/login?returnTo=%2Fsettings"}
            className="ui-cta-secondary mt-3 inline-flex h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline-none"
          >
            {compact ? "Entrar com Google" : "Entrar para ativar push"}
          </Link>
        </>
      ) : !isStandalone ? (
        <>
          {!compact && (
            <p className="mt-2 text-sm leading-5 text-muted">
              Para ativar notificações push, instale o Lembra (PWA) na tela inicial.
            </p>
          )}
          <p className="mt-1 text-xs text-muted">Estado: {stateLabel["no-standalone"]}</p>
        </>
      ) : (
        <>
          {!compact && (
            <p className="mt-2 text-sm leading-5 text-muted">
              Receba um lembrete no dispositivo quando houver aniversários no dia (complementar ao email).
            </p>
          )}
          <p className="mt-1 text-xs text-muted">
            Estado: {permission === "unsupported" ? stateLabel.unsupported : permission === "denied" ? stateLabel.denied : permission === "default" ? stateLabel.default : stateLabel.granted}
          </p>
          {permission === "unsupported" ? (
            !compact && <p className="mt-2 text-xs text-muted">Indisponível por enquanto neste navegador.</p>
          ) : permission === "denied" ? (
            !compact && <p className="mt-2 text-xs text-warning">Reative a permissão nas configurações do site para poder ativar push.</p>
          ) : (
            <button
              type="button"
              onClick={() => void handleToggle()}
              disabled={saving}
              className={[
                "mt-3 inline-flex h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium focus-visible:outline-none",
                pushSettings?.pushEnabled ? "ui-cta-secondary border" : "ui-cta-primary bg-accent text-white"
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
