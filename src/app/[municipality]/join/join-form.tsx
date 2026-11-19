"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestAccess } from "@/app/actions/team";

export function JoinForm({ municipalityId }: { municipalityId: string }) {
  const t = useTranslations("join");
  const tc = useTranslations("common");
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await requestAccess(municipalityId, jobTitle);
          if (result.ok) router.refresh();
          else toast.error(tc("error"));
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="job">{t("jobTitle")}</Label>
        <Input id="job" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder={t("jobTitlePlaceholder")} className="h-11" />
      </div>
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        {t("request")}
      </Button>
    </form>
  );
}
