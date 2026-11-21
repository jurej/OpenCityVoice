import Link from "next/link";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function LegalLinks({ className }: { className?: string }) {
  const t = useTranslations("legal");
  return (
    <nav className={cn("flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
      <Link href="/privacy" className="hover:text-foreground">
        {t("privacy")}
      </Link>
      <Link href="/terms" className="hover:text-foreground">
        {t("terms")}
      </Link>
    </nav>
  );
}

/** Shown while a municipality does not run the deployment itself, so citizens know reports are not delivered automatically. */
export function IndependentNotice({ municipality, className }: { municipality: string; className?: string }) {
  const t = useTranslations("legal");
  return (
    <p className={cn("flex gap-2 text-xs leading-relaxed text-muted-foreground", className)}>
      <Info className="mt-0.5 size-3.5 shrink-0" />
      {t("independent", { municipality })}
    </p>
  );
}
