import assert from "node:assert/strict";
import { test } from "node:test";

import { MockAgent } from "undici";

import { POST } from "../src/app/api/news/extract/route";
import { extractNews, parseHtml } from "../src/lib/news/extract-news";
import { fetchPage, MAX_HTML_BYTES } from "../src/lib/news/fetch-page";
import { validateUrl, isPublicAddress } from "../src/lib/news/validate-url";

const content =
  "A equipe apresentou os resultados da pesquisa nesta terça-feira. Os pesquisadores analisaram dados de diferentes regiões e explicaram as conclusões em uma reunião pública. A próxima etapa acompanhará os efeitos do projeto durante os próximos meses, com relatórios abertos à comunidade e participação das universidades. A notícia descreve os resultados observados e as etapas previstas para a continuidade dos trabalhos.";
const articleHtml = `<html lang="pt-BR"><head><title>Título do documento</title><meta property="og:title" content="Título Open Graph"><meta property="og:site_name" content="Jornal Público"></head><body><nav>Menu irrelevante</nav><article><h1>Título da pesquisa</h1><p>${content}</p><p>${content}</p></article><footer>Rodapé irrelevante</footer></body></html>`;
const resolver = async () => [{ address: "93.184.215.14", family: 4 }];
const htmlHeaders = { "content-type": "text/html; charset=utf-8" };

test("extrai artigo SSR sem scripts, navegação ou HTML e respeita Open Graph", () => {
  const article = parseHtml(
    articleHtml.replace("</body>", '<script>throw new Error("EXECUTED")</script></body>'),
    "https://news.example/article",
  );
  assert.equal(article.title, "Título Open Graph");
  assert.equal(article.publisher, "Jornal Público");
  assert.equal(article.language, "pt-BR");
  assert.ok(article.content.includes("Os pesquisadores"));
  assert.doesNotMatch(article.content, /Menu irrelevante|Rodapé irrelevante|EXECUTED|<p>/);
});

for (const type of ["NewsArticle", "Article", "BlogPosting"]) {
  for (const wrapper of ["direct", "array", "graph"]) {
    test(`JSON-LD: ${type}, ${wrapper}, autores e URLs normalizados`, () => {
      const node = {
        "@type": ["Thing", type],
        headline: "Título estruturado",
        description: " Descrição   estruturada ",
        articleBody: content,
        author: [{ name: "Ana" }, { name: "Ana" }, "Bruno"],
        datePublished: "2026-09-08T10:00:00-03:00",
        dateModified: "ontem",
        image: [{ url: "/foto.jpg" }],
        publisher: { name: "Editora" },
        inLanguage: "pt-BR",
        mainEntityOfPage: { "@id": "/canonical" },
      };
      const payload =
        wrapper === "array" ? [node] : wrapper === "graph" ? { "@graph": [node] } : node;
      const article = parseHtml(
        `<script type="application/ld+json">broken</script><script type="application/ld+json">${JSON.stringify(payload)}</script>`,
        "https://news.example/artigo",
      );
      assert.equal(article.title, "Título estruturado");
      assert.equal(article.description, "Descrição estruturada");
      assert.deepEqual(article.authors, ["Ana", "Bruno"]);
      assert.equal(article.publishedAt, "2026-09-08T10:00:00-03:00");
      assert.equal(article.modifiedAt, null);
      assert.equal(article.imageUrl, "https://news.example/foto.jpg");
      assert.equal(article.canonicalUrl, "https://news.example/canonical");
      assert.equal(article.content, content);
    });
  }
}

test("Readability completa articleBody truncado e mantém precedência JSON-LD", () => {
  const article = parseHtml(
    articleHtml.replace(
      "</head>",
      `<script type="application/ld+json">${JSON.stringify({ "@type": "NewsArticle", headline: "Título JSON-LD", articleBody: "Resumo curto" })}</script></head>`,
    ),
    "https://news.example/article",
  );
  assert.equal(article.title, "Título JSON-LD");
  assert.ok(article.content.includes(content));
});

test("extração local suficiente não depende de autor, data, imagem ou Jina", async () => {
  const dispatcher = new MockAgent();
  dispatcher.disableNetConnect();
  try {
    dispatcher
      .get("https://news.example")
      .intercept({ path: "/article" })
      .reply(200, articleHtml, { headers: htmlHeaders });
    const article = await extractNews("https://news.example/article", { resolver, dispatcher });
    assert.equal(article.extractionMethod, "local");
    assert.equal(article.usedFallback, false);
    assert.equal(article.imageUrl, null);
    dispatcher.assertNoPendingInterceptors();
  } finally {
    await dispatcher.close();
  }
});

