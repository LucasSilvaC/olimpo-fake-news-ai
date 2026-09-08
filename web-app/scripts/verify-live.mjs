import { writeFile, mkdir } from "node:fs/promises";

const base = process.env.NEWS_PARSER_BASE_URL || "http://127.0.0.1:3000";
const cases = [
  ["NASA SSR / JSON-LD", "https://www.nasa.gov/missions/webb/nasa-documentary-cosmic-dawn-reveals-untold-story-of-james-webb-space-telescope/"],
  ["JPL SSR / JSON-LD", "https://www.jpl.nasa.gov/news/nasa-webbs-autopsy-of-planet-swallowed-by-star-yields-surprise/"],
  ["AP / tentativa de fallback", "https://apnews.com/article/ece7b93649870ee23d498618e5d20309"],
  ["URL inválida", "abc"],
  ["Localhost", "http://localhost:3000"],
  ["IP privado", "http://192.168.0.1"],
  ["Não-artigo", "https://example.com/"],
];
const page = await fetch(base);
const html = await page.text();
const ui = { status: page.status, title: html.includes("News Parser"), input: html.includes('id="news-url"'), button: html.includes("Extract"), script: html.includes("/_next/static/") };
const results = [];
// Keep at most two extractions active; record only metadata and counts, never full third-party articles.
for (let offset = 0; offset < cases.length; offset += 2) {
  results.push(...await Promise.all(cases.slice(offset, offset + 2).map(async ([name, url]) => {
    const start = Date.now();
    try {
      const response = await fetch(`${base}/api/news/extract`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }), signal: AbortSignal.timeout(60000) });
      const data = await response.json();
      const result = { name, url, status: response.status, elapsedMs: Date.now() - start, method: data.extractionMethod, fallback: data.usedFallback, contentLength: data.content?.length, title: data.title, authors: data.authors, publishedAt: data.publishedAt, publisher: data.publisher, image: Boolean(data.imageUrl), error: data.error };
      console.log(JSON.stringify(result));
      return result;
    } catch (error) {
      const result = { name, url, error: error.message, elapsedMs: Date.now() - start };
      console.log(JSON.stringify(result));
      return result;
    }
  })));
}
await mkdir("validation", { recursive: true });
await writeFile("validation/live-results.json", JSON.stringify({ testedAt: new Date().toISOString(), base, ui, results }, null, 2));
console.log(JSON.stringify({ ui, report: "validation/live-results.json" }));
