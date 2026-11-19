"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Copy, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { TimeAgo } from "@/components/report-bits";
import { initials } from "@/components/user-menu";
import { addMemberByEmail, removeMember, setMemberRole, setMemberStatus } from "@/app/actions/team";
import type { MemberRole } from "@/lib/types";

type Member = {
  id: string;
  role: MemberRole;
  status: "pending" | "approved" | "rejected";
  jobTitle: string | null;
  createdAt: string;
  name: string | null;
  avatarUrl: string | null;
  email: string | null;
};

type Props = { municipalityId: string; joinUrl: string; isAdmin: boolean; currentUserId: string; members: Member[] };

export function TeamView({ municipalityId, joinUrl, isAdmin, currentUserId, members }: Props) {
  const t = useTranslations("team");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("staff");

  const requests = members.filter((m) => m.status === "pending");
  const approved = members.filter((m) => m.status === "approved");

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success?: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        if (success) toast.success(success);
        router.refresh();
      } else toast.error(result.error === "notFound" ? t("userNotFound") : tc("error"));
    });
  }

  function person(m: Member) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="size-9">
          {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt="" />}
          <AvatarFallback className="text-xs">{initials(m.name ?? m.email)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {m.name ?? m.email ?? "—"}
            {m.id === currentUserId && <span className="font-normal text-muted-foreground"> ({t("you")})</span>}
          </p>
          <p className="truncate text-xs text-muted-foreground">{[m.jobTitle, m.email].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
        <header>
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("text")}</p>
        </header>

        {isAdmin && (
          <section className="space-y-6 rounded-xl border p-4 sm:p-5">
            <div>
              <h2 className="text-sm font-semibold">{t("inviteLink")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("inviteLinkText")}</p>
              <div className="mt-3 flex gap-2">
                <Input readOnly value={joinUrl} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
                <Button
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(joinUrl).then(() => toast.success(tc("linkCopied")))}
                >
                  <Copy />
                  {tc("copyLink")}
                </Button>
              </div>
            </div>
            <form
              className="border-t pt-5"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => addMemberByEmail(municipalityId, email, role), t("memberAdded"));
                setEmail("");
              }}
            >
              <h2 className="text-sm font-semibold">{t("addByEmail")}</h2>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="sm:flex-1" />
                <NativeSelect value={role} onChange={(e) => setRole(e.target.value as MemberRole)} className="sm:w-48" aria-label={t("role")}>
                  <option value="staff">{t("roles.staff")}</option>
                  <option value="admin">{t("roles.admin")}</option>
                </NativeSelect>
                <Button type="submit" disabled={pending}>
                  {t("addMember")}
                </Button>
              </div>
            </form>
          </section>
        )}

        {isAdmin && (
          <section>
            <h2 className="text-sm font-semibold">
              {t("pendingRequests")} <span className="font-normal text-muted-foreground">{requests.length}</span>
            </h2>
            <ul className="mt-3 divide-y rounded-xl border">
              {requests.map((m) => (
                <li key={m.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                  {person(m)}
                  <TimeAgo date={m.createdAt} className="text-xs text-muted-foreground" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => run(() => setMemberStatus(municipalityId, m.id, "approved"))} disabled={pending}>
                      {pending ? <Loader2 className="animate-spin" /> : <Check />}
                      {t("approve")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => run(() => setMemberStatus(municipalityId, m.id, "rejected"))} disabled={pending}>
                      <X />
                      {t("reject")}
                    </Button>
                  </div>
                </li>
              ))}
              {requests.length === 0 && <li className="p-4 text-sm text-muted-foreground">{t("noPending")}</li>}
            </ul>
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold">
            {t("members")} <span className="font-normal text-muted-foreground">{approved.length}</span>
          </h2>
          <ul className="mt-3 divide-y rounded-xl border">
            {approved.map((m) => (
              <li key={m.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                {person(m)}
                {isAdmin && m.id !== currentUserId ? (
                  <div className="flex gap-2">
                    <NativeSelect
                      value={m.role}
                      onChange={(e) => run(() => setMemberRole(municipalityId, m.id, e.target.value as MemberRole))}
                      className="w-44"
                      aria-label={t("role")}
                    >
                      <option value="staff">{t("roles.staff")}</option>
                      <option value="admin">{t("roles.admin")}</option>
                    </NativeSelect>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 text-muted-foreground hover:text-destructive"
                      onClick={() => confirm(t("removeConfirm")) && run(() => removeMember(municipalityId, m.id))}
                    >
                      {t("remove")}
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">{t(`roles.${m.role}`)}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
