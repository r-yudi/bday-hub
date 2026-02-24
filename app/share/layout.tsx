import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compartilhar"
};

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
