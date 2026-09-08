import assert from "node:assert/strict";
import { test } from "node:test";
import { parseHtml } from "../src/lib/news/extract-news";
import { isPublicAddress } from "../src/lib/news/validate-url";

test("articleBody com marcação retorna texto puro sem scripts e estilos", () => {
  const node = { "@type": "NewsArticle", headline: "Pesquisa", articleBody: "<p>Primeiro parágrafo &amp; dados.</p><script>conteudoMalicioso()</script><style>.hidden{display:none}</style><p>Segundo parágrafo.</p>" };
  const html = `<script type="application/ld+json">${JSON.stringify(node).replaceAll("<", "\\u003c")}</script>`;
  const article = parseHtml(html, "https://news.example/article");
  assert.equal(article.content, "Primeiro parágrafo & dados.\n\nSegundo parágrafo.");
});

test("IPv6 fora de global unicast é bloqueado", () => {
  assert.equal(isPublicAddress("4000::1"), false);
  assert.equal(isPublicAddress("::1234"), false);
});
