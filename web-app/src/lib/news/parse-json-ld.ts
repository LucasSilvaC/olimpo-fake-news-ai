import type { ArticleFields } from "./types";
import { absoluteUrl, asRecord, cleanText, contentText, dateText, names } from "./normalize";

const supported = ["NewsArticle", "Article", "BlogPosting"];
const useful = ["headline", "articleBody", "author", "datePublished", "description", "image", "publisher"];

function types(node: Record<string, unknown>): string[] {
  const value = node["@type"];
  return (Array.isArray(value) ? value : [value]).filter((v): v is string => typeof v === "string").map((v) => v.replace(/^https?:\/\/schema.org\//, ""));
}

function resourceUrl(value: unknown): unknown {
  if (Array.isArray(value)) return resourceUrl(value[0]);
  const object = asRecord(value);
  return object ? object.url ?? object.contentUrl ?? object["@id"] : value;
}

export function parseJsonLd(document: Document, base: string): ArticleFields {
  const candidates: Record<string, unknown>[] = [];
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    let parsed: unknown;
    try { parsed = JSON.parse(script.textContent ?? ""); } catch { continue; }
    const queue: unknown[] = [parsed];
    while (queue.length) {
      const item = queue.pop();
      if (Array.isArray(item)) { for (const entry of item) queue.push(entry); continue; }
      const node = asRecord(item);
      if (!node) continue;
      if (types(node).some((type) => supported.includes(type))) candidates.push(node);
      if (node["@graph"]) queue.push(node["@graph"]);
    }
  }
  const rank = (node: Record<string, unknown>) => Math.min(...types(node).map((type) => supported.indexOf(type)).filter((index) => index >= 0));
  const score = (node: Record<string, unknown>) => useful.filter((key) => Boolean(node[key])).length;
  candidates.sort((a, b) => rank(a) - rank(b) || score(b) - score(a));
  const node = candidates[0];
  if (!node) return {};
  let body = contentText(node.articleBody);
  if (/<\/?[a-z][^>]*>/i.test(body)) {
    const template = document.createElement("template");
    template.innerHTML = body;
    template.content.querySelectorAll("script,style,noscript,iframe").forEach((element) => element.remove());
    template.content.querySelectorAll("p,div,section,li,h1,h2,h3,blockquote,br").forEach((element) => element.append(document.createTextNode("\n\n")));
    body = contentText(template.content.textContent);
  }
  return {
    title: cleanText(node.headline), description: cleanText(node.description),
    content: body, authors: names(node.author),
    publishedAt: dateText(node.datePublished), modifiedAt: dateText(node.dateModified),
    imageUrl: absoluteUrl(resourceUrl(node.image), base),
    publisher: names(node.publisher)[0] ?? null,
    language: cleanText(typeof node.inLanguage === "string" ? node.inLanguage : asRecord(node.inLanguage)?.name),
    canonicalUrl: absoluteUrl(resourceUrl(node.mainEntityOfPage), base),
  };
}
