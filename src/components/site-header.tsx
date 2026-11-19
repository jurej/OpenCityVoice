import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Brand } from "@/components/brand";
import { UserMenu } from "@/components/user-menu";
import { getCurrentUser } from "@/lib/data";
import { cn } from "@/lib/utils";

type Props = {
  municipality?: { slug: string; name: string } | null;
  isStaff?: boolean;
  next?: string;
  className?: string;
};

export async function SiteHeader({ municipality, isStaff, next, className }: Props) {
  const user = await getCurrentUser();
  const t = await getTranslations("common");
  return (
    <header className={cn("sticky top-0 z-30 border-b bg-background/95 backdrop-blur", className)}>
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-3 px-4">
        <Brand className="shrink-0" />
        {municipality && (
          <>
            <span className="text-border" aria-hidden="true">/</span>
            <Link href={`/${municipality.slug}`} className="min-w-0 truncate text-sm font-medium">
              {municipality.name}
            </Link>
          </>
        )}
        <div className="ml-auto flex items-center gap-1">
          {municipality && isStaff && (
            <Link
              href={`/${municipality.slug}/manage`}
              className="hidden rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:block"
            >
              {t("manage")}
            </Link>
          )}
          <UserMenu
            next={next}
            user={
              user
                ? {
                    name: user.profile.full_name,
                    email: user.email,
                    avatarUrl: user.profile.avatar_url,
                    isPlatformAdmin: user.profile.is_platform_admin,
                  }
                : null
            }
          />
        </div>
      </div>
    </header>
  );
}