test("fallback completa conteúdo parcial e preserva metadados locais", async () => {
  const dispatcher = new MockAgent();
  dispatcher.disableNetConnect();
  try {
    const partial =
      '<meta property="og:title" content="Título local"><meta name="author" content="Ana"><meta property="article:published_time" content="2026-09-08"><body><p>Resumo curto</p></body>';
    dispatcher
      .get("https://news.example")
      .intercept({ path: "/partial" })
      .reply(200, partial, { headers: htmlHeaders });
    dispatcher
      .get("https://r.jina.ai")
      .intercept({
        path: "/https://news.example/partial",
        headers: { accept: "application/json", "x-respond-with": "text" },
      })
      .reply(200, {
        code: 200,
        data: {
          title: "Título do Jina",
          content,
          url: "https://news.example/partial",
          timestamp: "2026-09-09",
        },
      });
    const article = await extractNews("https://news.example/partial", { resolver, dispatcher });
    assert.equal(article.title, "Título local");
    assert.deepEqual(article.authors, ["Ana"]);
    assert.equal(article.content, content);
    assert.equal(article.publishedAt, "2026-09-08");
    assert.equal(article.extractionMethod, "jina");
    assert.equal(article.usedFallback, true);
    dispatcher.assertNoPendingInterceptors();
  } finally {
    await dispatcher.close();
  }
});

test("bloqueio local recuperável tenta Jina e falha claramente se ambos falham", async () => {
  const dispatcher = new MockAgent();
  dispatcher.disableNetConnect();
  try {
    dispatcher.get("https://news.example").intercept({ path: "/blocked" }).reply(403, "Forbidden");
    dispatcher
      .get("https://r.jina.ai")
      .intercept({ path: "/https://news.example/blocked" })
      .reply(429, "Limited");
    await assert.rejects(extractNews("https://news.example/blocked", { resolver, dispatcher }), {
      code: "EXTRACTION_FAILED",
    });
    dispatcher.assertNoPendingInterceptors();
  } finally {
    await dispatcher.close();
  }
});

test("página não-artigo e fallback insuficiente resultam em 422", async () => {
  const dispatcher = new MockAgent();
  dispatcher.disableNetConnect();
  try {
    dispatcher
      .get("https://news.example")
      .intercept({ path: "/" })
      .reply(200, "<title>Home</title><nav>Home Contato</nav>", { headers: htmlHeaders });
    dispatcher
      .get("https://r.jina.ai")
      .intercept({ path: "/https://news.example/" })
      .reply(200, { code: 200, data: { title: "Home", content: "Home Contato" } });
    await assert.rejects(extractNews("https://news.example/", { resolver, dispatcher }), {
      code: "EXTRACTION_FAILED",
      status: 422,
    });
  } finally {
    await dispatcher.close();
  }
});

test("não inventa sucesso quando Jina retorna schema inesperado", async () => {
  const dispatcher = new MockAgent();
  dispatcher.disableNetConnect();
  try {
    dispatcher.get("https://news.example").intercept({ path: "/bad" }).reply(503, "Unavailable");
    dispatcher
      .get("https://r.jina.ai")
      .intercept({ path: "/https://news.example/bad" })
      .reply(200, { data: { content: 42 } });
    await assert.rejects(extractNews("https://news.example/bad", { resolver, dispatcher }), {
      code: "EXTRACTION_FAILED",
    });
  } finally {
    await dispatcher.close();
  }
});

test("SSRF bloqueia IPv4/IPv6 especiais, formatos alternativos e credenciais", async () => {
  const urls = [
    "http://localhost",
    "http://sub.localhost",
    "http://localhost.",
    "http://127.0.0.1",
    "http://127.1",
    "http://2130706433",
    "http://0x7f000001",
    "http://10.0.0.1",
    "http://172.16.0.1",
    "http://192.168.0.1",
    "http://169.254.169.254/latest/meta-data",
    "http://100.64.0.1",
    "http://0.0.0.0",
    "http://224.0.0.1",
    "http://192.0.2.1",
    "http://[::1]",
    "http://[::]",
    "http://[fc00::1]",
    "http://[fe80::1]",
    "http://[::ffff:127.0.0.1]",
    "http://[64:ff9b::a00:1]",
    "http://metadata.google.internal",
    "https://user:pass@news.example",
    "https://news.example:8443",
  ];
  for (const url of urls) {
    await assert.rejects(
      validateUrl(url, AbortSignal.timeout(1000), async () => {
        throw new Error("DNS must not run");
      }),
      { code: "UNSAFE_URL" },
      url,
    );
  }
  assert.equal(isPublicAddress("8.8.8.8"), true);
  assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
});

