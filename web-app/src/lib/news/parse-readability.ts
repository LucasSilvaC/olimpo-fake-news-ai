import { Readability } from "@mozilla/readability";
import type { ArticleFields } from "./types";
import { cleanText, contentText, dateText } from "./normalize";

export function parseReadability(document: Document): ArticleFields {
  const result = new Readability(document, { disableJSONLD: true, maxElemsToParse: 50000 }).parse();
  if (!result) return {};
  const author = cleanText(result.byline);
  return {
    title: cleanText(result.title), description: cleanText(result.excerpt),
    authors: author ? [author] : [], content: contentText(result.textContent),
    publisher: cleanText(result.siteName), language: cleanText(result.lang),
    publishedAt: dateText(result.publishedTime),
  };
}
