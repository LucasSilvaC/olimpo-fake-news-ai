import { JSDOM, VirtualConsole } from "jsdom";
import { ExtractionError } from "./errors";
import { fetchPage, type NetworkOptions } from "./fetch-page";
import { readWithJina } from "./jina-reader";
import { isExtractionUsable, mergeExtraction, mergeFallback } from "./merge-extraction";
import { parseJsonLd } from "./parse-json-ld";
import { parseMetadata } from "./parse-metadata";
import { parseReadability } from "./parse-readability";
import { parsePublicUrl } from "./validate-url";
import type { ArticleFields } from "./types";

export function parseHtml(html: string | Buffer, finalUrl: string, originalUrl = finalUrl, contentType = "text/html") {
  // No runScripts or resources option: scripts and subresource requests stay disabled.
  const dom = new JSDOM(html, { url: finalUrl, contentType, virtualConsole: new VirtualConsole() });
  try {
    const document = dom.window.document;
    const json = parseJsonLd(document, finalUrl);
    const meta = parseMetadata(document, finalUrl);
    let reader: ArticleFields = {};
    try { reader = parseReadability(document); } catch { /* Keep usable structured metadata if Readability cannot parse. */ }
    return mergeExtraction(originalUrl, json, meta, reader);
  } finally { dom.window.close(); }
}

export async function extractNews(input: string, options: NetworkOptions = {}) {
  const url = parsePublicUrl(input).href;
  let local = mergeExtraction(url);
  try {
    const page = await fetchPage(url, options);
    local = parseHtml(page.html, page.url, url, page.contentType);
  } catch (error) {
    if (error instanceof ExtractionError && ["UNSAFE_URL", "INVALID_URL", "NOT_FOUND"].includes(error.code)) throw error;
  }
  if (isExtractionUsable(local)) return local;
  try {
    const article = mergeFallback(local, await readWithJina(url, options));
    if (isExtractionUsable(article)) return article;
  } catch (error) {
    if (error instanceof ExtractionError && error.code === "UNSAFE_URL") throw error;
  }
  throw new ExtractionError("EXTRACTION_FAILED");
}
