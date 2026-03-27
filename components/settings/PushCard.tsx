"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getSafeBrowserSession } from "@/lib/supabase-browser";
import { getPushSettings, savePushEnabled } from "@/lib/notificationSettingsRepo";

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function diagPush(code: string, extra?: Record<string, unknown>) {
  if (typeof console !== "undefined" && console.warn) {
    console.warn("[lembra:push]", code, extra ?? {});
  }
}

/**
 * Registration for Web Push must be sw-push.js. next-pwa registers /sw.js for the same scope "/",
 * so getRegistration("/") often returns the PWA worker — getSubscription() there stays null even
 * after a successful subscribe() on sw-push.js (iOS standalone included).
 */
async function getSwPushRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw-push.js", { scope: "/" });
    await ("ready" in reg && reg.ready ? reg.ready : Promise.resolve(reg));
    return reg;
  } catch {
    return null;
  }
}

/** True when sw-push.js has a usable push subscription (endpoint + keys). */
async function probeLocalPushSubscription(): Promise<boolean> {
  const reg = await getSwPushRegistration();
  if (!reg?.pushManager) return false;
  const sub = await reg.pushManager.getSubscription();
  if (!sub?.endpoint) return false;
  return Boolean(sub.getKey("p256dh") && sub.getKey("auth"));
}

type PushCardProps = { variant?: "default" | "compact"; listEmpty?: boolean };

