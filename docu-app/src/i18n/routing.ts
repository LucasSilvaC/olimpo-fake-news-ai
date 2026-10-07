import { defineRouting } from "next-intl/routing";

export const locales = ["pt-BR", "en", "es"] as const;
export type AppLocale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "pt-BR",
  localePrefix: "always",
  localeDetection: false,
});

export function hasLocale(value: string): value is AppLocale {
  return locales.some((locale) => locale === value);
}
