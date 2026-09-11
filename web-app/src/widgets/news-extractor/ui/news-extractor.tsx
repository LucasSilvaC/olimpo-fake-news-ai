"use client";

import { ArticlePreview } from "@/entities/news-article";
import { ExtractNewsForm, useExtractNewsViewModel } from "@/features/extract-news";

export function NewsExtractor(): React.ReactElement {
  const { url, setUrl, loading, error, article, handleSubmit } = useExtractNewsViewModel();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <span className="text-xs font-bold tracking-widest text-[#c98e26] uppercase dark:text-[#e5ad42]">
          EL DORADO · PROVA DE CONCEITO
        </span>
        <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          News Parser
        </h1>
        <p className="text-muted-foreground text-base">
          Extraia o conteúdo principal e os metadados de uma notícia pública.
        </p>
      </header>

      <ExtractNewsForm
        url={url}
        setUrl={setUrl}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
      />

      {article ? (
        <ArticlePreview article={article} />
      ) : !loading && !error ? (
        <p className="text-muted-foreground py-10 text-center text-sm">
          Cole uma URL acima para começar.
        </p>
      ) : null}
    </div>
  );
}
