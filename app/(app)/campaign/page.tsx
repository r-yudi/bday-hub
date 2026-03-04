import type { Metadata } from "next";
import { HeroLabCampaign } from "@/components/HeroLabCampaign";

export const metadata: Metadata = {
  title: "Quem se importa, aparece — Lembra.",
  description: "O Lembra te encontra no dia. Você só celebra.",
  alternates: { canonical: "/campaign" }
};

export default function CampaignPage() {
  return <HeroLabCampaign />;
}
