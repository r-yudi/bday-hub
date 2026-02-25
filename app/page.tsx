import type { Metadata } from "next";
import { LandingPremiumPageClient } from "@/components/LandingPremiumPageClient";

export const metadata: Metadata = {
  title: "Nunca mais esqueça aniversários",
  description: "Organize aniversários, receba lembretes e sincronize entre dispositivos ao entrar com Google.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Lembra. — Nunca mais esqueça aniversários",
    description: "Lembretes de aniversários com modo local-first e sincronização ao entrar com Google.",
    url: "https://uselembra.com.br/",
    siteName: "Lembra.",
    locale: "pt_BR",
    type: "website"
  }
};

export default function HomePage() {
  return <LandingPremiumPageClient />;
}
