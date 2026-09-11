"use client";

import type { FormEvent } from "react";

import { Alert } from "@/components/atoms/alert";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";

export interface IExtractNewsFormProps {
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> | void;
}

export function ExtractNewsForm({
  url,
  setUrl,
  loading,
  error,
  onSubmit,
}: IExtractNewsFormProps): React.ReactElement {
  return (
    <form
      onSubmit={onSubmit}
      aria-busy={loading}
      className="border-border bg-card text-card-foreground space-y-4 rounded-xl border p-6 shadow-sm sm:p-7"
    >
      <div className="space-y-2">
        <Label htmlFor="news-url" className="block text-sm font-semibold">
          URL da notícia <span className="text-muted-foreground font-normal">(obrigatória)</span>
        </Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id="news-url"
            name="url"
            type="url"
            required
            maxLength={4096}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://exemplo.com/noticia"
            disabled={loading}
            aria-describedby="url-help extract-error"
            className="h-11 flex-1 text-base sm:text-sm"
          />
          <Button
            type="submit"
            disabled={loading || !url.trim()}
            className="h-11 shrink-0 cursor-pointer px-6 font-semibold"
          >
            {loading ? "Extraindo…" : "Extract"}
          </Button>
        </div>
      </div>

      <p id="url-help" className="text-muted-foreground text-xs sm:text-sm">
        Extração local primeiro. Se o conteúdo for insuficiente, a URL será enviada ao Jina Reader.
      </p>

      <div role="status" aria-live="polite">
        {loading ? (
          <p className="text-muted-foreground animate-pulse text-xs sm:text-sm">
            Buscando e extraindo a notícia. Isso pode levar cerca de 25 segundos.
          </p>
        ) : null}
      </div>

      {error ? (
        <Alert
          id="extract-error"
          role="alert"
          className="border-destructive/40 bg-destructive/10 text-destructive font-medium dark:text-red-300"
        >
          {error}
        </Alert>
      ) : null}
    </form>
  );
}
