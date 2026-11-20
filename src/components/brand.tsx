import Link from "next/link";
import { cn } from "@/lib/utils";

/** OpenCityVoice mark: a map pin with a signal ring. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-6", className)}>
      <rect width="24" height="24" rx="6" className="fill-foreground" />
      <path
        d="M12 5.5a4.5 4.5 0 0 0-4.5 4.5c0 3.1 3.6 7.1 4.1 7.7a.55.55 0 0 0 .8 0c.5-.6 4.1-4.6 4.1-7.7A4.5 4.5 0 0 0 12 5.5Z"
        className="fill-background"
      />
      <circle cx="12" cy="10" r="1.7" className="fill-foreground" />
    </svg>
  );
}

export function Brand({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <BrandMark />
      <span>OpenCityVoice</span>
    </Link>
  );
}
