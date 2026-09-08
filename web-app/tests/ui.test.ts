import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import Home from "../src/app/page";
import type { INewsArticle } from "../src/lib/news/types";

test("formulário exibe loading, recupera erro e mostra artigo e JSON sem executar HTML", async (context) => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "window", { configurable: true, value: dom.window });
  Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
  const { createRoot } = await import("react-dom/client");
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);
  let resolveResponse!: (response: Response) => void;
  const requestBodies: string[] = [];
  context.mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    requestBodies.push(String(init.body));
    return new Promise<Response>((resolve) => { resolveResponse = resolve; });
  });
  try {
    await act(async () => root.render(createElement(Home)));
    const input = container.querySelector("input")!;
    const button = container.querySelector("button")!;
    const form = container.querySelector("form")!;
    assert.equal(button.disabled, true);
    await act(async () => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!.call(input, "https://news.example/article");
      input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
    assert.equal(button.disabled, false);
    await act(async () => { form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true })); });
    assert.equal(button.disabled, true);
    assert.match(button.textContent ?? "", /Extraindo/);
    await act(async () => { resolveResponse(Response.json({ error: "EXTRACTION_FAILED", message: "Tente outra notícia." }, { status: 422 })); });
    assert.equal(container.querySelector('[role="alert"]')?.textContent, "Tente outra notícia.");
    assert.equal(input.value, "https://news.example/article");
    assert.equal(button.disabled, false);
    await act(async () => { form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true })); });
    assert.equal(container.querySelector('[role="alert"]'), null);
    const article: INewsArticle = { url: input.value, canonicalUrl: null, title: "Resultado da pesquisa", description: null, authors: [], publishedAt: null, modifiedAt: null, content: '<script>alert("unsafe")</script> Conteúdo principal.', imageUrl: null, publisher: null, language: null, extractionMethod: "jina", usedFallback: true };
    await act(async () => { resolveResponse(Response.json(article)); });
    assert.equal(container.querySelector("h2")?.textContent, article.title);
    assert.equal(container.querySelector(".article-content")?.textContent, article.content);
    assert.equal(container.querySelector("script"), null);
    assert.deepEqual(JSON.parse(container.querySelector("pre")!.textContent!), article);
    assert.match(container.textContent ?? "", /Fallback utilizadoSim/);
    assert.deepEqual(JSON.parse(requestBodies[0]), { url: input.value });
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow); else Reflect.deleteProperty(globalThis, "window");
    if (previousDocument) Object.defineProperty(globalThis, "document", previousDocument); else Reflect.deleteProperty(globalThis, "document");
    Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
  }
});
