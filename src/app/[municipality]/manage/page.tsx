import { getTranslations } from "next-intl/server";
import { getAccess, getApprovedMembers, getBoundary, getCategories, getMunicipality, getReports, getStatuses } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { Dashboard } from "./dashboard";

export async function generateMetadata() {
  const t = await getTranslations("manage");
  return { title: t("dashboard") };
}

export default async function ManagePage({ params, searchParams }: PageProps<"/[municipality]/manage">) {
  const { municipality: slug } = await params;
  const { report } = await searchParams;
  const municipality = await getMunicipality(slug);
  const [categories, statuses, reports, members, boundary, access] = await Promise.all([
    getCategories(municipality.id),
    getStatuses(municipality.id),
    getReports(municipality.id, 5000),
    getApprovedMembers(municipality.id),
    getBoundary(municipality.id),
    getAccess(municipality.id),
  ]);
  const supabase = await createClient();
  const { data: recent } = await supabase.rpc("recent_vote_counts", { p_municipality_id: municipality.id, p_days: 7 });
  const recentVotes = Object.fromEntries((recent ?? []).map((r) => [r.report_id, Number(r.votes)]));

  return (
    <Dashboard
      municipality={municipality}
      categories={categories}
      statuses={statuses}
      reports={reports}
      recentVotes={recentVotes}
      members={members}
      boundary={boundary}
      currentUserId={access.user!.id}
      isAdmin={access.isAdmin}
      initialSelected={typeof report === "string" ? report : null}
    />
  );
}
