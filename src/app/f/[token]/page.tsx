import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { MapPin } from "lucide-react";
import { Brand } from "@/components/brand";
import { PhotoGallery } from "@/components/photo-gallery";
import { ReportMap } from "@/components/map/report-map";
import { createClient } from "@/lib/supabase/server";
import { localized } from "@/i18n/config";

type Forwarded = {
  report: {
    number: number;
    title: string | null;
    description: string;
    lat: number;
    lng: number;
    address: string | null;
    photos: string[];
    created_at: string;
  };
  forward: { message: string | null; expires_at: string };
  municipality: { name: string; slug: string; primary_color: string };
  category: { name: unknown; color: string };
  status: { name: unknown; color: string };
};

export const metadata = { robots: { index: false } };

export default async function ForwardedReportPage({ params }: PageProps<"/f/[token]">) {
  const { token } = await params;
  const t = await getTranslations("forward");
  const tr = await getTranslations("report");
  const locale = await getLocale();
  const format = await getFormatter();
  const supabase = await createClient();
  const valid = /^[0-9a-f-]{36}$/i.test(token);
  const { data } = valid ? await supabase.rpc("get_forwarded_report", { p_token: token }) : { data: null };
  const result = data as Forwarded | null;

  if (!result) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-5 text-center">
        <Brand />
        <p className="text-muted-foreground">{t("invalid")}</p>
      </main>
    );
  }

  const { report, forward, municipality, category, status } = result;
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8" style={{ "--primary": municipality.primary_color } as React.CSSProperties}>
      <Brand />
      <p className="mt-8 text-sm text-muted-foreground">{t("title", { number: report.number, municipality: municipality.name })}</p>
      <h1 className="mt-2 text-2xl font-semibold">{report.title || localized(category.name, locale)}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {localized(category.name, locale)} · {localized(status.name, locale)} ·{" "}
        {format.dateTime(new Date(report.created_at), { dateStyle: "medium" })}
      </p>
      {forward.message && (
        <blockquote className="mt-6 border-l-2 border-primary bg-muted/50 px-4 py-3 text-sm whitespace-pre-line">{forward.message}</blockquote>
      )}
      {report.photos.length > 0 && <PhotoGallery paths={report.photos} className="mt-6" />}
      <p className="mt-6 leading-relaxed whitespace-pre-line">{report.description}</p>
      <section className="mt-6 overflow-hidden rounded-xl border">
        <ReportMap
          className="h-56 w-full"
          center={[report.lat, report.lng]}
          zoom={16}
          interactive={false}
          pins={[{ id: "r", lat: report.lat, lng: report.lng, color: category.color }]}
        />
        <div className="flex items-center gap-2 p-3 text-sm">
          <MapPin className="size-4 text-muted-foreground" />
          <span className="flex-1 text-muted-foreground">{report.address || `${report.lat.toFixed(5)}, ${report.lng.toFixed(5)}`}</span>
          <a
            className="font-medium hover:underline"
            target="_blank"
            rel="noreferrer"
            href={`https://www.openstreetmap.org/?mlat=${report.lat}&mlon=${report.lng}#map=18/${report.lat}/${report.lng}`}
          >
            {tr("openInMaps")}
          </a>
        </div>
      </section>
      <p className="mt-8 text-xs text-muted-foreground">
        {t("expires", { date: format.dateTime(new Date(forward.expires_at), { dateStyle: "long" }) })}
      </p>
    </main>
  );
}
