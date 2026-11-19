import { getTranslations } from "next-intl/server";
import { getBoundary, getCategories, getMunicipality, requireUser } from "@/lib/data";
import { NewReportWizard } from "./wizard";

export async function generateMetadata() {
  const t = await getTranslations("newReport");
  return { title: t("title") };
}

export default async function NewReportPage({ params }: PageProps<"/[municipality]/new">) {
  const { municipality: slug } = await params;
  const user = await requireUser(`/${slug}/new`);
  const municipality = await getMunicipality(slug);
  const [categories, boundary] = await Promise.all([getCategories(municipality.id), getBoundary(municipality.id)]);

  return (
    <div style={{ "--primary": municipality.primary_color } as React.CSSProperties} className="flex min-h-dvh flex-col">
      <NewReportWizard
        userId={user.id}
        municipality={municipality}
        categories={categories.filter((c) => c.is_active)}
        boundary={boundary}
      />
    </div>
  );
}
