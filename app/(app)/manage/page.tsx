"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ManagePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/people");
  }, [router]);
  return (
    <div className="ui-container" data-page-canonical="manage">
      <section className="ui-section">
        <div className="ui-panel mx-auto w-full max-w-md p-8 text-center">
          <p className="text-sm text-muted">Redirecionando para Pessoas…</p>
        </div>
      </section>
    </div>
  );
}
