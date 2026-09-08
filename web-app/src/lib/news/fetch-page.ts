import { Agent, fetch } from "undici";
import type { Dispatcher } from "undici";
import { ExtractionError } from "./errors";
import { validateUrl, type DnsLookup } from "./validate-url";

export const MAX_HTML_BYTES = 3 * 1024 * 1024;
export const LOCAL_TIMEOUT_MS = 8000;

type ByteStream = { getReader(): Pick<ReadableStreamDefaultReader<Uint8Array>, "read" | "cancel" | "releaseLock"> };

export async function readLimitedBody(body: ByteStream | null, maxBytes: number): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new ExtractionError("EXTRACTION_FAILED");
      chunks.push(value);
    }
    return Buffer.concat(chunks, size);
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

// Test seams are network boundaries; production always uses validated DNS and a pinned Agent.
export interface NetworkOptions { resolver?: DnsLookup; dispatcher?: Dispatcher }

export async function fetchPage(input: string, options: NetworkOptions = {}) {
  const signal = AbortSignal.timeout(LOCAL_TIMEOUT_MS);
  let target = input;
  for (let redirects = 0; redirects <= 3; redirects++) {
    const { url, addresses } = await validateUrl(target, signal, options.resolver);
    const agent = options.dispatcher ?? new Agent({
      connect: {
        timeout: LOCAL_TIMEOUT_MS,
        lookup: (_hostname, lookupOptions, callback) => {
          // Never resolve the hostname again between validation and connection.
          if (lookupOptions.all) callback(null, addresses);
          else callback(null, addresses[0].address, addresses[0].family);
        },
      },
    });
    try {
      const response = await fetch(url, {
        dispatcher: agent, redirect: "manual", signal,
        headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "Mozilla/5.0 (compatible; NewsParserPoC/1.0)" },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        await response.body?.cancel();
        const location = response.headers.get("location");
        if (!location || redirects === 3) throw new ExtractionError("EXTRACTION_FAILED");
        target = new URL(location, url).href;
        continue;
      }
      if (response.status === 404 || response.status === 410) {
        await response.body?.cancel();
        throw new ExtractionError("NOT_FOUND");
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || !/^(text\/html|application\/xhtml\+xml)(?:;|$)/i.test(contentType)
        || Number(response.headers.get("content-length")) > MAX_HTML_BYTES) {
        await response.body?.cancel();
        throw new ExtractionError("EXTRACTION_FAILED");
      }
      const html = await readLimitedBody(response.body, MAX_HTML_BYTES);
      return { html, url: url.href, contentType };
    } finally {
      if (!options.dispatcher) await agent.destroy();
    }
  }
  throw new ExtractionError("EXTRACTION_FAILED");
}
