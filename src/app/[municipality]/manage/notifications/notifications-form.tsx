"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CategoryIcon } from "@/components/category-icon";
import { updateNotificationPreferences } from "@/app/actions/profile";
import { localized } from "@/i18n/config";

type Props = {
  municipalityId: string;
  categories: { id: string; name: unknown; icon: string; color: string }[];
  categoryIds: string[];
  comments: boolean;
};

export function NotificationsForm({
  municipalityId,
  categories,
  categoryIds,
  comments,
}: Props) {
  const t = useTranslations("notifications");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [selected, setSelected] = useState(() => new Set(categoryIds));
  const [notifyComments, setNotifyComments] = useState(comments);
  const [, startTransition] = useTransition();

  function save(nextSelected: Set<string>, nextComments: boolean) {
    setSelected(nextSelected);
    setNotifyComments(nextComments);
    startTransition(async () => {
      const result = await updateNotificationPreferences({
        municipalityId,
        categoryIds: [...nextSelected],
        comments: nextComments,
      });
      if (result.ok) toast.success(tc("saved"));
      else toast.error(tc("error"));
    });
  }

  function toggle(id: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    save(next, notifyComments);
  }

  const allSelected = categories.every((c) => selected.has(c.id));

  return (
    <div className="space-y-6">
      <section className="rounded-xl border">
        <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
          <div>
            <h2 className="text-sm font-semibold">{t("newReports")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("newReportsText")}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              save(
                allSelected ? new Set() : new Set(categories.map((c) => c.id)),
                notifyComments,
              )
            }
            className="shrink-0 text-sm font-medium underline-offset-4 hover:underline"
          >
            {allSelected ? t("selectNone") : t("selectAll")}
          </button>
        </div>
        <ul className="divide-y border-t">
          {categories.map((c) => (
            <li key={c.id}>
              <label className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm hover:bg-muted/60 sm:px-5">
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: c.color }}
                >
                  <CategoryIcon name={c.icon} className="size-3.5 text-white" />
                </span>
                <span className="flex-1">{localized(c.name, locale)}</span>
                <Checkbox
                  checked={selected.has(c.id)}
                  onCheckedChange={(checked) => toggle(c.id, checked === true)}
                />
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-start justify-between gap-4 rounded-xl border p-4 sm:p-5">
        <div>
          <Label htmlFor="notify-comments">{t("comments")}</Label>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("commentsText")}
          </p>
        </div>
        <Switch
          id="notify-comments"
          checked={notifyComments}
          onCheckedChange={(value) => save(selected, value)}
        />
      </section>
    </div>
  );
}
