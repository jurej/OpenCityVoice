export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const mapStyleUrl =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/positron";

const supportedProviders = ["google", "facebook", "apple", "azure"] as const;
export type OAuthProvider = (typeof supportedProviders)[number];

export const oauthProviders = (process.env.NEXT_PUBLIC_AUTH_PROVIDERS ?? "")
  .split(",")
  .map((p) => p.trim())
  .filter((p): p is OAuthProvider => (supportedProviders as readonly string[]).includes(p));

export const passwordLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN === "true";

export const providerLabels: Record<OAuthProvider, string> = {
  google: "Google",
  facebook: "Facebook",
  apple: "Apple",
  azure: "Microsoft",
};

export const PHOTO_BUCKET = "report-photos";
export const MAX_PHOTOS = 4;

export function photoUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}

/** Only allow same-origin relative redirects. */
export function safeNext(next: string | null | undefined, fallback = "/") {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
