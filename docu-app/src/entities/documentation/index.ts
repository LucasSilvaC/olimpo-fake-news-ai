import { documentationGroups, documentationPages } from "./data/documentation-pages";
import { documentationGroupsEn, documentationPagesEn } from "./data/documentation-pages.en";
import { documentationGroupsEs, documentationPagesEs } from "./data/documentation-pages.es";
import type { AppLocale } from "@/i18n/routing";
import type { DocumentationNavigationGroup, IDocumentationPage } from "./model/types";

export { documentationGroups, documentationPages };
export { documentationIcons } from "./model/icon-map";
export { localDocumentationRepository } from "./model/local-documentation.repository";

export interface DocumentationCatalog {
  groups: DocumentationNavigationGroup[];
  pages: IDocumentationPage[];
}

const documentationCatalogs = {
  "pt-BR": { groups: documentationGroups, pages: documentationPages },
  en: { groups: documentationGroupsEn, pages: documentationPagesEn },
  es: { groups: documentationGroupsEs, pages: documentationPagesEs },
} satisfies Record<AppLocale, DocumentationCatalog>;

export function getDocumentationCatalog(locale: AppLocale): DocumentationCatalog {
  return documentationCatalogs[locale];
}

export type {
  DocumentationBlock,
  DocumentationGroupId,
  DocumentationIconName,
  DocumentationNavigationGroup,
  DocumentationSection,
  IDocumentationPage,
  IDocumentationRepository,
} from "./model/types";
