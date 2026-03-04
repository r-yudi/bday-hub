import { AuthCallbackPageClient } from "@/components/AuthCallbackPageClient";

type AuthCallbackPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthCallbackPage({ searchParams }: AuthCallbackPageProps) {
  const params = (await searchParams) ?? {};
  const rawReturnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const returnTo = rawReturnTo && rawReturnTo.startsWith("/") ? rawReturnTo : "/today";

  return <AuthCallbackPageClient returnTo={returnTo} />;
}
