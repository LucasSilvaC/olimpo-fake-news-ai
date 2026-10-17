"use client";

import { Loader2 } from "lucide-react";
import type { ReactElement } from "react";

import type { VoteOption } from "../model/types";

interface VoteOptionStyle {
  label: string;
  detail: string;
  letter: string;
  ariaLabel: string;
  iconClass: string;
  focusClass: string;
  selectedClass: string;
}

const OPTIONS: Record<VoteOption, VoteOptionStyle> = {
  reliable: {
    label: "Verdadeiro",
    detail: "Fato verificado",
    letter: "V",
    ariaLabel: "Classificar notícia como Verdadeira",
    iconClass: "bg-emerald-500 shadow-emerald-500/25",
    focusClass: "focus:ring-emerald-300",
    selectedClass: "ring-emerald-400",
  },
  unreliable: {
    label: "Falso",
    detail: "Fake news / Incorreto",
    letter: "F",
    ariaLabel: "Classificar notícia como Falsa",
    iconClass: "bg-rose-500 shadow-rose-500/25",
    focusClass: "focus:ring-rose-300",
    selectedClass: "ring-rose-400",
  },
  uncertain: {
    label: "Incerto",
    detail: "Sem dados suficientes",
    letter: "?",
    ariaLabel: "Classificar notícia como Incerta",
    iconClass: "bg-amber-400 shadow-amber-400/25",
    focusClass: "focus:ring-amber-300",
    selectedClass: "ring-amber-400",
  },
};

interface NewsVoteOptionsProps {
  selectedVote: VoteOption | null;
  isSubmitting: boolean;
  disabled: boolean;
  onVote: (vote: VoteOption) => void;
}

export function NewsVoteOptions({
  selectedVote,
  isSubmitting,
  disabled,
  onVote,
}: NewsVoteOptionsProps): ReactElement {
  return (
    <div
      className="grid w-full max-w-4xl grid-cols-1 gap-3.5 sm:grid-cols-3 md:gap-5"
      data-purpose="voting-options"
    >
      {(Object.keys(OPTIONS) as VoteOption[]).map((vote) => {
        const option = OPTIONS[vote];
        const isSelected = selectedVote === vote;
        return (
          <button
            key={vote}
            type="button"
            disabled={disabled || isSubmitting}
            onClick={() => onVote(vote)}
            aria-label={option.ariaLabel}
            className={`flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border border-white/60 bg-white p-3.5 text-slate-800 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-xl focus:ring-4 ${option.focusClass} focus:outline-none active:translate-y-0.5 md:rounded-3xl md:p-4 ${isSelected ? `ring-4 ${option.selectedClass}` : ""} ${isSubmitting && !isSelected ? "opacity-50" : ""}`}
          >
            <span
              className={`flex size-11 min-w-[44px] items-center justify-center rounded-full text-xl font-extrabold text-white shadow-md md:size-13 md:text-2xl ${option.iconClass}`}
            >
              {isSubmitting && isSelected ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                option.letter
              )}
            </span>
            <span className="text-left">
              <span className="block text-lg leading-tight font-bold text-slate-900 md:text-xl">
                {option.label}
              </span>
              <span className="text-xs font-medium text-slate-400">{option.detail}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
