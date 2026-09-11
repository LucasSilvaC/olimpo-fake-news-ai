import type { INewsArticle } from "../model/types";

import { ArticleContent } from "./article-content";
import { ArticleDebugJson } from "./article-debug-json";
import { ArticleHeader } from "./article-header";
import { ArticleMetadata } from "./article-metadata";

interface IArticlePreviewProps {
  article: INewsArticle;
}

export function ArticlePreview({ article }: IArticlePreviewProps): React.ReactElement {
  return (
    <section
      aria-label="Resultado da extração"
      className="border-border bg-card text-card-foreground space-y-6 rounded-xl border p-6 shadow-sm sm:p-7"
    >
      <ArticleHeader title={article.title} extractionMethod={article.extractionMethod} />
      <ArticleMetadata article={article} />
      <ArticleContent article={article} />
      <ArticleDebugJson article={article} />
    </section>
  );
}