test("DNS misto público/privado e redirect interno bloqueiam antes do fetch/Jina", async () => {
  await assert.rejects(
    validateUrl("https://news.example", AbortSignal.timeout(1000), async () => [
      ...(await resolver()),
      { address: "10.0.0.1", family: 4 },
    ]),
    { code: "UNSAFE_URL" },
  );
  const dispatcher = new MockAgent();
  dispatcher.disableNetConnect();
  try {
    dispatcher
      .get("https://news.example")
      .intercept({ path: "/redirect" })
      .reply(302, "", { headers: { location: "http://169.254.169.254/" } });
    await assert.rejects(extractNews("https://news.example/redirect", { resolver, dispatcher }), {
      code: "UNSAFE_URL",
    });
  } finally {
    await dispatcher.close();
  }
});

test("redirect relativo público funciona e o quarto redirect é recusado", async () => {
  const dispatcher = new MockAgent();
  dispatcher.disableNetConnect();
  try {
    const pool = dispatcher.get("https://news.example");
    pool.intercept({ path: "/old" }).reply(302, "", { headers: { location: "/article" } });
    pool.intercept({ path: "/article" }).reply(200, articleHtml, { headers: htmlHeaders });
    assert.equal(
      (await fetchPage("https://news.example/old", { resolver, dispatcher })).url,
      "https://news.example/article",
    );
    for (let i = 0; i < 4; i++)
      pool
        .intercept({ path: `/hop${i}` })
        .reply(302, "", { headers: { location: `/hop${i + 1}` } });
    await assert.rejects(fetchPage("https://news.example/hop0", { resolver, dispatcher }), {
      code: "EXTRACTION_FAILED",
    });
    dispatcher.assertNoPendingInterceptors();
  } finally {
    await dispatcher.close();
  }
});

test("limites de HTML e content-type são aplicados mesmo sem content-length", async () => {
  const dispatcher = new MockAgent();
  dispatcher.disableNetConnect();
  try {
    const pool = dispatcher.get("https://news.example");
    pool
      .intercept({ path: "/huge" })
      .reply(200, "x".repeat(MAX_HTML_BYTES + 1), { headers: htmlHeaders });
    pool
      .intercept({ path: "/pdf" })
      .reply(200, "%PDF-1.0", { headers: { "content-type": "application/pdf" } });
    for (const path of ["huge", "pdf"])
      await assert.rejects(fetchPage(`https://news.example/${path}`, { resolver, dispatcher }), {
        code: "EXTRACTION_FAILED",
      });
  } finally {
    await dispatcher.close();
  }
});

test("404 real preserva status e não é mascarado por fallback", async () => {
  const dispatcher = new MockAgent();
  dispatcher.disableNetConnect();
  try {
    dispatcher.get("https://news.example").intercept({ path: "/missing" }).reply(404, "not found");
    await assert.rejects(extractNews("https://news.example/missing", { resolver, dispatcher }), {
      status: 404,
      code: "NOT_FOUND",
    });
  } finally {
    await dispatcher.close();
  }
});

test("DNS respeita cancelamento antes e durante a resolução", async () => {
  await assert.rejects(validateUrl("https://news.example", AbortSignal.abort(), resolver), {
    name: "AbortError",
  });
  const controller = new AbortController();
  const validation = validateUrl(
    "https://news.example",
    controller.signal,
    () => new Promise(() => {}),
  );
  controller.abort();
  await assert.rejects(validation, { name: "AbortError" });
});

test("Route Handler valida JSON, body, URL e SSRF sem stack trace", async () => {
  const cases = [
    ["{", "INVALID_URL"],
    [JSON.stringify({ url: "abc" }), "INVALID_URL"],
    [JSON.stringify({ url: "file:///etc/passwd" }), "INVALID_URL"],
    [JSON.stringify({ url: "http://localhost:3000" }), "UNSAFE_URL"],
    [JSON.stringify({ url: "http://192.168.0.1" }), "UNSAFE_URL"],
    [JSON.stringify({ url: "https://news.example", extra: "x".repeat(9000) }), "INVALID_URL"],
  ];
  for (const [body, expected] of cases) {
    const response = await POST(
      new Request("http://localhost/api/news/extract", { method: "POST", body }),
    );
    const data = await response.json();
    assert.equal(response.status, 400);
    assert.equal(data.error, expected);
    assert.deepEqual(Object.keys(data).sort(), ["error", "message"]);
  }
});
