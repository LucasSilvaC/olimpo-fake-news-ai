import { fetch } from "undici";
import { z } from "zod";

import { ExtractionError } from "./errors";
import { MAX_HTML_BYTES, readLimitedBody, type NetworkOptions } from "./fetch-page";
import { absoluteUrl, cleanText, contentText, dateText } from "./normalize";
import type { ArticleFields } from "./types";
import { validateUrl } from "./validate-url";

const jinaData = z.object({
  title: z.string().nullish(),
  content: z.string().nullish(),
  url: z.string().nullish(),
  text: z.string().nullish(),
  httpStatus: z.number().nullish(),
  description: z.string().nullish(),
  publishedTime: z.string().nullish(),
});
const jinaResponse = z.object({ code: z.number().optional(), data: jinaData });

export async function readWithJina(
  input: string,
  options: NetworkOptions = {},
): Promise<ArticleFields> {
  const signal = AbortSignal.timeout(15000);
  const { url } = await validateUrl(input, signal, options.resolver);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Respond-With": "text",
    "X-Timeout": "15",
    "X-With-Generated-Alt": "false",
  };
  if (process.env.JINA_API_KEY?.trim())
    headers.Authorization = `Bearer ${process.env.JINA_API_KEY.trim()}`;
  const response = await fetch(`https://r.jina.ai/${url.href}`, {
    headers,
    signal,
    redirect: "error",
    dispatcher: options.dispatcher,
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new ExtractionError("EXTRACTION_FAILED");
  }
  const payload: unknown = JSON.parse(
    (await readLimitedBody(response.body, MAX_HTML_BYTES)).toString("utf8"),
  );
  const parsed = jinaResponse.safeParse(payload);
  if (!parsed.success || (parsed.data.code !== undefined && parsed.data.code !== 200))
    throw new ExtractionError("EXTRACTION_FAILED");
  const data = parsed.data.data;
  if (data.httpStatus && data.httpStatus >= 400) throw new ExtractionError("EXTRACTION_FAILED");
  return {
    title: cleanText(data.title),
    content: contentText(data.text) || contentText(data.content),
    canonicalUrl: absoluteUrl(data.url, url.href),
    description: cleanText(data.description),
    // Reader timestamps can be crawl times; only an explicit publishedTime is a publication date.
    publishedAt: dateText(data.publishedTime),
  };
}
