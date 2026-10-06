"use client";

import { ArrowRight, LoaderCircle, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { joinRoomAction } from "@/app/api/rooms/actions/join-room.action";

export function JoinMatchCard(): React.ReactElement {
  const router = useRouter();
  const [pin, setPin] = React.useState("");
  const [isJoining, setIsJoining] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (isJoining) return;

    const normalizedPin = pin.replace(/\D/g, "").slice(0, 6);
    if (normalizedPin.length !== 6) {
      toast.error("Digite os 6 números do código da sala.");
      return;
    }

    setIsJoining(true);
    try {
      const result = await joinRoomAction({ pin: normalizedPin });
      if (!result.success) {
        toast.error(result.error);
        setIsJoining(false);
        return;
      }

      router.push("/sala/" + encodeURIComponent(result.room.pin));
    } catch {
      toast.error("Não foi possível entrar na sala. Confira o código e tente novamente.");
      setIsJoining(false);
    }
  };

  const handlePinChange = (value: string): void => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setPin(digits.length > 3 ? digits.slice(0, 3) + " " + digits.slice(3) : digits);
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="group relative flex min-h-[350px] flex-col justify-between overflow-hidden rounded-3xl border border-white bg-white p-6 text-slate-800 shadow-xl shadow-blue-950/20 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-950/30 sm:p-7"
    >
      <span className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />

      <div>
        <span className="mb-6 flex size-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-100/70">
          <LogIn className="size-7" strokeWidth={2.2} aria-hidden="true" />
        </span>
        <span className="mb-2 inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold tracking-wider text-blue-800 uppercase">
          Entrar com PIN
        </span>
        <h2 className="mb-2.5 text-2xl font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600">
          Juntar à partida
        </h2>
        <p className="mb-4 text-base leading-relaxed font-medium text-slate-500">
          Digite o código compartilhado pelo anfitrião para entrar na sala e jogar com seus amigos.
        </p>
        <label className="sr-only" htmlFor="match-pin">
          Código de acesso da sala
        </label>
        <input
          id="match-pin"
          name="pin"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={7}
          value={pin}
          onChange={(event) => handlePinChange(event.currentTarget.value)}
          placeholder="PIN de 6 dígitos"
          className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-center text-base font-bold tracking-[0.35em] text-slate-800 uppercase transition-all placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
        />
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
        <span className="text-sm font-semibold text-slate-600">Acesso instantâneo</span>
        <button
          type="submit"
          disabled={isJoining || pin.replace(/\D/g, "").length !== 6}
          className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-blue-600 px-4 text-sm font-bold text-white shadow-md shadow-blue-600/30 transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isJoining ? (
            <>
              Entrando
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            </>
          ) : (
            <>
              Entrar
              <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
