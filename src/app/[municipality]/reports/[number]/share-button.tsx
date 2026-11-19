"use client";

import { useTranslations } from "next-intl";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton() {
  const t = useTranslations("report");
  const tc = useTranslations("common");

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: document.title });
      } catch {
        // Share sheet dismissed.
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success(tc("linkCopied"));
  }

  return (
    <Button variant="outline" onClick={share} className="h-10 gap-2 px-4">
      <Share2 />
      {t("share")}
    </Button>
  );
}
