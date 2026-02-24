import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@/app/globals.css";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getThemeBootScript } from "@/lib/theme";

const inter = Inter({
  subsets: ["latin"]
});

export const metadata: Metadata = {
  metadataBase: new URL("https://uselembra.com.br"),
  title: {
    default: "Lembra. — Nunca mais esqueça aniversários",
    template: "Lembra. — %s"
  },
  description: "Nunca mais esqueça um aniversário 🎉",
  openGraph: {
    siteName: "Lembra.",
    type: "website",
    locale: "pt_BR",
    url: "https://uselembra.com.br",
    title: "Lembra. — Nunca mais esqueça aniversários",
    description: "Nunca mais esqueça um aniversário 🎉"
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      }
    : undefined,
  manifest: "/manifest.json"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <script dangerouslySetInnerHTML={{ __html: getThemeBootScript() }} />
        <AuthProvider>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
