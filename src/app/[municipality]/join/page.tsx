import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getMembership, getMunicipality, requireUser } from "@/lib/data";
import { JoinForm } from "./join-form";

export default async function JoinPage({ params }: PageProps<"/[municipality]/join">) {
  const { municipality: slug } = await params;
  await requireUser(`/${slug}/join`);
  const municipality = await getMunicipality(slug);
  const membership = await getMembership(municipality.id);
  const t = await getTranslations("join");

  return (
    <div style={{ "--primary": municipality.primary_color } as React.CSSProperties}>
      <SiteHeader municipality={municipality} next={`/${slug}/join`} />
      <main className="mx-auto max-w-md px-5 py-12">
        <h1 className="text-2xl font-semibold text-balance">{t("title", { municipality: municipality.name })}</h1>
        <p className="mt-3 text-muted-foreground">{t("text")}</p>
        <div className="mt-8">
          {!membership && <JoinForm municipalityId={municipality.id} />}
          {membership?.status === "pending" && <p className="rounded-lg border bg-muted/50 p-4 text-sm">{t("pending")}</p>}
          {membership?.status === "rejected" && <p className="rounded-lg border bg-muted/50 p-4 text-sm">{t("rejected")}</p>}
          {membership?.status === "approved" && (
            <div className="space-y-4">
              <p className="text-sm">{t("approved")}</p>
              <Button render={<Link href={`/${slug}/manage`} />} nativeButton={false}>
                {t("goToDashboard")}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
