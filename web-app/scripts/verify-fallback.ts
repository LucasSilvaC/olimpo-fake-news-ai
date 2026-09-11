import { writeFile, mkdir } from "node:fs/promises";
import { MockAgent } from "undici";
import { extractNews } from "../src/lib/news/extract-news";
import { readWithJina } from "../src/lib/news/jina-reader";

async function main() {
  const url =
    "https://www.nasa.gov/missions/webb/nasa-documentary-cosmic-dawn-reveals-untold-story-of-james-webb-space-telescope/";
  const direct = await readWithJina(url);
  const dispatcher = new MockAgent();
  dispatcher.disableNetConnect();
  dispatcher.enableNetConnect("r.jina.ai");
  const target = new URL(url);
  // Only the local origin is simulated; the fallback really calls the public Reader.
  dispatcher
    .get(target.origin)
    .intercept({ path: target.pathname })
    .reply(
      200,
      '<title>Metadado local preservado</title><meta name="author" content="Autor de teste"><p>Conteúdo local insuficiente.</p>',
      { headers: { "content-type": "text/html" } },
    );
  try {
    const article = await extractNews(url, { dispatcher });
    const report = {
      testedAt: new Date().toISOString(),
      url,
      scope: "HTML local simulado insuficiente; DNS e Jina Reader reais, sem chave obrigatória",
      directReader: { title: direct.title, contentLength: direct.content?.length },
      pipeline: {
        method: article.extractionMethod,
        fallback: article.usedFallback,
        contentLength: article.content.length,
        title: article.title,
        authors: article.authors,
      },
    };
    await mkdir("validation", { recursive: true });
    await writeFile("validation/fallback-results.json", JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await dispatcher.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Fallback verification failed");
  process.exitCode = 1;
});
