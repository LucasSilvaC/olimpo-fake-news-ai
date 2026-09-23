import { Play } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/atoms/badge";
import { buttonVariants } from "@/components/atoms/button";
import { Card } from "@/components/atoms/card";
import { TutorialStepCard } from "@/components/molecules/tutorial-step-card";
import { cn } from "@/lib/utils";

export function TutorialView(): React.ReactElement {
  const steps = [
    {
      stepNumber: 1,
      title: "Entre na Sala com a Galera",
      description:
        "Compartilhe o código PIN de 6 dígitos com os amigos. Todos ficam no mesmo lobby esperando o líder dar o play.",
    },
    {
      stepNumber: 2,
      title: "Vote FATO ou FAKE contra o Relógio",
      description:
        "Em cada rodada, você tem 20 segundos para analisar a manchete, o print e o veículo. Respostas rápidas e corretas acumulam mais pontos!",
    },
    {
      stepNumber: 3,
      title: "Envie Notícias e Blefe seus Amigos",
      description:
        'Na aba "Enviar Notícia", você cria suas próprias perguntas. Se você cadastrar uma fake news convincente e seus amigos acreditarem, você ganha +150 XP de Blefe por cada um que cair!',
    },
    {
      stepNumber: 4,
      title: "Suba no Ranking e Vire um Detetive",
      description:
        "Veja no pódio quem é o melhor checador da turma e desbloqueie badges como Sherlock da Web e Anti-Golpe do WhatsApp.",
    },
  ];

  const checklist = [
    "Desconfie de promessas milagrosas ou cura mágica",
    "Verifique se o veículo citado realmente existe e possui credibilidade",
    "Procure se outros jornais conhecidos noticiaram o mesmo fato",
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-border space-y-1 border-b pb-3.5">
        <Badge variant="tag">GUIA RÁPIDO</Badge>
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
          Como Jogar o Fake-or-Fact
        </h1>
        <p className="text-muted-foreground text-xs">
          Aprenda as regras do Kahoot de Fake News e como blefar seus amigos.
        </p>
      </div>

      {/* Steps list */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {steps.map((step) => (
          <TutorialStepCard
            key={step.stepNumber}
            stepNumber={step.stepNumber}
            title={step.title}
            description={step.description}
          />
        ))}
      </div>

      {/* Fact-Checking Checklist */}
      <Card className="space-y-3 p-4 sm:p-5">
        <span className="block text-xs font-bold tracking-wider uppercase">
          Checklist Rápido de Checagem:
        </span>
        <div className="space-y-2 text-xs">
          {checklist.map((item) => (
            <label
              key={item}
              className="text-muted-foreground flex cursor-default items-start gap-2.5"
            >
              <input
                type="checkbox"
                checked
                readOnly
                className="border-border accent-primary mt-0.5 h-3.5 w-3.5 rounded"
              />
              <span className="leading-snug">{item}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Start Button */}
      <div className="pt-2">
        <Link
          href="/olimpo/game"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "w-full gap-2 text-xs font-extrabold tracking-wide uppercase sm:text-sm",
          )}
        >
          <span>ENTENDI! BORA JOGAR</span>
          <Play className="h-4 w-4 fill-current" />
        </Link>
      </div>
    </div>
  );
}
