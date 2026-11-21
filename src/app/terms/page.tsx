import { getTranslations } from "next-intl/server";
import { LegalDocument } from "@/components/legal-document";

export async function generateMetadata() {
  const t = await getTranslations("legal");
  return { title: t("terms") };
}

export default function TermsPage() {
  return <LegalDocument kind="terms" path="/terms" />;
}
