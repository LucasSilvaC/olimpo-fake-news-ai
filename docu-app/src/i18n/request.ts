import * as rootParams from "next/root-params";
import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

import type { AppLocale } from "./routing";
import { hasLocale } from "./routing";

const messageLoaders = {
  "pt-BR": async () => ({
    common: (await import("../../messages/pt-BR/common.json")).default,
    header: (await import("../../messages/pt-BR/header.json")).default,
    sidebar: (await import("../../messages/pt-BR/sidebar.json")).default,
    home: (await import("../../messages/pt-BR/home.json")).default,
    document: (await import("../../messages/pt-BR/document.json")).default,
    metadata: (await import("../../messages/pt-BR/metadata.json")).default,
    errors: (await import("../../messages/pt-BR/errors.json")).default,
  }),
  en: async () => ({
    common: (await import("../../messages/en/common.json")).default,
    header: (await import("../../messages/en/header.json")).default,
    sidebar: (await import("../../messages/en/sidebar.json")).default,
    home: (await import("../../messages/en/home.json")).default,
    document: (await import("../../messages/en/document.json")).default,
    metadata: (await import("../../messages/en/metadata.json")).default,
    errors: (await import("../../messages/en/errors.json")).default,
  }),
  es: async () => ({
    common: (await import("../../messages/es/common.json")).default,
    header: (await import("../../messages/es/header.json")).default,
    sidebar: (await import("../../messages/es/sidebar.json")).default,
    home: (await import("../../messages/es/home.json")).default,
    document: (await import("../../messages/es/document.json")).default,
    metadata: (await import("../../messages/es/metadata.json")).default,
    errors: (await import("../../messages/es/errors.json")).default,
  }),
} satisfies Record<AppLocale, () => Promise<Record<string, object>>>;

export default getRequestConfig(async ({ locale }) => {
  let resolvedLocale = locale;

  if (!resolvedLocale) {
    const routeLocale = await rootParams.locale();
    if (!hasLocale(routeLocale)) notFound();
    resolvedLocale = routeLocale;
  }

  if (!hasLocale(resolvedLocale)) notFound();

  return {
    locale: resolvedLocale,
    messages: await messageLoaders[resolvedLocale](),
  };
});
