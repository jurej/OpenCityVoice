import { redirect } from "next/navigation";
import { LegalLinks } from "@/components/legal-links";
import { getTranslations } from "next-intl/server";
import { Camera, MapPin, BellRing } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { singleMunicipality } from "@/lib/config";
import { MunicipalityPicker } from "./municipality-picker";

export default async function HomePage() {
  if (singleMunicipality) redirect(`/${singleMunicipality}`);
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const supabase = await createClient();
  const { data: municipalities } = await supabase
    .from("municipalities")
    .select("id, slug, name, primary_color, logo_path")
    .eq("is_active", true)
    .order("name");

  const steps = [
    { icon: Camera, title: t("steps.one"), text: t("steps.oneText") },
    { icon: MapPin, title: t("steps.two"), text: t("steps.twoText") },
    { icon: BellRing, title: t("steps.three"), text: t("steps.threeText") },
  ];

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-5 pt-12 pb-10 sm:pt-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-16">
            <div>
              <h1 className="text-4xl font-semibold text-balance sm:text-5xl">{t("title")}</h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">{t("subtitle")}</p>
              <ol className="mt-10 grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
                {steps.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card text-sm font-medium tabular-nums">
                      {i + 1}
                    </span>
                    <div>
                      <p className="flex items-center gap-2 font-medium">
                        <step.icon className="size-4 text-muted-foreground" />
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <MunicipalityPicker municipalities={municipalities ?? []} />
          </div>
        </section>
        <section className="border-t bg-muted/40">
          <div className="mx-auto max-w-5xl px-5 py-12">
            <h2 className="text-lg font-semibold">{t("forMunicipalities")}</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">{t("forMunicipalitiesText")}</p>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6 text-xs text-muted-foreground">
          <span>{tc("poweredBy")}</span>
          <div className="flex gap-4">
            <LegalLinks />
            <a href="https://github.com/jurej/OpenCityVoice" className="hover:text-foreground">GitHub</a>
          </div>
        </div>
      </footer>
    </>
  );
}
