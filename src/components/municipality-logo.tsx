import { logoUrl } from "@/lib/config";
import { cn } from "@/lib/utils";

type Props = { name: string; logoPath?: string | null; color?: string | null; className?: string };

/** Municipality logo, or a coloured initial when none is uploaded. */
export function MunicipalityLogo({ name, logoPath, color, className }: Props) {
  if (logoPath) {
    // eslint-disable-next-line @next/next/no-img-element -- small public asset from Supabase Storage
    return <img src={logoUrl(logoPath)} alt="" className={cn("size-7 shrink-0 rounded-md object-contain", className)} />;
  }
  const initial = name.replace(/^(mestna\s+)?ob[čc]ina\s+/i, "").charAt(0).toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={cn("grid size-7 shrink-0 place-items-center rounded-md text-xs font-semibold text-white", className)}
      style={{ backgroundColor: color ?? "#0f766e" }}
    >
      {initial}
    </span>
  );
}
