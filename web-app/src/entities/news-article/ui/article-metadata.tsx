import type { INewsArticle } from "../model/types";

interface IArticleMetadataProps {
  article: INewsArticle;
}

export function ArticleMetadata({ article }: IArticleMetadataProps): React.ReactElement {
  return (
    <dl className="border-border grid grid-cols-1 gap-4 border-b pb-6 text-sm sm:grid-cols-2 sm:gap-6">
      <div>
        <dt className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Autores
        </dt>
        <dd className="mt-1 font-medium break-words">
          {article.authors.join(", ") || "Não informados"}
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Publicado em
        </dt>
        <dd className="mt-1 font-medium break-words">{article.publishedAt ?? "Não informado"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Publisher
        </dt>
        <dd className="mt-1 font-medium break-words">{article.publisher ?? "Não informado"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Idioma
        </dt>
        <dd className="mt-1 font-medium break-words">{article.language ?? "Não informado"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Método de extração
        </dt>
        <dd className="mt-1 font-medium break-words">{article.extractionMethod}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Fallback utilizado
        </dt>
        <dd className="mt-1 font-medium break-words">{article.usedFallback ? "Sim" : "Não"}</dd>
      </div>
    </dl>
  );
}
