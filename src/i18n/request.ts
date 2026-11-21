import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { configuredLocale, isLocale, localeCookie, matchLocale } from "./config";

export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(localeCookie)?.value;
  const locale = isLocale(cookieLocale)
    ? cookieLocale
    : (configuredLocale() ?? matchLocale((await headers()).get("accept-language")));

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
