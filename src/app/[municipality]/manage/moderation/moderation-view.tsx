"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TimeAgo } from "@/components/report-bits";
import { dismissFlags, setCommentHidden, setReportHidden } from "@/app/actions/moderation";

type Target = { key: string; reportId: string; reportNumber: number; commentId: string | null; text: string };
export type HiddenItem = Target;
export type FlagGroup = Target & {
  isHidden: boolean;
  flags: { id: string; reason: string | null; createdAt: string; reporter: string | null }[];
};

export function ModerationView({ slug, groups, hidden }: { slug: string; groups: FlagGroup[]; hidden: HiddenItem[] }) {
  const t = useTranslations("moderation");
  const tc = useTranslations("common");
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) toast.error(tc("error"));
    });
  }

  const setHidden = (item: Target, value: boolean) =>
    run(() =>
      item.commentId
        ? setCommentHidden(item.reportId, item.commentId, value)
        : setReportHidden(item.reportId, value),
    );

  const label = (item: Target) =>
    item.commentId ? t("comment", { number: item.reportNumber }) : t("report", { number: item.reportNumber });

  return (
    <>
      <section>
        <h2 className="text-sm font-semibold">{t("openFlags")}</h2>
        {groups.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            {t("noFlags")}
          </p>
        ) : (
          <ul className="mt-3 divide-y rounded-xl border">
            {groups.map((group) => (
              <li key={group.key} className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <Link href={`/${slug}/reports/${group.reportNumber}`} className="font-medium hover:underline">
                    {label(group)}
                  </Link>
                  <span className="text-xs text-muted-foreground">{t("flagCount", { count: group.flags.length })}</span>
                  {group.isHidden && <span className="text-xs font-medium text-amber-700">{t("hidden")}</span>}
                </div>
                <p className="line-clamp-3 rounded-md bg-muted px-3 py-2 text-sm whitespace-pre-line">{group.text}</p>
                <ul className="space-y-1 text-sm">
                  {group.flags.map((flag) => (
                    <li key={flag.id} className="flex flex-wrap gap-x-2 text-muted-foreground">
                      <span className="text-foreground">{flag.reason || t("noReason")}</span>
                      <span>· {flag.reporter || "?"}</span>
                      <span>
                        · <TimeAgo date={flag.createdAt} />
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  {!group.isHidden && (
                    <Button size="sm" onClick={() => setHidden(group, true)} disabled={pending}>
                      <EyeOff />
                      {t("hideContent")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => run(() => dismissFlags(group.reportId, group.commentId))}
                    disabled={pending}
                  >
                    {t("dismiss")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">{t("hiddenContent")}</h2>
        {hidden.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("noHidden")}</p>
        ) : (
          <ul className="mt-3 divide-y rounded-xl border">
            {hidden.map((item) => (
              <li key={item.key} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/${slug}/reports/${item.reportNumber}`} className="text-sm font-medium hover:underline">
                    {label(item)}
                  </Link>
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{item.text}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setHidden(item, false)} disabled={pending}>
                  <Eye />
                  {t("show")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
