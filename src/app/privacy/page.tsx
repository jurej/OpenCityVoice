import { getTranslations } from "next-intl/server";
import { LegalDocument } from "@/components/legal-document";

export async function generateMetadata() {
  const t = await getTranslations("legal");
  return { title: t("privacy") };
}

export default function PrivacyPage() {
  return <LegalDocument kind="privacy" path="/privacy" />;
}
