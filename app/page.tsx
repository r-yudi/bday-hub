import type { Metadata } from "next";
import { LandingPageClient } from "@/components/LandingPageClient";

export const metadata: Metadata = {
  title: "Lembra. | Nunca mais esqueça aniversários",
  description: "Organize aniversários, receba lembretes e sincronize entre dispositivos ao entrar com Google.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Lembra. | Nunca mais esqueça aniversários",
    description: "Lembretes de aniversários com modo guest/local-first e sync multi-device ao fazer login.",
    url: "https://uselembra.com.br/",
    siteName: "Lembra.",
    locale: "pt_BR",
    type: "website"
  }
};

export default function HomePage() {
  return <LandingPageClient />;
}
