import { getTranslations } from "next-intl/server";
import { getAccess, getMunicipality } from "@/lib/data";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/config";
import { TeamView } from "./team-view";

export async function generateMetadata() {
  const t = await getTranslations("team");
  return { title: t("title") };
}

export default async function TeamPage({ params }: PageProps<"/[municipality]/manage/team">) {
  const { municipality: slug } = await params;
  const municipality = await getMunicipality(slug);
  const access = await getAccess(municipality.id);
  const supabase = await createClient();
  const { data } = await supabase
    .from("municipality_members")
    .select("user_id, role, status, job_title, created_at, profiles(full_name, avatar_url)")
    .eq("municipality_id", municipality.id)
    .order("created_at");
  const rows = data ?? [];

  // E-mails are only visible to municipality admins.
  let emails = new Map<string, string>();
  if (access.isAdmin && rows.length) {
    const { data: list } = await createAdminClient().rpc("user_emails", { p_user_ids: rows.map((r) => r.user_id) });
    emails = new Map((list ?? []).map((u: { id: string; email: string }) => [u.id, u.email]));
  }

  return (
    <TeamView
      municipalityId={municipality.id}
      joinUrl={`${siteUrl}/${slug}/join`}
      isAdmin={access.isAdmin}
      currentUserId={access.user!.id}
      members={rows.map((r) => ({
        id: r.user_id,
        role: r.role,
        status: r.status,
        jobTitle: r.job_title,
        createdAt: r.created_at,
        name: r.profiles?.full_name ?? null,
        avatarUrl: r.profiles?.avatar_url ?? null,
        email: emails.get(r.user_id) ?? null,
      }))}
    />
  );
}
