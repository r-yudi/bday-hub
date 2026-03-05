"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ManagePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/people");
  }, [router]);
  return (
    <div className="ui-container space-y-6">
      <section className="ui-section ui-panel-soft rounded-2xl border p-8">
        <p className="text-sm text-muted">Redirecionando para Pessoas...</p>
      </section>
    </div>
  );
}
