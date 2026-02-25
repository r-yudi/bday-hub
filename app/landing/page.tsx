import type { Metadata } from "next";
import { LandingPremiumPageClient } from "@/components/LandingPremiumPageClient";

export const metadata: Metadata = {
  title: "Landing (DS Preview)",
  alternates: {
    canonical: "/landing"
  }
};

export default function LandingPreviewPage() {
  return <LandingPremiumPageClient />;
}
