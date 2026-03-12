/**
 * Rota canônica de /login — única fonte de verdade para a URL /login.
 * Não criar outra page.tsx ou rota para /login. UI em @/components/LoginPageClient.
 */
import type { Metadata } from "next";
import { LoginPageClient } from "@/components/LoginPageClient";

export const metadata: Metadata = {
  title: "Entrar"
};

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const rawReturnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const returnTo = rawReturnTo && rawReturnTo.startsWith("/") ? rawReturnTo : "/today";

  return <LoginPageClient returnTo={returnTo} />;
}
