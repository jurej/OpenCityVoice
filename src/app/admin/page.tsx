import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { AdminView } from "./admin-view";

export async function generateMetadata() {
  const t = await getTranslations("admin");
  return { title: t("title") };
}

export default async function AdminPage() {
  const user = await requireUser("/admin");
  if (!user.profile.is_platform_admin) notFound();
  const supabase = await createClient();
  const [{ data: municipalities }, { data: reports }, { data: statuses }] = await Promise.all([
    supabase.from("municipalities").select("id, slug, name, is_active, is_official, primary_color, boundary").order("name"),
    supabase.from("reports").select("municipality_id, status_id"),
    supabase.from("statuses").select("id, is_closed"),
  ]);
  const closed = new Set((statuses ?? []).filter((s) => s.is_closed).map((s) => s.id));
  const rows = (municipalities ?? []).map((m) => {
    const own = (reports ?? []).filter((r) => r.municipality_id === m.id);
    return {
      id: m.id,
      slug: m.slug,
      name: m.name,
      isActive: m.is_active,
      isOfficial: m.is_official,
      color: m.primary_color,
      hasBoundary: Boolean(m.boundary),
      reports: own.length,
      open: own.filter((r) => !closed.has(r.status_id)).length,
    };
  });
  return (
    <>
      <SiteHeader next="/admin" />
      <AdminView municipalities={rows} />
    </>
  );
}
