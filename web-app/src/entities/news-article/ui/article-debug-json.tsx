import type { INewsArticle } from "../model/types";

interface IArticleDebugJsonProps {
  article: INewsArticle;
}

export function ArticleDebugJson({ article }: IArticleDebugJsonProps): React.ReactElement {
  return (
    <details className="border-border group mt-6 border-t pt-4 text-sm">
      <summary className="hover:text-foreground/80 focus-visible:ring-ring cursor-pointer rounded py-1 font-semibold select-none focus-visible:ring-2 focus-visible:outline-none">
        JSON completo para debugging
      </summary>
      <pre className="bg-muted text-foreground border-border mt-3 max-h-96 overflow-auto rounded-lg border p-4 font-mono text-xs break-words whitespace-pre-wrap">
        {JSON.stringify(article, null, 2)}
      </pre>
    </details>
  );
}
