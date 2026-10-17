import { Check, Clock3, ExternalLink, LoaderCircle, Play, Plus, Radio } from "lucide-react";
import type { FormEvent, ReactElement } from "react";

import type { RoomLobbyNewsPreview } from "../model/types";

import type { RoomDTO } from "@/app/api/rooms/entities";


interface LobbyPlaylistPanelProps {
  room: RoomDTO;
  isHost: boolean;
  roomIsWaiting: boolean;
  rounds: number;
  newsUrl: string;
  setNewsUrl: (value: string) => void;
  isAddingNews: boolean;
  isLoadingPrepared: boolean;
  isStarting: boolean;
  isLanding: boolean;
  newsPreviews: RoomLobbyNewsPreview[];
  handleAddNews: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  handleStartGame: () => void | Promise<void>;
}

export function LobbyPlaylistPanel({
  room,
  isHost,
  roomIsWaiting,
  rounds,
  newsUrl,
  setNewsUrl,
  isAddingNews,
  isLoadingPrepared,
  isStarting,
  isLanding,
  newsPreviews,
  handleAddNews,
  handleStartGame,
}: LobbyPlaylistPanelProps): ReactElement {
  return (
    <>
      <div className="grid gap-4 border-t border-slate-100 pt-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold tracking-wide text-slate-900 uppercase">
                Baralho da partida
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {rounds} {rounds === 1 ? "notícia" : "notícias"} · {room.roundDurationSeconds}s por
                rodada
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800">
              <Clock3 className="size-3.5" aria-hidden="true" />
              {room.roundDurationSeconds} segundos
            </span>
          </div>

          {isLoadingPrepared && (
            <p role="status" className="text-sm text-slate-500">
              Preparando notícias...
            </p>
          )}

          {isHost && roomIsWaiting ? (
            <form
              noValidate
              onSubmit={(event) => void handleAddNews(event)}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <label className="sr-only" htmlFor="room-news-url">
                URL de uma notícia para adicionar ao baralho
              </label>
              <div className="relative min-w-0 flex-1">
                <ExternalLink
                  className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="room-news-url"
                  type="url"
                  value={newsUrl}
                  onChange={(event) => setNewsUrl(event.currentTarget.value)}
                  placeholder="Cole a URL de uma notícia"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isAddingNews}
                className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-50 px-5 text-sm font-extrabold text-blue-800 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAddingNews ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="size-4" aria-hidden="true" />
                )}
                Adicionar notícia
              </button>
            </form>
          ) : (
            <p className="text-sm text-slate-500">
              {rounds > 0
                ? "O anfitrião já preparou as notícias desta partida."
                : "O anfitrião está preparando as notícias desta partida."}
            </p>
          )}
        </div>

        {isHost ? (
          <div className="flex flex-col gap-2 lg:min-w-64">
            <button
              type="button"
              onClick={() => void handleStartGame()}
              disabled={!roomIsWaiting || isStarting || isLanding || isLoadingPrepared}
              className="inline-flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 text-sm font-black tracking-wide text-slate-950 shadow-lg shadow-amber-400/30 transition-all hover:-translate-y-0.5 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
            >
              {isStarting ? (
                <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
              ) : room.status === "in_progress" ? (
                <Check className="size-5" aria-hidden="true" />
              ) : (
                <Play className="size-5 fill-current" aria-hidden="true" />
              )}
              {isLanding
                ? "Aterrissando..."
                : isStarting
                  ? "Iniciando..."
                  : room.status === "in_progress"
                    ? "Partida iniciada"
                    : "Iniciar partida"}
            </button>
            {roomIsWaiting && rounds < 1 ? (
              <p className="text-center text-xs font-medium text-slate-500">
                Adicione ao menos uma notícia para iniciar.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-2xl bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-600 lg:min-w-64">
            <Radio className="mr-2 size-4 text-emerald-500" aria-hidden="true" />
            Esperando o anfitrião iniciar
          </div>
        )}
      </div>

      {isHost ? <LobbyNewsPreviewList newsPreviews={newsPreviews} /> : null}
    </>
  );
}

function LobbyNewsPreviewList({
  newsPreviews,
}: {
  newsPreviews: RoomLobbyNewsPreview[];
}): ReactElement {
  return (
    <section aria-label="Notícias adicionadas" className="space-y-3 border-t border-slate-100 pt-4">
      <h3 className="text-sm font-bold text-slate-900">Notícias adicionadas</h3>
      {newsPreviews.length > 0 ? (
        <ol className="grid gap-3 sm:grid-cols-2">
          {newsPreviews.map((news) => (
            <li
              key={news.id}
              className="flex min-w-0 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-extrabold text-blue-800">
                {news.roundOrder}
              </span>
              <div className="min-w-0 flex-1">
                <p className="mb-1 truncate text-xs text-slate-500">
                  {news.publisher ?? "Fonte da notícia"}
                </p>
                <a
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex cursor-pointer items-start gap-2 rounded text-sm font-bold text-slate-900 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  <span className="line-clamp-2">{news.title}</span>
                  <ExternalLink
                    className="mt-0.5 size-3.5 shrink-0 text-blue-600"
                    aria-hidden="true"
                  />
                  <span className="sr-only">(abre em uma nova aba)</span>
                </a>
                {news.description ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {news.description}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
          As notícias adicionadas ao baralho aparecerão aqui.
        </p>
      )}
    </section>
  );
}
