import type { AppLocale } from "./routing";

type AppMessages = {
  common: typeof import("../../messages/pt-BR/common.json");
  header: typeof import("../../messages/pt-BR/header.json");
  sidebar: typeof import("../../messages/pt-BR/sidebar.json");
  home: typeof import("../../messages/pt-BR/home.json");
  document: typeof import("../../messages/pt-BR/document.json");
  metadata: typeof import("../../messages/pt-BR/metadata.json");
  errors: typeof import("../../messages/pt-BR/errors.json");
};

declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: AppMessages;
  }
}
