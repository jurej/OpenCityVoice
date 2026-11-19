import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAccess, getApprovedMembers, getBoundary, getCategories, getMunicipality, getStatuses } from "@/lib/data";
import { SettingsView } from "./settings-view";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: t("title") };
}

export default async function SettingsPage({ params }: PageProps<"/[municipality]/manage/settings">) {
  const { municipality: slug } = await params;
  const municipality = await getMunicipality(slug);
  const access = await getAccess(municipality.id);
  if (!access.isAdmin) redirect(`/${slug}/manage`);
  const [categories, statuses, members, boundary] = await Promise.all([
    getCategories(municipality.id),
    getStatuses(municipality.id),
    getApprovedMembers(municipality.id),
    getBoundary(municipality.id),
  ]);
  return (
    <SettingsView
      municipality={municipality}
      categories={categories}
      statuses={statuses}
      members={members}
      boundary={boundary}
    />
  );
}
