import "server-only";
import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/server";
import { emailBrand, sendEmail } from "@/lib/email";
import { localized } from "@/i18n/config";
import { siteUrl } from "@/lib/config";

async function recipient(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
) {
  const [{ data: user }, { data: profile }] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from("profiles").select("locale").eq("id", userId).single(),
  ]);
  const email = user?.user?.email;
  return email ? { email, locale: profile?.locale ?? "en" } : null;
}

/** E-mails staff members who follow the report's category. */
export async function notifyStaffOfNewReport(reportId: string) {
  const admin = createAdminClient();
  const { data: report } = await admin
    .from("reports")
    .select(
      "id, number, title, description, author_id, category_id, municipality_id, categories(name), municipalities(slug, name, primary_color, logo_path)",
    )
    .eq("id", reportId)
    .single();
  if (!report?.municipalities) return;
  const { data: members } = await admin
    .from("municipality_members")
    .select("user_id")
    .eq("municipality_id", report.municipality_id)
    .eq("status", "approved")
    .contains("notify_category_ids", [report.category_id])
    .neq("user_id", report.author_id);

  const municipality = report.municipalities;
  await Promise.all(
    (members ?? []).map(async ({ user_id }) => {
      const to = await recipient(admin, user_id);
      if (!to) return;
      const t = await getTranslations({
        locale: to.locale,
        namespace: "email",
      });
      const category = localized(report.categories?.name, to.locale);
      await sendEmail({
        to: to.email,
        subject: t("newReportSubject", {
          municipality: municipality.name,
          number: report.number,
          category,
        }),
        paragraphs: [
          t("newReportIntro", {
            category,
            title: report.title || report.description.slice(0, 80),
          }),
        ],
        quote: { label: t("newReportDescription"), text: report.description },
        action: {
          label: t("openDashboard"),
          url: `${siteUrl}/${municipality.slug}/manage?report=${report.id}`,
        },
        footer: t("staffFooter", {
          url: `${siteUrl}/${municipality.slug}/manage/notifications`,
        }),
        accentColor: municipality.primary_color,
        brand: emailBrand(municipality),
      });
    }),
  );
}

/** E-mails the assignee of a report about a new comment, unless they wrote it or opted out. */
export async function notifyAssigneeOfComment(
  reportId: string,
  commenterId: string,
  body: string,
) {
  const admin = createAdminClient();
  const { data: report } = await admin
    .from("reports")
    .select(
      "id, number, title, description, assignee_id, municipality_id, municipalities(slug, name, primary_color, logo_path)",
    )
    .eq("id", reportId)
    .single();
  if (
    !report?.assignee_id ||
    report.assignee_id === commenterId ||
    !report.municipalities
  )
    return;

  const [{ data: member }, { data: commenter }] = await Promise.all([
    admin
      .from("municipality_members")
      .select("notify_comments")
      .eq("municipality_id", report.municipality_id)
      .eq("user_id", report.assignee_id)
      .eq("status", "approved")
      .maybeSingle(),
    admin.from("profiles").select("full_name").eq("id", commenterId).single(),
  ]);
  if (!member?.notify_comments) return;
  const to = await recipient(admin, report.assignee_id);
  if (!to) return;

  const t = await getTranslations({ locale: to.locale, namespace: "email" });
  const municipality = report.municipalities;
  await sendEmail({
    to: to.email,
    subject: t("commentSubject", {
      municipality: municipality.name,
      number: report.number,
    }),
    paragraphs: [
      t("commentIntro", {
        name: commenter?.full_name || t("someone"),
        number: report.number,
        title: report.title || report.description.slice(0, 80),
      }),
    ],
    quote: { label: t("commentLabel"), text: body },
    action: {
      label: t("viewReport"),
      url: `${siteUrl}/${municipality.slug}/reports/${report.number}`,
    },
    footer: t("staffFooter", {
      url: `${siteUrl}/${municipality.slug}/manage/notifications`,
    }),
    accentColor: municipality.primary_color,
    brand: emailBrand(municipality),
  });
}
