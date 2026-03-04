import type { Metadata } from "next";
import { LandingPremiumPageClient } from "@/components/LandingPremiumPageClient";

/** Preview da landing (DS); a home oficial é / (app/(marketing)/page.tsx). */

export const metadata: Metadata = {
  title: "Landing (DS Preview)",
  alternates: { canonical: "/landing" },
  robots: { index: false, follow: false },
};

export default function LandingPreviewPage() {
  return <LandingPremiumPageClient />;
}
