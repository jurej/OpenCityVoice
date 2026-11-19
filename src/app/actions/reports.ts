"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

async function requireClaims() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("Not signed in");
  return { supabase, userId: data.claims.sub };
}

export async function toggleVote(reportId: string, path: string) {
  const { supabase, userId } = await requireClaims();
  const { data: existing } = await supabase
    .from("report_votes")
    .select("report_id")
    .eq("report_id", reportId)
    .eq("user_id", userId)
    .maybeSingle();
  const { error } = existing
    ? await supabase.from("report_votes").delete().eq("report_id", reportId).eq("user_id", userId)
    : await supabase.from("report_votes").insert({ report_id: reportId, user_id: userId });
  if (error) return { ok: false as const };
  revalidatePath(path);
  return { ok: true as const, voted: !existing };
}

const commentSchema = z.object({
  reportId: z.uuid(),
  body: z.string().trim().min(1).max(2000),
});

export async function addComment(input: { reportId: string; body: string }, path: string) {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };
  const { supabase, userId } = await requireClaims();
  const { error } = await supabase
    .from("report_comments")
    .insert({ report_id: parsed.data.reportId, body: parsed.data.body, author_id: userId });
  if (error) return { ok: false as const };
  revalidatePath(path);
  return { ok: true as const };
}

export async function deleteComment(commentId: string, path: string) {
  const { supabase } = await requireClaims();
  const { error } = await supabase.from("report_comments").delete().eq("id", commentId);
  if (error) return { ok: false as const };
  revalidatePath(path);
  return { ok: true as const };
}
