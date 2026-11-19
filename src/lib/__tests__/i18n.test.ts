import { describe, expect, it } from "vitest";
import { isLocale, localized, matchLocale } from "@/i18n/config";

describe("matchLocale", () => {
  it("falls back to the default locale", () => {
    expect(matchLocale(null)).toBe("en");
    expect(matchLocale("de-DE,fr;q=0.8")).toBe("en");
  });

  it("respects quality values", () => {
    expect(matchLocale("en;q=0.5,sl-SI;q=0.9")).toBe("sl");
    expect(matchLocale("sl")).toBe("sl");
  });
});

describe("localized", () => {
  it("picks the requested locale, then the default, then any value", () => {
    expect(localized({ en: "Road", sl: "Cesta" }, "sl")).toBe("Cesta");
    expect(localized({ en: "Road" }, "sl")).toBe("Road");
    expect(localized({ de: "Straße" }, "sl")).toBe("Straße");
  });

  it("handles plain strings and empty values", () => {
    expect(localized("Road", "sl")).toBe("Road");
    expect(localized(null, "en")).toBe("");
  });
});

describe("isLocale", () => {
  it("accepts only supported locales", () => {
    expect(isLocale("sl")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});
