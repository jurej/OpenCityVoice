export const locales = ["en", "sl"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const localeCookie = "NEXT_LOCALE";

export const localeNames: Record<Locale, string> = {
  en: "English",
  sl: "Slovenščina",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/** Server-side DEFAULT_LOCALE: the language shown until a user picks another one, regardless of browser language. */
export function configuredLocale(): Locale | null {
  const value = process.env.DEFAULT_LOCALE;
  return isLocale(value) ? value : null;
}

/** Picks the best supported locale from an Accept-Language header. */
export function matchLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return defaultLocale;
  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return ranked.find((entry) => isLocale(entry.lang))?.lang as Locale | undefined ?? defaultLocale;
}

/** Resolves a localized jsonb value like {"en": "...", "sl": "..."}. */
export function localized(value: unknown, locale: string): string {
  if (!value || typeof value !== "object") return typeof value === "string" ? value : "";
  const map = value as Record<string, string>;
  return map[locale] || map[defaultLocale] || Object.values(map)[0] || "";
}
