"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { notifyModeratorsOfFlag } from "@/lib/notifications";

type Result = { ok: boolean };
type Client = Awaited<ReturnType<typeof createClient>>;

const flagSchema = z.object({
  reportId: z.uuid(),
  commentId: z.uuid().nullable(),
  reason: z.string().trim().max(500),
});

export async function flagContent(input: z.input<typeof flagSchema>): Promise<Result> {
  const parsed = flagSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { ok: false };
  const { reportId, commentId, reason } = parsed.data;
  const { error } = await supabase
    .from("content_flags")
    .insert({ report_id: reportId, comment_id: commentId, reporter_id: userId, reason: reason || null });
  // A repeated flag from the same user is not an error.
  if (error && error.code !== "23505") return { ok: false };
  if (!error) after(() => notifyModeratorsOfFlag(reportId, commentId, reason));
  return { ok: true };
}

async function staffContext(reportId: string) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return null;
  const { data: report } = await supabase
    .from("reports")
    .select("id, number, municipality_id, municipalities(slug)")
    .eq("id", reportId)
    .maybeSingle();
  if (!report?.municipalities) return null;
  const { data: isStaff } = await supabase.rpc("is_municipality_staff", { mid: report.municipality_id });
  if (!isStaff) return null;
  return { supabase, userId: claims.claims.sub, report, slug: report.municipalities.slug };
}

async function resolveFlags(supabase: Client, userId: string, reportId: string, commentId: string | null) {
  const query = supabase
    .from("content_flags")
    .update({ resolved_at: new Date().toISOString(), resolved_by: userId })
    .eq("report_id", reportId)
    .is("resolved_at", null);
  const { error } = await (commentId ? query.eq("comment_id", commentId) : query.is("comment_id", null));
  return !error;
}

function revalidate(slug: string, number: number) {
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/reports/${number}`);
  revalidatePath(`/${slug}/manage/moderation`);
}

export async function setReportHidden(reportId: string, hidden: boolean): Promise<Result> {
  const ctx = await staffContext(reportId);
  if (!ctx) return { ok: false };
  const { error } = await ctx.supabase.from("reports").update({ is_hidden: hidden }).eq("id", reportId);
  if (error) return { ok: false };
  if (hidden) await resolveFlags(ctx.supabase, ctx.userId, reportId, null);
  revalidate(ctx.slug, ctx.report.number);
  return { ok: true };
}

export async function setCommentHidden(reportId: string, commentId: string, hidden: boolean): Promise<Result> {
  const ctx = await staffContext(reportId);
  if (!ctx) return { ok: false };
  const { error } = await ctx.supabase.rpc("set_comment_hidden", { p_comment_id: commentId, p_hidden: hidden });
  if (error) return { ok: false };
  if (hidden) await resolveFlags(ctx.supabase, ctx.userId, reportId, commentId);
  revalidate(ctx.slug, ctx.report.number);
  return { ok: true };
}

export async function dismissFlags(reportId: string, commentId: string | null): Promise<Result> {
  const ctx = await staffContext(reportId);
  if (!ctx) return { ok: false };
  const ok = await resolveFlags(ctx.supabase, ctx.userId, reportId, commentId);
  revalidate(ctx.slug, ctx.report.number);
  return { ok };
}
