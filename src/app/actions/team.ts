"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/config";
import type { MemberRole } from "@/lib/types";

type Result = { ok: true } | { ok: false; error?: string };

async function adminContext(municipalityId: string) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return null;
  const { data: isAdmin } = await supabase.rpc("is_municipality_admin", { mid: municipalityId });
  if (!isAdmin) return null;
  const { data: municipality } = await supabase
    .from("municipalities")
    .select("slug, name, primary_color")
    .eq("id", municipalityId)
    .single();
  if (!municipality) return null;
  return { supabase, userId: claims.claims.sub, municipality };
}

export async function requestAccess(municipalityId: string, jobTitle: string): Promise<Result> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return { ok: false };
  const { error } = await supabase.from("municipality_members").insert({
    municipality_id: municipalityId,
    user_id: claims.claims.sub,
    role: "staff",
    status: "pending",
    job_title: jobTitle.trim().slice(0, 120) || null,
  });
  if (error) return { ok: false };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setMemberStatus(
  municipalityId: string,
  userId: string,
  status: "approved" | "rejected",
): Promise<Result> {
  const ctx = await adminContext(municipalityId);
  if (!ctx) return { ok: false };
  const { error } = await ctx.supabase
    .from("municipality_members")
    .update({ status })
    .eq("municipality_id", municipalityId)
    .eq("user_id", userId);
  if (error) return { ok: false };

  if (status === "approved") {
    const admin = createAdminClient();
    const [{ data: user }, { data: profile }] = await Promise.all([
      admin.auth.admin.getUserById(userId),
      admin.from("profiles").select("locale").eq("id", userId).single(),
    ]);
    if (user?.user?.email) {
      const t = await getTranslations({ locale: profile?.locale ?? "en", namespace: "email" });
      await sendEmail({
        to: user.user.email,
        subject: t("memberApprovedSubject", { municipality: ctx.municipality.name }),
        paragraphs: [t("memberApprovedIntro", { municipality: ctx.municipality.name })],
        action: { label: t("openDashboard"), url: `${siteUrl}/${ctx.municipality.slug}/manage` },
        accentColor: ctx.municipality.primary_color,
      });
    }
  }
  revalidatePath(`/${ctx.municipality.slug}/manage/team`);
  return { ok: true };
}

export async function setMemberRole(municipalityId: string, userId: string, role: MemberRole): Promise<Result> {
  const ctx = await adminContext(municipalityId);
  if (!ctx || userId === ctx.userId) return { ok: false };
  const { error } = await ctx.supabase
    .from("municipality_members")
    .update({ role })
    .eq("municipality_id", municipalityId)
    .eq("user_id", userId);
  if (error) return { ok: false };
  revalidatePath(`/${ctx.municipality.slug}/manage/team`);
  return { ok: true };
}

export async function removeMember(municipalityId: string, userId: string): Promise<Result> {
  const ctx = await adminContext(municipalityId);
  if (!ctx || userId === ctx.userId) return { ok: false };
  const { error } = await ctx.supabase
    .from("municipality_members")
    .delete()
    .eq("municipality_id", municipalityId)
    .eq("user_id", userId);
  if (error) return { ok: false };
  revalidatePath(`/${ctx.municipality.slug}/manage/team`);
  return { ok: true };
}

export async function addMemberByEmail(municipalityId: string, email: string, role: MemberRole): Promise<Result> {
  const parsed = z.email().safeParse(email.trim());
  if (!parsed.success) return { ok: false, error: "invalid" };
  const ctx = await adminContext(municipalityId);
  if (!ctx) return { ok: false };
  const { data: userId } = await createAdminClient().rpc("user_id_by_email", { p_email: parsed.data });
  if (!userId) return { ok: false, error: "notFound" };
  const { error } = await ctx.supabase
    .from("municipality_members")
    .upsert({ municipality_id: municipalityId, user_id: userId as string, role, status: "approved" });
  if (error) return { ok: false };
  revalidatePath(`/${ctx.municipality.slug}/manage/team`);
  return { ok: true };
}
