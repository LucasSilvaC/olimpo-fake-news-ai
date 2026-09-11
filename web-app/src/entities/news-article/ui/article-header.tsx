import type { INewsArticle } from "../model/types";

interface IArticleHeaderProps {
  title: string | null;
  extractionMethod: INewsArticle["extractionMethod"];
}

export function ArticleHeader({
  title,
  extractionMethod,
}: IArticleHeaderProps): React.ReactElement {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <h2 className="text-xl leading-snug font-bold tracking-tight break-words sm:text-2xl">
        {title ?? "Título não informado"}
      </h2>
      <span className="border-border bg-muted text-foreground inline-flex items-center self-start rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap">
        {extractionMethod === "local" ? "Extração local" : "Jina Reader"}
      </span>
    </div>
  );
}
