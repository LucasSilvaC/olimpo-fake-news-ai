import assert from "node:assert/strict";
import { test } from "node:test";

import { MockAgent } from "undici";

import { extractNews } from "../src/lib/news/extract-news";

test("resposta real do Reader em modo text usa data.text", async () => {
  const dispatcher = new MockAgent();
  dispatcher.disableNetConnect();
  const content =
    "O estudo apresenta novas evidências sobre o tema, com dados verificados pelos pesquisadores. ".repeat(
      5,
    );
  try {
    dispatcher
      .get("https://news.example")
      .intercept({ path: "/article" })
      .reply(200, "<title>Artigo</title>", { headers: { "content-type": "text/html" } });
    dispatcher
      .get("https://r.jina.ai")
      .intercept({ path: "/https://news.example/article" })
      .reply(200, {
        code: 200,
        data: {
          title: "Artigo",
          text: content,
          httpStatus: 200,
          url: "https://news.example/article",
        },
      });
    const article = await extractNews("https://news.example/article", {
      dispatcher,
      resolver: async () => [{ address: "93.184.215.14", family: 4 }],
    });
    assert.equal(article.content, content.trim());
    assert.equal(article.extractionMethod, "jina");
    assert.equal(article.usedFallback, true);
  } finally {
    await dispatcher.close();
  }
});
