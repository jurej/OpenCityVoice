import { getTranslations } from "next-intl/server";
import { getAccess, getCategories, getMunicipality } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { NotificationsForm } from "./notifications-form";

export async function generateMetadata() {
  const t = await getTranslations("notifications");
  return { title: t("title") };
}

export default async function NotificationsPage({ params }: PageProps<"/[municipality]/manage/notifications">) {
  const { municipality: slug } = await params;
  const municipality = await getMunicipality(slug);
  const access = await getAccess(municipality.id);
  const t = await getTranslations("notifications");
  const supabase = await createClient();
  const [categories, { data: member }] = await Promise.all([
    getCategories(municipality.id),
    supabase
      .from("municipality_members")
      .select("notify_category_ids, notify_comments")
      .eq("municipality_id", municipality.id)
      .eq("user_id", access.user!.id)
      .eq("status", "approved")
      .maybeSingle(),
  ]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <header>
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("intro", { municipality: municipality.name })}</p>
        </header>
        {member ? (
          <NotificationsForm
            municipalityId={municipality.id}
            categories={categories
              .filter((c) => c.is_active)
              .map((c) => ({
                id: c.id,
                name: c.name,
                icon: c.icon,
                color: c.color,
              }))}
            categoryIds={member.notify_category_ids}
            comments={member.notify_comments}
          />
        ) : (
          <p className="rounded-xl border p-4 text-sm text-muted-foreground">{t("notMember")}</p>
        )}
      </div>
    </div>
  );
}
