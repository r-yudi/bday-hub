import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Próximos 7 dias"
};

export default function UpcomingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
