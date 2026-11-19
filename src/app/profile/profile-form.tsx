"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateProfile } from "@/app/actions/profile";

type Props = { email: string | null; fullName: string; emailNotifications: boolean };

export function ProfileForm({ email, fullName, emailNotifications }: Props) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const [name, setName] = useState(fullName);
  const [notify, setNotify] = useState(emailNotifications);
  const [pending, startTransition] = useTransition();

  function save(next: { fullName: string; emailNotifications: boolean }) {
    startTransition(async () => {
      const result = await updateProfile(next);
      if (result.ok) toast.success(tc("saved"));
      else toast.error(tc("error"));
    });
  }

  return (
    <section className="space-y-6 rounded-xl border p-4 sm:p-5">
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          save({ fullName: name, emailNotifications: notify });
        }}
      >
        <Label htmlFor="name">{t("name")}</Label>
        <div className="flex gap-2">
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} maxLength={80} />
          <Button type="submit" variant="outline" disabled={pending || name === fullName}>
            {pending && <Loader2 className="animate-spin" />}
            {tc("save")}
          </Button>
        </div>
        {email && <p className="text-xs text-muted-foreground">{email}</p>}
      </form>
      <div className="flex items-start justify-between gap-4 border-t pt-5">
        <div>
          <Label htmlFor="notify">{t("emailNotifications")}</Label>
          <p className="mt-1 text-sm text-muted-foreground">{t("emailNotificationsText")}</p>
        </div>
        <Switch
          id="notify"
          checked={notify}
          onCheckedChange={(value) => {
            setNotify(value);
            save({ fullName: name, emailNotifications: value });
          }}
        />
      </div>
    </section>
  );
}
