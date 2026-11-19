"use client";

import { useTranslations } from "next-intl";
import { Link2, Mail, MessageCircle, Phone, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function BrandIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
      <path d={path} />
    </svg>
  );
}

const facebook =
  "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z";
const x = "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z";
const linkedin =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";

type Props = { url: string; text: string; className?: string };

/** Share links for the most used networks plus copy link and the native share sheet. */
export function ShareButtons({ url, text, className }: Props) {
  const t = useTranslations("report");
  const tc = useTranslations("common");
  const u = encodeURIComponent(url);
  const message = encodeURIComponent(`${text} ${url}`);

  const networks = [
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, icon: <BrandIcon path={facebook} />, color: "hover:text-[#1877f2]" },
    { name: "WhatsApp", href: `https://wa.me/?text=${message}`, icon: <MessageCircle />, color: "hover:text-[#25d366]" },
    { name: "Viber", href: `viber://forward?text=${message}`, icon: <Phone />, color: "hover:text-[#7360f2]" },
    { name: "X", href: `https://x.com/intent/post?url=${u}&text=${encodeURIComponent(text)}`, icon: <BrandIcon path={x} />, color: "hover:text-foreground" },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, icon: <BrandIcon path={linkedin} />, color: "hover:text-[#0a66c2]" },
    { name: t("shareEmail"), href: `mailto:?subject=${encodeURIComponent(text)}&body=${message}`, icon: <Mail />, color: "hover:text-foreground" },
  ];

  async function copy() {
    await navigator.clipboard.writeText(url);
    toast.success(tc("linkCopied"));
  }

  async function nativeShare() {
    try {
      await navigator.share({ url, title: text });
    } catch {
      // Share sheet dismissed.
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {networks.map((n) => (
        <Button
          key={n.name}
          variant="outline"
          size="icon"
          className={cn("size-10 text-muted-foreground", n.color)}
          render={<a href={n.href} target="_blank" rel="noopener noreferrer" />}
          nativeButton={false}
          aria-label={t("shareOn", { network: n.name })}
          title={t("shareOn", { network: n.name })}
        >
          {n.icon}
        </Button>
      ))}
      <Button variant="outline" className="h-10 gap-2 px-3 text-muted-foreground hover:text-foreground" onClick={copy}>
        <Link2 />
        {tc("copyLink")}
      </Button>
      <Button variant="outline" size="icon" className="size-10 text-muted-foreground md:hidden" onClick={nativeShare} aria-label={t("share")}>
        <Share2 />
      </Button>
    </div>
  );
}
