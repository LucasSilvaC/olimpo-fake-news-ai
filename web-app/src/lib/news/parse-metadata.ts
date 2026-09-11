import { absoluteUrl, cleanText, dateText } from "./normalize";
import type { ArticleFields } from "./types";

export interface MetadataFields extends ArticleFields {
  documentTitle: string | null;
  metaDescription: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
}

export function parseMetadata(document: Document, base: string): MetadataFields {
  const meta = (key: string) =>
    cleanText(
      document
        .querySelector(`meta[property="${key}" i], meta[name="${key}" i]`)
        ?.getAttribute("content"),
    );
  const authors = [
    ...document.querySelectorAll(
      'meta[name="author" i], meta[property="article:author" i], meta[name="article:author" i]',
    ),
  ]
    .map((element) => cleanText(element.getAttribute("content")))
    .filter((value): value is string => Boolean(value));
  return {
    title: meta("og:title"),
    description: meta("og:description"),
    documentTitle: cleanText(document.title),
    metaDescription: meta("description"),
    twitterTitle: meta("twitter:title"),
    twitterDescription: meta("twitter:description"),
    authors: [...new Set(authors)],
    canonicalUrl: absoluteUrl(
      document.querySelector('link[rel~="canonical" i]')?.getAttribute("href"),
      base,
    ),
    publishedAt: dateText(meta("article:published_time")),
    modifiedAt: dateText(meta("article:modified_time")),
    imageUrl: absoluteUrl(meta("og:image"), base) ?? absoluteUrl(meta("twitter:image"), base),
    publisher: meta("og:site_name"),
    language: cleanText(document.documentElement.lang),
  };
}
