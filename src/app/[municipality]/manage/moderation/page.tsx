import { getTranslations } from "next-intl/server";
import { getMunicipality } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { ModerationView, type FlagGroup, type HiddenItem } from "./moderation-view";

export async function generateMetadata() {
  const t = await getTranslations("moderation");
  return { title: t("title") };
}

export default async function ModerationPage({ params }: PageProps<"/[municipality]/manage/moderation">) {
  const { municipality: slug } = await params;
  const municipality = await getMunicipality(slug);
  const t = await getTranslations("moderation");
  const supabase = await createClient();

  const [{ data: flags }, { data: hiddenReports }, { data: hiddenComments }] = await Promise.all([
    supabase
      .from("content_flags")
      .select(
        "id, reason, created_at, comment_id, report:reports!inner(id, number, title, description, is_hidden, municipality_id), comment:report_comments(body, is_hidden), reporter:profiles!content_flags_reporter_id_fkey(full_name)",
      )
      .eq("report.municipality_id", municipality.id)
      .is("resolved_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("reports")
      .select("id, number, title, description")
      .eq("municipality_id", municipality.id)
      .eq("is_hidden", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("report_comments")
      .select("id, body, report:reports!inner(id, number, municipality_id)")
      .eq("report.municipality_id", municipality.id)
      .eq("is_hidden", true)
      .order("created_at", { ascending: false }),
  ]);

  const groups = new Map<string, FlagGroup>();
  for (const flag of flags ?? []) {
    const key = `${flag.report.id}:${flag.comment_id ?? ""}`;
    const group = groups.get(key) ?? {
      key,
      reportId: flag.report.id,
      reportNumber: flag.report.number,
      commentId: flag.comment_id,
      text: flag.comment ? flag.comment.body : flag.report.title || flag.report.description,
      isHidden: flag.comment ? flag.comment.is_hidden : flag.report.is_hidden,
      flags: [],
    };
    group.flags.push({ id: flag.id, reason: flag.reason, createdAt: flag.created_at, reporter: flag.reporter?.full_name ?? null });
    groups.set(key, group);
  }

  const hidden: HiddenItem[] = [
    ...(hiddenReports ?? []).map((r) => ({
      key: r.id,
      reportId: r.id,
      reportNumber: r.number,
      commentId: null,
      text: r.title || r.description,
    })),
    ...(hiddenComments ?? []).map((c) => ({
      key: c.id,
      reportId: c.report.id,
      reportNumber: c.report.number,
      commentId: c.id,
      text: c.body,
    })),
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <header>
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
        </header>
        <ModerationView slug={slug} groups={[...groups.values()]} hidden={hidden} />
      </div>
    </div>
  );
}
