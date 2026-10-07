import { documentationPages } from "../data/documentation-pages";
import type { IDocumentationPage, IDocumentationRepository } from "./types";

export const localDocumentationRepository: IDocumentationRepository = {
  list(): IDocumentationPage[] {
    return documentationPages;
  },
  findBySlug(slug: string): IDocumentationPage | undefined {
    return documentationPages.find((page) => page.slug === slug);
  },
};
