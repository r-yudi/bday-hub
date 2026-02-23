"use client";

import { useEffect } from "react";
import { maybeNotifyTodayBirthdays } from "@/lib/notifications";
import { TopNav } from "@/components/TopNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void maybeNotifyTodayBirthdays();
  }, []);

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-6 sm:px-6">{children}</main>
    </div>
  );
}
