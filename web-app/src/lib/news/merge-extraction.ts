import type { MetadataFields } from "./parse-metadata";
import type { ArticleFields, INewsArticle } from "./types";

export function mergeExtraction(
  url: string,
  json: ArticleFields = {},
  meta?: MetadataFields,
  reader: ArticleFields = {},
): INewsArticle {
  const jsonContent = json.content?.trim() ?? "";
  const readerContent = reader.content?.trim() ?? "";
  const content =
    readerContent.length >= 300 &&
    (jsonContent.length < 300 || readerContent.length > jsonContent.length * 1.2)
      ? readerContent
      : jsonContent || readerContent;
  return {
    url,
    canonicalUrl: json.canonicalUrl ?? meta?.canonicalUrl ?? null,
    title:
      json.title ??
      meta?.title ??
      reader.title ??
      meta?.documentTitle ??
      meta?.twitterTitle ??
      null,
    description:
      json.description ??
      meta?.description ??
      reader.description ??
      meta?.metaDescription ??
      meta?.twitterDescription ??
      null,
    authors: json.authors?.length
      ? json.authors
      : meta?.authors?.length
        ? meta.authors
        : (reader.authors ?? []),
    publishedAt: json.publishedAt ?? meta?.publishedAt ?? reader.publishedAt ?? null,
    modifiedAt: json.modifiedAt ?? meta?.modifiedAt ?? null,
    content,
    imageUrl: json.imageUrl ?? meta?.imageUrl ?? null,
    publisher: json.publisher ?? meta?.publisher ?? reader.publisher ?? null,
    language: json.language ?? reader.language ?? meta?.language ?? null,
    extractionMethod: "local",
    usedFallback: false,
  };
}

export function isExtractionUsable(article: INewsArticle): boolean {
  return (
    article.content.trim().length >= 300 &&
    Boolean(
      article.title?.trim() ||
      article.publisher?.trim() ||
      article.authors.some((author) => author.trim()),
    )
  );
}

export function mergeFallback(local: INewsArticle, fallback: ArticleFields): INewsArticle {
  return {
    ...local,
    canonicalUrl: local.canonicalUrl ?? fallback.canonicalUrl ?? null,
    title: local.title ?? fallback.title ?? null,
    description: local.description ?? fallback.description ?? null,
    authors: local.authors.length ? local.authors : (fallback.authors ?? []),
    publishedAt: local.publishedAt ?? fallback.publishedAt ?? null,
    modifiedAt: local.modifiedAt ?? fallback.modifiedAt ?? null,
    imageUrl: local.imageUrl ?? fallback.imageUrl ?? null,
    publisher: local.publisher ?? fallback.publisher ?? null,
    language: local.language ?? fallback.language ?? null,
    content: fallback.content?.trim() || local.content,
    extractionMethod: "jina",
    usedFallback: true,
  };
}
