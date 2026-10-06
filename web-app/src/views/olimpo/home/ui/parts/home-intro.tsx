import { Sparkles } from "lucide-react";

export function HomeIntro(): React.ReactElement {
  return (
    <header className="mx-auto mb-9 max-w-2xl text-center md:mb-12">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-transparent bg-white px-3.5 py-1.5 text-sm font-semibold text-blue-900 shadow-sm">
        <Sparkles className="size-3.5 text-amber-300" aria-hidden="true" />
        Combate à desinformação
      </div>
      <h1 className="mb-4 text-4xl leading-tight font-extrabold tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
        O que vamos desvendar hoje?
      </h1>
      <p className="mx-auto max-w-xl text-base leading-relaxed font-medium text-white sm:text-lg md:text-xl">
        Entre no jogo da verdade: crie salas competitivas, junte-se aos seus amigos ou treine em
        desafios solo.
      </p>
    </header>
  );
}
