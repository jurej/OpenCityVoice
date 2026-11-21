import { getLocale, getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { LegalLinks } from "@/components/legal-links";
import { legalDocuments, LEGAL_UPDATED } from "@/content/legal";
import { isLocale } from "@/i18n/config";
import { siteUrl } from "@/lib/config";

function operatorEmail() {
  if (process.env.OPERATOR_EMAIL) return process.env.OPERATOR_EMAIL;
  const from = process.env.EMAIL_FROM ?? "";
  return from.match(/<([^>]+)>/)?.[1] ?? from;
}

export async function LegalDocument({ kind, path }: { kind: "privacy" | "terms"; path: string }) {
  const locale = await getLocale();
  const t = await getTranslations("legal");
  const doc = legalDocuments[kind][isLocale(locale) ? locale : "en"];
  const vars: Record<string, string> = {
    operator: process.env.OPERATOR_NAME || "OpenCityVoice",
    email: operatorEmail(),
    site: new URL(siteUrl).host,
  };
  const fill = (text: string) => text.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);

  return (
    <>
      <SiteHeader next={path} />
      <main className="mx-auto w-full max-w-2xl px-5 pt-8 pb-16">
        <h1 className="text-2xl font-semibold">{doc.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("updated", { date: LEGAL_UPDATED })}</p>
        <div className="mt-8 space-y-8">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-semibold">{section.heading}</h2>
              <div className="mt-2 space-y-3 text-sm leading-relaxed text-foreground/85">
                {section.body.map((paragraph) =>
                  paragraph.startsWith("- ") ? (
                    <ul key={paragraph} className="list-disc space-y-1 pl-5">
                      {paragraph.split("\n").map((item) => (
                        <li key={item}>{fill(item.replace(/^- /, ""))}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={paragraph}>{fill(paragraph)}</p>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
        <LegalLinks className="mt-12 border-t pt-6" />
      </main>
    </>
  );
}
