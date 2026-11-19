"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleVote } from "@/app/actions/reports";
import { cn } from "@/lib/utils";

type Props = { reportId: string; count: number; voted: boolean; signedIn: boolean; path: string };

export function VoteButton({ reportId, count, voted, signedIn, path }: Props) {
  const t = useTranslations("report");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic({ count, voted });

  function onClick() {
    if (!signedIn) return router.push(`/login?next=${encodeURIComponent(path)}`);
    startTransition(async () => {
      setOptimistic({ count: state.count + (state.voted ? -1 : 1), voted: !state.voted });
      const result = await toggleVote(reportId, path);
      if (!result.ok) toast.error(tc("error"));
    });
  }

  return (
    <Button
      variant={state.voted ? "default" : "outline"}
      onClick={onClick}
      disabled={pending}
      aria-pressed={state.voted}
      className="h-10 gap-2 px-4"
    >
      <ThumbsUp className={cn(state.voted && "fill-current")} />
      {state.voted ? t("supported") : t("support")}
      <span className={cn("tabular-nums", state.voted ? "opacity-80" : "text-muted-foreground")}>{state.count}</span>
    </Button>
  );
}
