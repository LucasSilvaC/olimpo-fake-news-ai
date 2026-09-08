"use client";

import { useState, type FormEvent } from "react";
import type { INewsArticle } from "@/lib/news/types";
import { newsArticleSchema } from "@/lib/news/schemas";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<INewsArticle | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || !url.trim()) return;
    setLoading(true);
    setError(null);
    setArticle(null);
    try {
      const response = await fetch("/api/news/extract", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }), signal: AbortSignal.timeout(35000),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message = typeof data === "object" && data && "message" in data && typeof data.message === "string" ? data.message : "Não foi possível extrair esta notícia.";
        throw new Error(message);
      }
      setArticle(newsArticleSchema.parse(data));
    } catch (failure) {
      setError(failure instanceof Error && failure.name === "Error" ? failure.message : "A extração não foi concluída. Verifique sua conexão e tente novamente.");
    } finally { setLoading(false); }
  }

  return (
    <main>
      <header><span className="eyebrow">EL DORADO · PROVA DE CONCEITO</span><h1>News Parser</h1><p>Extraia o conteúdo principal e os metadados de uma notícia pública.</p></header>
      <form onSubmit={submit} aria-busy={loading}>
        <label htmlFor="news-url">URL da notícia <span>(obrigatória)</span></label>
        <div className="input-row">
          <input id="news-url" name="url" type="url" required maxLength={4096} value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://exemplo.com/noticia" disabled={loading} aria-describedby="url-help extract-error" />
          <button type="submit" disabled={loading || !url.trim()}>{loading ? "Extraindo…" : "Extract"}</button>
        </div>
        <p id="url-help" className="hint">Extração local primeiro. Se o conteúdo for insuficiente, a URL será enviada ao Jina Reader.</p>
        <div role="status" aria-live="polite">{loading ? <p className="hint">Buscando e extraindo a notícia. Isso pode levar cerca de 25 segundos.</p> : null}</div>
        {error ? <p id="extract-error" role="alert" className="error">{error}</p> : null}
      </form>
      {article ? (
        <section aria-label="Resultado da extração">
          <div className="result-heading"><h2>{article.title ?? "Título não informado"}</h2><span className="badge">{article.extractionMethod === "local" ? "Extração local" : "Jina Reader"}</span></div>
          <dl>
            <div><dt>Autores</dt><dd>{article.authors.join(", ") || "Não informados"}</dd></div>
            <div><dt>Publicado em</dt><dd>{article.publishedAt ?? "Não informado"}</dd></div>
            <div><dt>Publisher</dt><dd>{article.publisher ?? "Não informado"}</dd></div>
            <div><dt>Idioma</dt><dd>{article.language ?? "Não informado"}</dd></div>
            <div><dt>Método de extração</dt><dd>{article.extractionMethod}</dd></div>
            <div><dt>Fallback utilizado</dt><dd>{article.usedFallback ? "Sim" : "Não"}</dd></div>
          </dl>
          <h3>Descrição</h3><p>{article.description ?? "Não informada"}</p>
          <h3>Imagem (URL)</h3><p className="url-text">{article.imageUrl ? <a href={article.imageUrl} target="_blank" rel="noopener noreferrer">{article.imageUrl}</a> : "Não informada"}</p>
          <h3>Conteúdo principal</h3><div className="article-content">{article.content}</div>
          <details><summary>JSON completo para debugging</summary><pre>{JSON.stringify(article, null, 2)}</pre></details>
        </section>
      ) : !loading && !error ? <p className="empty">Cole uma URL acima para começar.</p> : null}
    </main>
  );
}
