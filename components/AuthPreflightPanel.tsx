"use client";

import { useEffect, useState } from "react";
import { getAuthPreflight, type AuthPreflightResult } from "@/lib/auth-preflight";

export function AuthPreflightPanel() {
  const [result, setResult] = useState<AuthPreflightResult | null>(null);

  useEffect(() => {
    setResult(getAuthPreflight());
  }, []);

  if (result === null) {
    return (
      <section className="ui-prose-panel p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Auth redirect preflight</h2>
        <p className="mt-2 text-sm text-muted">Carregando… (disponível apenas no client.)</p>
      </section>
    );
  }

  const envLabel = {
    localhost: "localhost",
    preview: "preview",
    production: "produção",
    unknown: "outro"
  }[result.envType];

  return (
    <section className="ui-prose-panel p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Auth redirect preflight</h2>
      <p className="mt-1 text-xs text-muted">
        Valida uso de URLs canônicas e redirect. Não verifica Supabase/Google dashboard. Ver docs/AUTH_PREFLIGHT.md.
      </p>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div>
          <dt className="text-muted">origin</dt>
          <dd className="font-mono text-xs text-text">{result.origin}</dd>
        </div>
        <div>
          <dt className="text-muted">NEXT_PUBLIC_SITE_URL</dt>
          <dd className="font-mono text-xs text-text">{result.siteUrlFromEnv ?? "(não definido)"}</dd>
        </div>
        <div>
          <dt className="text-muted">redirect base (getAuthRedirectBaseUrl)</dt>
          <dd className="font-mono text-xs text-text">{result.redirectBaseUrl}</dd>
        </div>
        <div>
          <dt className="text-muted">redirectTo (exemplo)</dt>
          <dd className="font-mono text-xs break-all text-text">{result.redirectToSample}</dd>
        </div>
        <div>
          <dt className="text-muted">canonical host</dt>
          <dd className="font-mono text-xs text-text">{result.canonicalHost}</dd>
        </div>
        <div>
          <dt className="text-muted">ambiente</dt>
          <dd className="font-medium text-text">{envLabel}</dd>
        </div>
        <div>
          <dt className="text-muted">host = canônico?</dt>
          <dd className={result.hostMatchesCanonical ? "text-emerald-700 dark:text-emerald-300" : "text-muted"}>
            {result.hostMatchesCanonical ? "Sim" : "Não"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">usa SITE_URL do env?</dt>
          <dd className="font-medium text-text">{result.usingSiteUrlFromEnv ? "Sim" : "Não"}</dd>
        </div>
        <div>
          <dt className="text-muted">inconsistência?</dt>
          <dd className={result.mismatchDetected ? "text-amber-700 dark:text-amber-300 font-medium" : "text-muted"}>
            {result.mismatchDetected ? "Sim" : "Não"}
          </dd>
        </div>
      </dl>
      {result.warnings.length > 0 && (
        <ul className="mt-3 list-inside list-disc space-y-0.5 text-xs text-amber-700 dark:text-amber-300">
          {result.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">
        Este helper não altera o domínio exibido pelo Google no OAuth; o callback continua sendo o do Supabase.
      </p>
    </section>
  );
}
