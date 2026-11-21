"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setReportHidden } from "@/app/actions/moderation";

export function HideReportButton({ reportId, hidden }: { reportId: string; hidden: boolean }) {
  const t = useTranslations("moderation");
  const tc = useTranslations("common");
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await setReportHidden(reportId, !hidden);
      if (!result.ok) toast.error(tc("error"));
    });
  }

  return (
    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={toggle} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : hidden ? <Eye /> : <EyeOff />}
      {hidden ? t("showReport") : t("hideReport")}
    </Button>
  );
}
