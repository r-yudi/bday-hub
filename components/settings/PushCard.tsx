"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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

function swScriptLabel(reg: ServiceWorkerRegistration | null): "/sw-push.js" | "/sw.js" | "none" {
  if (!reg) return "none";
  const url = reg.installing?.scriptURL ?? reg.active?.scriptURL ?? "";
  if (!url) return "none";
  const u = url.toLowerCase();
  if (u.includes("sw-push.js")) return "/sw-push.js";
  if (u.includes("sw.js")) return "/sw.js";
  return "none";
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

type ApiSubscribeStatus = "ok" | "fail" | "not-run";
type PushRenderMode = "install" | "activate" | "active" | "failed" | "other";

type PushDebugSnapshot = {
  standalone: boolean;
  permission: string;
  swScript: "/sw-push.js" | "/sw.js" | "none";
  hasController: boolean;
  swReady: boolean;
  subBefore: boolean | null;
  subAfter: boolean | null;
  subscribeReturned: boolean | null;
  apiSubscribe: ApiSubscribeStatus;
  pushEnabledServer: boolean | null;
  mergedActive: boolean | null;
  renderMode: PushRenderMode;
};

type PushCardProps = { variant?: "default" | "compact"; listEmpty?: boolean };

function PushDebugPanel({ snap }: { snap: PushDebugSnapshot | null }) {
  const row = (label: string, value: string) => (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] leading-snug">
      <span className="text-muted">{label}</span>
      <span className="font-mono text-text">{value}</span>
    </div>
  );
  const v = (x: string | boolean | null | undefined) => {
    if (x === null || x === undefined) return "null";
    if (typeof x === "boolean") return x ? "yes" : "no";
    return String(x);
  };
  return (
    <div
      className="ui-panel-soft mt-4 rounded-xl border border-dashed border-muted/60 bg-surface/40 p-3 text-muted"
      data-testid="push-debug-panel"
    >
      <p className="text-[11px] font-medium text-muted">Debug push (temp · standalone)</p>
      <div className="mt-2 space-y-1">
        {row("standalone", v(snap?.standalone))}
        {row("permission", snap?.permission ?? "—")}
        {row("sw script", snap?.swScript ?? "—")}
        {row("has controller", v(snap?.hasController))}
        {row("service worker ready", v(snap?.swReady))}
        {row("subscription before subscribe", v(snap?.subBefore))}
        {row("subscription after subscribe", v(snap?.subAfter))}
        {row("subscribe returned subscription", v(snap?.subscribeReturned))}
        {row("api subscribe", snap?.apiSubscribe ?? "—")}
        {row("push_enabled server", v(snap?.pushEnabledServer))}
        {row("merged active", v(snap?.mergedActive))}
        {row("render mode", snap?.renderMode ?? "—")}
      </div>
    </div>
  );
}

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
  const [pushDebug, setPushDebug] = useState<PushDebugSnapshot | null>(null);
  const loggedNotStandaloneRef = useRef(false);

  const serverPushEnabledRef = useRef<boolean | null>(null);
  const debugSubBeforeRef = useRef<boolean | null>(null);
  const debugSubAfterRef = useRef<boolean | null>(null);
  const debugSubscribeReturnedRef = useRef<boolean | null>(null);
  const debugApiSubscribeRef = useRef<ApiSubscribeStatus>("not-run");
  const debugSwReadyRef = useRef(false);
  const renderModeRef = useRef<PushRenderMode>("other");
  const ctaGrantedLogRef = useRef(false);

  const readStandalone = useCallback(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true
    );
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;
    setIsStandalone(readStandalone());
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
      diagPush("push_unsupported", { reason: "Notification API missing" });
    }
  }, [mounted, readStandalone]);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    const mql = window.matchMedia("(display-mode: standalone)");
    const onChange = () => {
      const standalone = mql.matches || (navigator as { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || typeof navigator === "undefined" || !navigator.permissions?.query) return;
    let alive = true;
    let status: PermissionStatus | undefined;
    const map = (state: PermissionState): NotificationPermission | "unsupported" => {
      if (state === "prompt") return "default";
      if (state === "granted" || state === "denied") return state;
      return "default";
    };
    navigator.permissions
      .query({ name: "notifications" as PermissionName })
      .then((s) => {
        if (!alive) return;
        status = s;
        setPermission(map(s.state));
        s.onchange = () => setPermission(map(s.state));
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (status) status.onchange = null;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const standalone = readStandalone();
    if (user && !standalone && !loggedNotStandaloneRef.current) {
      loggedNotStandaloneRef.current = true;
      diagPush("push_not_standalone", {
        hint: "Device notifications require opening the app from the home screen on this device."
      });
    }
  }, [mounted, user, readStandalone]);

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

  const flushPushDebug = useCallback(
    async (opts?: { mergedOverride?: boolean | null }) => {
      if (!mounted || !isStandalone) return;
      let reg: ServiceWorkerRegistration | null = null;
      try {
        reg = await getSwPushRegistration();
      } catch {
        reg = null;
      }
      const mergedFromOpts = opts?.mergedOverride;
      const mergedActive =
        mergedFromOpts !== undefined && mergedFromOpts !== null
          ? Boolean(mergedFromOpts)
          : Boolean(pushSettings?.pushEnabled);
      const swReadyComputed =
        Boolean(reg?.active?.state === "activated" || reg?.installing) || debugSwReadyRef.current;
      setPushDebug({
        standalone: isStandalone,
        permission: typeof Notification !== "undefined" ? Notification.permission : "unsupported",
        swScript: swScriptLabel(reg),
        hasController: Boolean(navigator.serviceWorker?.controller),
        swReady: swReadyComputed,
        subBefore: debugSubBeforeRef.current,
        subAfter: debugSubAfterRef.current,
        subscribeReturned: debugSubscribeReturnedRef.current,
        apiSubscribe: debugApiSubscribeRef.current,
        pushEnabledServer: serverPushEnabledRef.current,
        mergedActive,
        renderMode: renderModeRef.current
      });
    },
    [mounted, isStandalone, pushSettings?.pushEnabled]
  );

  const reconcilePushState = useCallback(async () => {
    if (!mounted || !user) return;

    if (!isStandalone || permission !== "granted") {
      const s = await getPushSettings();
      serverPushEnabledRef.current = s?.pushEnabled ?? null;
      setPushSettings(s ?? { pushEnabled: false });
      renderModeRef.current = Boolean(s?.pushEnabled) ? "active" : "other";
      await flushPushDebug({ mergedOverride: Boolean(s?.pushEnabled) });
      return;
    }

    const server = await getPushSettings();
    serverPushEnabledRef.current = server?.pushEnabled ?? null;
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
    renderModeRef.current = merged ? "active" : "other";
    await flushPushDebug({ mergedOverride: merged });
  }, [mounted, user, isStandalone, permission, flushPushDebug]);

  useEffect(() => {
    if (!mounted || !user) return;
    void reconcilePushState();
  }, [mounted, user, permission, isStandalone, reconcilePushState]);

  useEffect(() => {
    if (!mounted || !isStandalone) return;
    if (activationFailure) renderModeRef.current = "failed";
    void flushPushDebug();
  }, [mounted, isStandalone, permission, pushSettings?.pushEnabled, activationFailure, saving, flushPushDebug]);

  useEffect(() => {
    if (!mounted || !isStandalone || permission !== "granted" || pushSettings === null) return;
    const active = Boolean(pushSettings.pushEnabled);
    if (!active && !ctaGrantedLogRef.current) {
      diagPush("push_render_cta_with_permission_granted", { mergedPushEnabled: pushSettings.pushEnabled });
      ctaGrantedLogRef.current = true;
    }
    if (active) ctaGrantedLogRef.current = false;
  }, [mounted, isStandalone, permission, pushSettings]);

  const debugPanelEl = mounted && isStandalone ? <PushDebugPanel snap={pushDebug} /> : null;

  async function handleSubscribeToggle() {
    if (!user || !mounted) return;
    setSaving(true);
    setError(null);
    setActivationFailure(false);
    const enabling = !(pushSettings?.pushEnabled ?? false);

    try {
      if (enabling) {
        debugApiSubscribeRef.current = "not-run";
        debugSubBeforeRef.current = null;
        debugSubAfterRef.current = null;
        debugSubscribeReturnedRef.current = null;
        debugSwReadyRef.current = false;
        renderModeRef.current = "activate";
        void flushPushDebug();

        if (!("serviceWorker" in navigator)) {
          diagPush("push_service_worker_unavailable", { reason: "navigator.serviceWorker missing" });
          renderModeRef.current = "failed";
          setActivationFailure(true);
          setSaving(false);
          void flushPushDebug();
          return;
        }
        if (typeof Notification === "undefined") {
          diagPush("push_unsupported", { reason: "Notification API missing at activation" });
          renderModeRef.current = "failed";
          setActivationFailure(true);
          setSaving(false);
          void flushPushDebug();
          return;
        }

        let reg: ServiceWorkerRegistration;
        const regOrNull = await getSwPushRegistration();
        if (!regOrNull) {
          diagPush("push_service_worker_register_failed", {
            message: "getSwPushRegistration returned null"
          });
          renderModeRef.current = "failed";
          setActivationFailure(true);
          setSaving(false);
          void flushPushDebug();
          return;
        }
        reg = regOrNull;
        if (reg.installing) renderModeRef.current = "install";
        diagPush("push_sw_ready", {
          activeScript: reg.active?.scriptURL ?? null,
          installingScript: reg.installing?.scriptURL ?? null,
          scope: reg.scope
        });
        void flushPushDebug();

        const notifPermission = await Notification.requestPermission();
        setPermission(notifPermission);
        if (notifPermission !== "granted") {
          diagPush("push_permission_denied", { permission: notifPermission });
          renderModeRef.current = "failed";
          setError("Permissão negada. As notificações no dispositivo permanecem desativadas.");
          setSaving(false);
          void flushPushDebug();
          return;
        }

        diagPush("push_permission_granted", {});

        await navigator.serviceWorker.ready;
        debugSwReadyRef.current = true;
        if (!navigator.serviceWorker.controller) {
          diagPush("push_sw_controller_missing", {});
        }
        void flushPushDebug();

        if (!reg.pushManager) {
          diagPush("push_unsupported", { reason: "registration.pushManager is null" });
          renderModeRef.current = "failed";
          setActivationFailure(true);
          setSaving(false);
          void flushPushDebug();
          return;
        }

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
        if (!vapidKey) {
          diagPush("push_vapid_missing", {
            envVar: "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
            hint: "Same URL-safe base64 public key as VAPID_PUBLIC_KEY on the server."
          });
          renderModeRef.current = "failed";
          setError("Serviço indisponível no momento.");
          setSaving(false);
          void flushPushDebug();
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
          renderModeRef.current = "failed";
          setError("Serviço indisponível no momento.");
          setSaving(false);
          void flushPushDebug();
          return;
        }

        let sub = await reg.pushManager.getSubscription();
        debugSubBeforeRef.current = Boolean(sub);
        void flushPushDebug();

        if (sub) {
          debugSubscribeReturnedRef.current = true;
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
            debugSubscribeReturnedRef.current = true;
            diagPush("push_subscribe_returned_subscription", {
              endpointLen: sub.endpoint?.length ?? 0
            });
          } catch (subErr) {
            debugSubscribeReturnedRef.current = false;
            diagPush("push_subscribe_failed", {
              message: subErr instanceof Error ? subErr.message : String(subErr),
              name: subErr instanceof Error ? subErr.name : "unknown"
            });
            renderModeRef.current = "failed";
            setActivationFailure(true);
            setSaving(false);
            void flushPushDebug();
            return;
          }
        }
        void flushPushDebug();

        const subVerify = await reg.pushManager.getSubscription();
        debugSubAfterRef.current = Boolean(subVerify);
        if (!subVerify) {
          diagPush("push_get_subscription_after_subscribe_null", {});
        } else {
          diagPush("push_get_subscription_after_subscribe_present", {
            sameObject: subVerify === sub,
            endpointLen: subVerify.endpoint?.length ?? 0
          });
        }
        void flushPushDebug();

        const p256dhKey = sub.getKey("p256dh");
        const authKey = sub.getKey("auth");
        if (!p256dhKey || !authKey) {
          diagPush("push_subscribe_returned_invalid_keys", {
            hasP256dh: Boolean(p256dhKey),
            hasAuth: Boolean(authKey)
          });
          renderModeRef.current = "failed";
          setActivationFailure(true);
          setSaving(false);
          void flushPushDebug();
          return;
        }

        const { session } = await getSafeBrowserSession();
        if (!session?.access_token) {
          diagPush("push_api_subscribe_failed", { phase: "session", reason: "missing_access_token" });
          debugApiSubscribeRef.current = "fail";
          renderModeRef.current = "failed";
          setError("Sessão expirada. Faça login novamente.");
          setSaving(false);
          void flushPushDebug();
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
          debugApiSubscribeRef.current = "fail";
          renderModeRef.current = "failed";
          setError(
            data.message === "endpoint-already-used"
              ? "Este dispositivo já está em uso em outra conta."
              : "Não foi possível ativar."
          );
          setSaving(false);
          void flushPushDebug();
          return;
        }

        debugApiSubscribeRef.current = "ok";
        diagPush("push_api_subscribe_ok", { httpStatus: res.status });
        setActivationFailure(false);
        setError(null);
        void flushPushDebug();

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
        debugApiSubscribeRef.current = "not-run";
        renderModeRef.current = "activate";
        void flushPushDebug();

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
        debugSubBeforeRef.current = null;
        debugSubAfterRef.current = null;
        debugSubscribeReturnedRef.current = null;
        const next = await savePushEnabled(false);
        if (next) setPushSettings(next);
        else setPushSettings({ pushEnabled: false });
        setActivationFailure(false);
        setError(null);
        diagPush("push_deactivation_complete", {});
        await reconcilePushState();
      }
    } catch (e) {
      diagPush("push_unexpected_error", {
        message: e instanceof Error ? e.message : String(e),
        enabling
      });
      renderModeRef.current = "failed";
      if (enabling) {
        setActivationFailure(true);
      } else {
        setError("Não foi possível desativar agora. Tente de novo em instantes.");
      }
      void flushPushDebug();
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
    void flushPushDebug();
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
        {debugPanelEl}
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
        {debugPanelEl}
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
        {debugPanelEl}
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
        {debugPanelEl}
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
      {debugPanelEl}
    </section>
  );
}

