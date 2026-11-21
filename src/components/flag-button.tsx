"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { flagContent } from "@/app/actions/moderation";

type Props = { reportId: string; commentId?: string | null; compact?: boolean };

export function FlagButton({ reportId, commentId = null, compact = false }: Props) {
  const t = useTranslations("moderation");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await flagContent({ reportId, commentId, reason });
      if (!result.ok) {
        toast.error(tc("error"));
        return;
      }
      toast.success(t("flagged"));
      setOpen(false);
      setReason("");
    });
  }

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-muted-foreground hover:text-foreground"
          aria-label={t("flagComment")}
          title={t("flagComment")}
        >
          <Flag className="size-3.5" />
        </button>
      ) : (
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setOpen(true)}>
          <Flag />
          {t("flagReport")}
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{commentId ? t("flagCommentTitle") : t("flagReportTitle")}</DialogTitle>
            <DialogDescription>{t("flagHelp")}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("reasonPlaceholder")}
            aria-label={t("reason")}
            maxLength={500}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              {tc("cancel")}
            </Button>
            <Button onClick={submit} disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {t("send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
