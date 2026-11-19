"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BadgeCheck, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TimeAgo } from "@/components/report-bits";
import { initials } from "@/components/user-menu";
import { addComment, deleteComment } from "@/app/actions/reports";
import { cn } from "@/lib/utils";

type Comment = {
  id: string;
  body: string;
  isOfficial: boolean;
  createdAt: string;
  authorId: string;
  authorName: string | null;
  authorAvatar: string | null;
};

type Props = {
  reportId: string;
  path: string;
  currentUserId: string | null;
  canModerate: boolean;
  comments: Comment[];
};

export function Comments({ reportId, path, currentUserId, canModerate, comments }: Props) {
  const t = useTranslations("report");
  const tc = useTranslations("common");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await addComment({ reportId, body }, path);
      if (result.ok) setBody("");
      else toast.error(tc("error"));
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteComment(id, path);
      if (!result.ok) toast.error(tc("error"));
    });
  }

  return (
    <section className="mt-10 border-t pt-8">
      <h2 className="font-semibold">
        {t("comments")} <span className="font-normal text-muted-foreground">{comments.length}</span>
      </h2>

      <ul className="mt-5 space-y-5">
        {comments.map((c) => (
          <li key={c.id} className="flex gap-3">
            <Avatar className="size-8">
              {c.authorAvatar && <AvatarImage src={c.authorAvatar} alt="" />}
              <AvatarFallback className="text-xs">{initials(c.authorName)}</AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "min-w-0 flex-1",
                c.isOfficial && "rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5",
              )}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                <span className="font-medium">{c.authorName || t("anonymous")}</span>
                {c.isOfficial && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                    <BadgeCheck className="size-3.5" />
                    {t("official")}
                  </span>
                )}
                <TimeAgo date={c.createdAt} className="text-xs text-muted-foreground" />
                {(c.authorId === currentUserId || canModerate) && (
                  <button
                    onClick={() => remove(c.id)}
                    disabled={pending}
                    className="ml-auto text-muted-foreground hover:text-destructive"
                    aria-label={t("deleteComment")}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">{c.body}</p>
            </div>
          </li>
        ))}
        {comments.length === 0 && <li className="text-sm text-muted-foreground">{t("noComments")}</li>}
      </ul>

      {currentUserId ? (
        <form onSubmit={submit} className="mt-6 space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("commentPlaceholder")}
            maxLength={2000}
            rows={3}
            aria-label={t("addComment")}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={pending || !body.trim()}>
              {pending && <Loader2 className="animate-spin" />}
              {t("postComment")}
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          <Link href={`/login?next=${encodeURIComponent(path)}`} className="font-medium text-foreground underline underline-offset-4">
            {tc("signIn")}
          </Link>{" "}
          · {t("signInToComment")}
        </p>
      )}
    </section>
  );
}
