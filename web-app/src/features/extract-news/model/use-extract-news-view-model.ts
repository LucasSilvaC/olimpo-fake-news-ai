"use client";

import { useCallback, useState, type FormEvent } from "react";

import type { INewsArticle } from "@/entities/news-article";
import { newsArticleSchema } from "@/lib/news/schemas";

export interface IUseExtractNewsViewModelReturn {
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  error: string | null;
  article: INewsArticle | null;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  reset: () => void;
}

export function useExtractNewsViewModel(): IUseExtractNewsViewModelReturn {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<INewsArticle | null>(null);

  const reset = useCallback(() => {
    setUrl("");
    setError(null);
    setArticle(null);
    setLoading(false);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmedUrl = url.trim();
      if (loading || !trimmedUrl) return;

      setLoading(true);
      setError(null);
      setArticle(null);

      try {
        const response = await fetch("/api/news/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmedUrl }),
          signal: AbortSignal.timeout(35000),
        });

        const data: unknown = await response.json();

        if (!response.ok) {
          const message =
            typeof data === "object" &&
            data &&
            "message" in data &&
            typeof data.message === "string"
              ? data.message
              : "Não foi possível extrair esta notícia.";
          throw new Error(message);
        }

        setArticle(newsArticleSchema.parse(data));
      } catch (failure: unknown) {
        setError(
          failure instanceof Error && failure.name === "Error"
            ? failure.message
            : "A extração não foi concluída. Verifique sua conexão e tente novamente.",
        );
      } finally {
        setLoading(false);
      }
    },
    [loading, url],
  );

  return {
    url,
    setUrl,
    loading,
    error,
    article,
    handleSubmit,
    reset,
  };
}
