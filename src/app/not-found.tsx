import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Brand } from "@/components/brand";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-5 text-center">
      <Brand />
      <h1 className="mt-6 text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("text")}</p>
      <Link href="/" className="text-sm font-medium underline underline-offset-4">{t("home")}</Link>
    </main>
  );
}
