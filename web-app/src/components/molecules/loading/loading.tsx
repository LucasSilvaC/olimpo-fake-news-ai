import { Check, Search, X } from "lucide-react";

import motionStyles from "./loading.module.css";

import { cn } from "@/lib/utils";

type LoadingProps = {
  variant?: "page" | "login";
};

const rootClasses = {
  page: "grid min-h-[100svh] place-items-center bg-[#2563eb] px-5 py-8 text-white",
  login:
    "absolute inset-0 z-10 grid place-items-center rounded-[20px] bg-[rgb(255_255_255_/_97%)] text-[#0f172a]",
};

export function Loading({ variant = "page" }: LoadingProps) {
  const isLogin = variant === "login";

  return (
    <div className={rootClasses[variant]} role="status" aria-live="polite">
      <div className="w-full text-center">
        <div
          className={cn(
            "relative mx-auto h-[210px] w-[260px] [perspective:800px]",
            isLogin ? "mb-5 [zoom:0.75]" : "mb-6",
          )}
          aria-hidden="true"
        >
          <div className="absolute inset-[5px_-8px] rotate-[-24deg] rounded-full border border-[rgb(147_197_253_/_40%)]" />
          <div className="absolute inset-[26px_15px_14px] rotate-[8deg] rounded-[22px] bg-[#93baff]" />
          <div
            className={cn(
              "absolute inset-5 overflow-hidden rounded-[20px] border border-[#dbeafe] bg-[linear-gradient(135deg,_white,_#eff6ff)] p-[19px] shadow-[0_7px_0_#c7dcff,0_20px_35px_rgb(15_23_42_/_18%)]",
              motionStyles.cardFloat,
            )}
          >
            <div className="flex items-center justify-between text-[9px] font-extrabold tracking-[0.12em] text-blue-600">
              <span>OLIMPO / EM JOGO</span>
              <span className="size-[7px] rounded-full bg-amber-400" />
            </div>
            <div className="mt-[18px] flex items-center gap-[9px] text-[17px] font-extrabold text-slate-900">
              <Search className="text-blue-600" size={22} />
              <span>Fato ou fake?</span>
            </div>
            <div className="mt-[13px] grid gap-[6px]">
              <span className="h-[5px] rounded-lg bg-[#dbeafe]" />
              <span className="h-[5px] rounded-lg bg-[#dbeafe] last:w-[65%]" />
            </div>
            <div className="mt-[14px] flex gap-2 text-[11px] font-extrabold">
              <span
                className={cn(
                  "flex flex-1 items-center justify-center gap-[5px] rounded-[8px] bg-emerald-100 p-[7px] text-emerald-700",
                  motionStyles.factVerdict,
                )}
              >
                <Check size={16} /> Fato
              </span>
              <span
                className={cn(
                  "flex flex-1 items-center justify-center gap-[5px] rounded-[8px] bg-rose-100 p-[7px] text-rose-700",
                  motionStyles.fakeVerdict,
                )}
              >
                <X size={16} /> Fake
              </span>
            </div>
            <div
              className={cn(
                "absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgb(96_165_250_/_18%)_50%,transparent_70%)]",
                motionStyles.scanSweep,
              )}
            />
          </div>
          <div
            className={cn(
              "absolute right-0 bottom-[9px] size-[52px] [transform-style:preserve-3d]",
              motionStyles.coinFlip,
            )}
          >
            <span className="absolute inset-0 grid rotate-[-8deg] place-items-center rounded-2xl border-[3px] border-white bg-emerald-500 text-white shadow-[0_6px_16px_rgb(15_23_42_/_15%)] [backface-visibility:hidden]">
              <Check size={26} strokeWidth={3} />
            </span>
            <span className="absolute inset-0 grid [transform:rotateY(180deg)_rotate(-8deg)] place-items-center rounded-2xl border-[3px] border-white bg-rose-400 text-white shadow-[0_6px_16px_rgb(15_23_42_/_15%)] [backface-visibility:hidden]">
              <X size={26} strokeWidth={3} />
            </span>
          </div>
        </div>
        <p
          className={cn(
            "m-0 mb-[10px] text-[10px] font-extrabold tracking-[0.2em] text-amber-200",
            isLogin && "text-[8px] text-blue-600",
          )}
        >
          A VERDADE ENTRA EM JOGO
        </p>
        <p
          className={cn(
            "m-0 text-[clamp(20px,4vw,28px)] font-black tracking-[-0.04em]",
            isLogin && "text-[21px]",
          )}
        >
          {isLogin ? "Entrando no Olimpo" : "Preparando o próximo desafio"}
        </p>
        <p
          className={cn(
            "mt-[10px] mb-0 text-[13px] text-blue-100",
            isLogin && "text-xs text-slate-500",
          )}
        >
          {isLogin ? "Seu próximo desafio está chegando." : "Aguce o olhar. Questione. Descubra."}
        </p>
        <div
          className={cn(
            "mx-auto mt-6 h-1 w-[88px] overflow-hidden rounded-[10px] bg-[rgb(147_197_253_/_30%)]",
            isLogin && "mt-4",
          )}
          aria-hidden="true"
        >
          <span
            className={cn(
              "block h-full w-[45%] rounded-[inherit] bg-amber-300",
              isLogin && "bg-blue-600",
              motionStyles.progressPulse,
            )}
          />
        </div>
        <span className="sr-only">Carregando, aguarde.</span>
      </div>
    </div>
  );
}
