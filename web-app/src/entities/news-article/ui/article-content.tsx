import type { INewsArticle } from "../model/types";

interface IArticleContentProps {
  article: INewsArticle;
}

export function ArticleContent({ article }: IArticleContentProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Descrição
        </h3>
        <p className="text-foreground text-sm leading-relaxed sm:text-base">
          {article.description ?? "Não informada"}
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Imagem (URL)
        </h3>
        <p className="text-sm break-all sm:text-base">
          {article.imageUrl ? (
            <a
              href={article.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium hover:underline"
            >
              {article.imageUrl}
            </a>
          ) : (
            <span className="text-muted-foreground">Não informada</span>
          )}
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Conteúdo principal
        </h3>
        <div className="article-content text-foreground bg-muted/30 border-border/60 rounded-lg border p-4 text-sm leading-relaxed break-words whitespace-pre-wrap sm:text-base">
          {article.content}
        </div>
      </div>
    </div>
  );
}
