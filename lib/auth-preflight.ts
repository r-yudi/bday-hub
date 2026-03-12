import { getAuthRedirectBaseUrl } from "@/lib/supabase-browser";

/** Canonical production host for Lembra (used only for comparison in preflight). */
const CANONICAL_PRODUCTION_HOST = "uselembra.com.br";

export type AuthPreflightResult = {
  origin: string;
  siteUrlFromEnv: string | null;
  redirectBaseUrl: string;
  canonicalHost: string;
  envType: "localhost" | "preview" | "production" | "unknown";
  redirectToSample: string;
  hostMatchesCanonical: boolean;
  usingSiteUrlFromEnv: boolean;
  mismatchDetected: boolean;
  localhostLeakRisk: boolean;
  warnings: string[];
};

function getCanonicalHost(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (raw && raw.startsWith("http")) {
    try {
      return new URL(raw.replace(/\/+$/, "")).hostname;
    } catch {
      // fallback
    }
  }
  return CANONICAL_PRODUCTION_HOST;
}

function getEnvType(origin: string, canonicalHost: string): AuthPreflightResult["envType"] {
  try {
    const host = new URL(origin).hostname;
    if (host === "localhost" || host === "127.0.0.1") return "localhost";
    if (host.endsWith(".vercel.app") || host.includes("vercel.app")) return "preview";
    if (host === canonicalHost) return "production";
    return "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Lightweight auth preflight: inspects client-side redirect assumptions.
 * Only uses client-safe env (NEXT_PUBLIC_*). Call from browser only.
 * Does not verify Supabase/Google dashboard settings or OAuth consent domain.
 */
export function getAuthPreflight(): AuthPreflightResult | null {
  if (typeof window === "undefined") return null;

  const origin = window.location.origin;
  const siteUrlFromEnv = process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "")
    : null;
  const redirectBaseUrl = getAuthRedirectBaseUrl();
  const canonicalHost = getCanonicalHost();
  const envType = getEnvType(origin, canonicalHost);
  const redirectToSample = `${redirectBaseUrl}/auth/callback?returnTo=${encodeURIComponent("/today")}`;

  const originHost = (() => {
    try {
      return new URL(origin).hostname;
    } catch {
      return "";
    }
  })();
  const redirectHost = (() => {
    try {
      return new URL(redirectBaseUrl).hostname;
    } catch {
      return "";
    }
  })();

  const hostMatchesCanonical = originHost === canonicalHost;
  const usingSiteUrlFromEnv = Boolean(siteUrlFromEnv && siteUrlFromEnv.startsWith("http"));

  const warnings: string[] = [];

  const productionOriginButRedirectDifferent =
    envType === "production" && redirectHost !== canonicalHost;
  if (productionOriginButRedirectDifferent) {
    warnings.push("Produção mas redirect base difere do host canônico (verifique NEXT_PUBLIC_SITE_URL).");
  }

  const productionExpectedNoSiteUrl =
    envType === "production" && !usingSiteUrlFromEnv;
  if (productionExpectedNoSiteUrl) {
    warnings.push("Produção sem NEXT_PUBLIC_SITE_URL; redirect usa origin (OK se único domínio).");
  }

  const localhostLeakRisk =
    (envType === "production" || envType === "unknown") &&
    (redirectBaseUrl.includes("localhost") || redirectHost === "127.0.0.1");
  if (localhostLeakRisk) {
    warnings.push("Risco: redirect aponta para localhost em contexto não-local.");
  }

  const mismatchDetected =
    productionOriginButRedirectDifferent || localhostLeakRisk;

  return {
    origin,
    siteUrlFromEnv,
    redirectBaseUrl,
    canonicalHost,
    envType,
    redirectToSample,
    hostMatchesCanonical,
    usingSiteUrlFromEnv,
    mismatchDetected,
    localhostLeakRisk,
    warnings
  };
}