export function PushCard({ variant = "default", listEmpty = false }: PushCardProps) {
  const compact = variant === "compact";
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [pushSettings, setPushSettings] = useState<{ pushEnabled: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activationFailure, setActivationFailure] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const loggedNotStandaloneRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
      diagPush("push_unsupported", { reason: "Notification API missing" });
    }
    if (user && !standalone && !loggedNotStandaloneRef.current) {
      loggedNotStandaloneRef.current = true;
      diagPush("push_not_standalone", {
        hint: "Device notifications require opening the app from the home screen on this device."
      });
    }
  }, [mounted, user]);

  useEffect(() => {
    if (!mounted || !user || !isStandalone || permission !== "granted") return;
    const k = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
    if (!k) {
      diagPush("push_vapid_missing", {
        envVar: "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
        hint: "Must match server VAPID_PUBLIC_KEY; set on Vercel and redeploy so the client bundle includes it."
      });
    }
  }, [mounted, user, isStandalone, permission]);

  const reconcilePushState = useCallback(async () => {
    if (!mounted || !user) return;

    if (!isStandalone || permission !== "granted") {
      const s = await getPushSettings();
      setPushSettings(s ?? { pushEnabled: false });
      return;
    }

    const server = await getPushSettings();
    const local = await probeLocalPushSubscription();
    const serverOn = Boolean(server?.pushEnabled);
    const merged = serverOn || local;

    if (!serverOn && local) {
      diagPush("push_subscription_exists_flag_false", { serverOn, local });
    }

    setPushSettings((prev) => {
      const prevOn = Boolean(prev?.pushEnabled);
      if (prevOn && !merged) {
        diagPush("push_state_reverted_after_refetch", { serverOn, local });
      }
      if (merged) {
        if (!serverOn && local) {
          diagPush("push_render_active_with_local_subscription", {});
        }
      } else {
        diagPush("push_render_inactive_no_subscription", { serverOn, local });
      }
      return { pushEnabled: merged };
    });
  }, [mounted, user, isStandalone, permission]);

  useEffect(() => {
    if (!mounted || !user) return;
    void reconcilePushState();
  }, [mounted, user, permission, isStandalone, reconcilePushState]);

  const ctaGrantedLogRef = useRef(false);
  useEffect(() => {
    if (!mounted || !isStandalone || permission !== "granted" || pushSettings === null) return;
    const active = Boolean(pushSettings.pushEnabled);
    if (!active && !ctaGrantedLogRef.current) {
      diagPush("push_render_cta_with_permission_granted", { mergedPushEnabled: pushSettings.pushEnabled });
      ctaGrantedLogRef.current = true;
    }
    if (active) ctaGrantedLogRef.current = false;
  }, [mounted, isStandalone, permission, pushSettings]);

  async function handleSubscribeToggle() {
    if (!user || !mounted) return;
    setSaving(true);
    setError(null);
    setActivationFailure(false);
    const enabling = !(pushSettings?.pushEnabled ?? false);

    try {
      if (enabling) {
        if (!("serviceWorker" in navigator)) {
          diagPush("push_service_worker_unavailable", { reason: "navigator.serviceWorker missing" });
          setActivationFailure(true);
          setSaving(false);
          return;
        }
        if (typeof Notification === "undefined") {
          diagPush("push_unsupported", { reason: "Notification API missing at activation" });
          setActivationFailure(true);
          setSaving(false);
          return;
        }

        let reg: ServiceWorkerRegistration;
        const regOrNull = await getSwPushRegistration();
        if (!regOrNull) {
          diagPush("push_service_worker_register_failed", {
            message: "getSwPushRegistration returned null"
          });
          setActivationFailure(true);
          setSaving(false);
          return;
        }
        reg = regOrNull;
        diagPush("push_sw_ready", {
          activeScript: reg.active?.scriptURL ?? null,
          installingScript: reg.installing?.scriptURL ?? null,
          scope: reg.scope
        });

        const notifPermission = await Notification.requestPermission();
        setPermission(notifPermission);
        if (notifPermission !== "granted") {
          diagPush("push_permission_denied", { permission: notifPermission });
          setError("Permissão negada. As notificações no dispositivo permanecem desativadas.");
          setSaving(false);
          return;
        }

        diagPush("push_permission_granted", {});

        await navigator.serviceWorker.ready;
        if (!navigator.serviceWorker.controller) {
          diagPush("push_sw_controller_missing", {});
        }

        if (!reg.pushManager) {
          diagPush("push_unsupported", { reason: "registration.pushManager is null" });
          setActivationFailure(true);
          setSaving(false);
          return;
        }

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
        if (!vapidKey) {
          diagPush("push_vapid_missing", {
            envVar: "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
            hint: "Same URL-safe base64 public key as VAPID_PUBLIC_KEY on the server."
          });
          setError("Serviço indisponível no momento.");
          setSaving(false);
          return;
        }

        let keyBytes: Uint8Array;
        try {
          keyBytes = Uint8Array.from(
            atob(vapidKey.replace(/-/g, "+").replace(/_/g, "/")),
            (c) => c.charCodeAt(0)
          );
        } catch (decodeErr) {
          diagPush("push_vapid_invalid", {
            phase: "base64_decode",
            message: decodeErr instanceof Error ? decodeErr.message : String(decodeErr)
          });
          setError("Serviço indisponível no momento.");
          setSaving(false);
          return;
        }

        let sub = await reg.pushManager.getSubscription();
        if (sub) {
          diagPush("push_activation_existing_subscription_detected", {
            note: "Reusing browser subscription; syncing server + push_enabled."
          });
        } else {
          diagPush("push_get_subscription_before_subscribe_null", {});
          try {
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: new Uint8Array(keyBytes)
            });
            diagPush("push_subscribe_returned_subscription", {
              endpointLen: sub.endpoint?.length ?? 0
            });
          } catch (subErr) {
            diagPush("push_subscribe_failed", {
              message: subErr instanceof Error ? subErr.message : String(subErr),
              name: subErr instanceof Error ? subErr.name : "unknown"
            });
            setActivationFailure(true);
            setSaving(false);
            return;
          }
        }

        const subVerify = await reg.pushManager.getSubscription();
        if (!subVerify) {
          diagPush("push_get_subscription_after_subscribe_null", {});
        } else {
          diagPush("push_get_subscription_after_subscribe_present", {
            sameObject: subVerify === sub,
            endpointLen: subVerify.endpoint?.length ?? 0
          });
        }

        const p256dhKey = sub.getKey("p256dh");
        const authKey = sub.getKey("auth");
        if (!p256dhKey || !authKey) {
          diagPush("push_subscribe_returned_invalid_keys", {
            hasP256dh: Boolean(p256dhKey),
            hasAuth: Boolean(authKey)
          });
          setActivationFailure(true);
          setSaving(false);
          return;
        }

        const { session } = await getSafeBrowserSession();
        if (!session?.access_token) {
          diagPush("push_api_subscribe_failed", { phase: "session", reason: "missing_access_token" });
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
              p256dh: toBase64Url(p256dhKey),
              auth: toBase64Url(authKey)
            }
          })
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { message?: string };
          diagPush("push_api_subscribe_failed", {
            httpStatus: res.status,
            message: data.message ?? null
          });
          setError(
            data.message === "endpoint-already-used"
              ? "Este dispositivo já está em uso em outra conta."
              : "Não foi possível ativar."
          );
          setSaving(false);
          return;
        }

        diagPush("push_api_subscribe_ok", { httpStatus: res.status });
        setActivationFailure(false);
        setError(null);

        const persisted = await savePushEnabled(true);
        if (persisted) {
          diagPush("push_activation_push_enabled_refreshed", { source: "savePushEnabled" });
        } else {
          diagPush("push_activation_push_enabled_upsert_failed", {
            note: "API persisted subscription; upsert push_enabled failed — reconciling from subscription + refetch."
          });
        }

        await reconcilePushState();
        diagPush("push_activation_complete", { note: "Reconciled after API subscribe + push_enabled upsert attempt." });
      } else {
        const { session } = await getSafeBrowserSession();
        if (session?.access_token) {
          await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
        }
        const regDeactivate = await getSwPushRegistration();
        if (regDeactivate?.pushManager) {
          const sub = await regDeactivate.pushManager.getSubscription();
          if (sub) await sub.unsubscribe().catch(() => {});
        }
        const next = await savePushEnabled(false);
        if (next) setPushSettings(next);
        else setPushSettings({ pushEnabled: false });
        setActivationFailure(false);
        setError(null);
        diagPush("push_deactivation_complete", {});
      }
    } catch (e) {
      diagPush("push_unexpected_error", {
        message: e instanceof Error ? e.message : String(e),
        enabling
      });
      if (enabling) {
        setActivationFailure(true);
      } else {
        setError("Não foi possível desativar agora. Tente de novo em instantes.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRequestPermissionOnly() {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p !== "granted") {
      diagPush("push_permission_denied", { permission: p, context: "request_only" });
    }
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
        {compact && <p className="mt-1 text-xs text-muted">Neste aparelho: conta + app na tela inicial.</p>}
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
      {activationFailure && (
        <div className={compact ? "mt-2 space-y-1" : "mt-3 space-y-1.5"}>
          <p className={compact ? "text-xs text-text" : "text-sm text-text"}>
            Não foi possível ativar as notificações neste aparelho agora.
          </p>
          <p className="text-xs leading-relaxed text-muted">
            Tente novamente em instantes. Se continuar, use email ou lembretes no app.
          </p>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </section>
  );
}