"use client";

import { ExternalLink, Newspaper } from "lucide-react";
import Image from "next/image";
import type { ReactElement } from "react";

import type { INewsArticleData } from "../model/types";

interface NewsArticleCardProps {
  article: INewsArticleData;
  publisherName: string;
  authorAndDate: string;
  imageError: boolean;
  onImageError: () => void;
}

export function NewsArticleCard({
  article,
  publisherName,
  authorAndDate,
  imageError,
  onImageError,
}: NewsArticleCardProps): ReactElement {
  return (
    <article
      className="mb-6 w-full max-w-4xl rounded-3xl border border-white/40 bg-white p-5 text-slate-800 shadow-2xl transition-all duration-300 md:p-6"
      data-purpose="news-card"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs md:text-sm">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-bold tracking-wider text-white uppercase shadow-sm">
            {publisherName}
          </span>
          <span className="font-semibold text-slate-600">Checagem de Fatos</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span>{authorAndDate}</span>
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
              title="Abrir matéria original"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>

      <h2 className="mb-3.5 text-xl leading-snug font-extrabold tracking-tight text-slate-900 md:text-2xl lg:text-[26px]">
        {article.title || "Notícia selecionada para verificação"}
      </h2>

      <div className="relative mb-4 h-48 w-full overflow-hidden rounded-2xl bg-slate-100 sm:h-56 md:h-64">
        {article.imageUrl && !imageError ? (
          <div className="relative size-full">
            <Image
              src={article.imageUrl}
              alt={article.title || "Imagem da notícia"}
              fill
              className="object-cover object-center transition-transform duration-500 ease-out hover:scale-105"
              onError={onImageError}
              unoptimized
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
            <Newspaper className="size-12 stroke-1" aria-hidden="true" />
            <span className="text-xs font-medium">Matéria original sem imagem</span>
          </div>
        )}
      </div>

      <p className="line-clamp-4 text-sm leading-relaxed text-slate-600 md:text-base">
        {article.description ||
          article.content?.slice(0, 320) ||
          "Leia com atenção os detalhes da publicação e pondere se os fatos relatados possuem respaldo em veículos de imprensa e fontes primárias idôneas."}
      </p>

      {article.content && (
        <details className="mt-4 rounded-xl border border-slate-200 p-3 text-sm">
          <summary className="cursor-pointer font-semibold text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600">
            Ler o corpo da notícia
          </summary>
          <div className="mt-3 max-h-80 overflow-y-auto pr-2 leading-relaxed whitespace-pre-wrap text-slate-700">
            {article.content}
          </div>
        </details>
      )}
    </article>
  );
}
