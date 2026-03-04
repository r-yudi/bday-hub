import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./landing.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  variable: "--font-dm-serif",
});

export const metadata: Metadata = {
  title: "Lembra — Nunca esqueça um aniversário",
  description:
    "Lembra é o jeito mais simples de acompanhar aniversários, lembrar na hora certa e enviar uma mensagem em segundos. Grátis.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`landing ${dmSans.variable} ${dmSerifDisplay.variable}`}>
      {children}
    </div>
  );
}
