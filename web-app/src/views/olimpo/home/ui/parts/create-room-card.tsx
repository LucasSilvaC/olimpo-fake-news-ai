"use client";

import { ArrowRight, LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { createRoomAction } from "@/app/api/rooms/actions/create-room.action";

interface ICreateRoomCardProps {
  creatorName: string;
}

export function CreateRoomCard({ creatorName }: ICreateRoomCardProps): React.ReactElement {
  const router = useRouter();
  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreateRoom = async (): Promise<void> => {
    if (isCreating) return;

    setIsCreating(true);
    const roomName = creatorName.trim()
      ? "Sala de " + creatorName.trim()
      : "Sala de investigadores";
    const toastId = toast.loading("Criando sua sala...", {
      description: "Estamos preparando o espaço para a partida.",
    });

    try {
      const result = await createRoomAction({ name: roomName, roundDurationSeconds: 30 });
      if (!result.success) {
        toast.error("Não foi possível criar a sala.", {
          id: toastId,
          description: "Tente novamente em instantes.",
        });
        setIsCreating(false);
        return;
      }

      toast.success("Sala criada com sucesso!", {
        id: toastId,
        description: "Compartilhe o PIN " + result.pin + " com os jogadores.",
      });
      router.push("/sala/" + encodeURIComponent(result.pin));
    } catch {
      toast.error("Não foi possível criar a sala.", {
        id: toastId,
        description: "Confira sua conexão e tente novamente.",
      });
      setIsCreating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCreateRoom()}
      disabled={isCreating}
      aria-busy={isCreating}
      className="group relative flex min-h-[350px] w-full cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-white bg-white p-6 text-left text-slate-800 shadow-xl shadow-blue-950/20 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-950/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300 disabled:cursor-wait disabled:hover:translate-y-0 sm:p-7"
    >
      <span className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-amber-400 to-amber-500" />

      <div>
        <span className="mb-6 flex size-14 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-500 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-amber-100/70">
          {isCreating ? (
            <LoaderCircle className="size-7 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="size-7" strokeWidth={2.2} aria-hidden="true" />
          )}
        </span>
        <span className="mb-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold tracking-wider text-amber-800 uppercase">
          Modo anfitrião
        </span>
        <h2 className="mb-2.5 text-2xl font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600">
          {isCreating ? "Preparando sua sala..." : "Criar partida"}
        </h2>
        <p className="text-base leading-relaxed font-medium text-slate-500">
          Abra uma sala para jogar com seus amigos. Você será o anfitrião e poderá compartilhar o
          código de acesso.
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
        <span className="text-sm font-semibold text-slate-600">
          {isCreating ? "Gerando seu código" : "Criar sala e gerar PIN"}
        </span>
        <span
          className="inline-flex size-10 items-center justify-center rounded-full bg-amber-400 text-slate-900 shadow-md shadow-amber-400/30 transition-all group-hover:translate-x-1 group-hover:bg-amber-500"
          aria-hidden="true"
        >
          <ArrowRight className="size-5" strokeWidth={2.5} />
        </span>
      </div>
    </button>
  );
}
