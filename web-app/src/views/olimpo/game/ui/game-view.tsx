"use client";

import { CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import * as React from "react";

import { DecisionButton } from "@/components/molecules/decision-button";
import { GameHud } from "@/components/organisms/game-hud";
import { NewsGameCard } from "@/components/organisms/news-game-card";
import { RoundResultCard } from "@/components/organisms/round-result-card";

export function GameView(): React.ReactElement {
  const [hasAnswered, setHasAnswered] = React.useState(false);
  const [answerType, setAnswerType] = React.useState<"fake" | "fact" | "doubt">("fake");

  const handleVote = (choice: "fake" | "fact" | "doubt"): void => {
    setAnswerType(choice);
    setHasAnswered(true);
  };

  return (
    <div className="space-y-4">
      {/* Game HUD */}
      <GameHud
        currentRound={1}
        totalRounds={4}
        score={1450}
        timeLeft={hasAnswered ? 12 : 20}
        totalTime={20}
      />

      {/* Main News Card */}
      <NewsGameCard
        authorType="friend"
        authorName="@Lucas"
        source="portalnoticiasja.com.br"
        time="Há 2 horas"
        headline="Cientistas descobrem fruta da Amazônia que cura resfriado em 3 horas, afirma site"
        snippet="“O estudo, ainda não publicado em revista médica, teria comprovado 100% de eficácia em testes preliminares”, afirma o texto que viralizou em grupos de mensagens familiares."
        imgLabel="[ X FOTO / PRINT DE REDE SOCIAL X ]"
      />

      {/* Voting Controls or Feedback */}
      {!hasAnswered ? (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <DecisionButton
            variant="fake"
            icon={<XCircle className="text-destructive mb-1 h-6 w-6" />}
            label="É Fake News"
            subtitle="Boato / Mentira"
            onClick={() => handleVote("fake")}
          />
          <DecisionButton
            variant="fact"
            icon={<CheckCircle2 className="text-primary mb-1 h-6 w-6" />}
            label="É Fato Real"
            subtitle="Notícia Verídica"
            onClick={() => handleVote("fact")}
          />
          <DecisionButton
            variant="doubt"
            icon={<HelpCircle className="text-muted-foreground mr-1.5 h-5 w-5" />}
            label="Tenho Dúvida / Checar Fontes"
            subtitle="Ganhe pontos pelo senso crítico"
            onClick={() => handleVote("doubt")}
          />
        </div>
      ) : (
        <RoundResultCard
          status={answerType === "fake" ? "correct" : answerType === "fact" ? "bluffed" : "doubt"}
          headline={
            answerType === "fake"
              ? "Gabarito: ERA FAKE NEWS!"
              : answerType === "fact"
                ? "Gabarito: ERA FAKE NEWS!"
                : "Na dúvida, você acertou em checar! Era Fake."
          }
          pointsText={
            answerType === "fake"
              ? "+350 pontos para você (+250 base +100 velocidade)"
              : answerType === "fact"
                ? "+0 pontos. O amigo @Lucas ganhou +150 pts de bônus por te enganar!"
                : "+80 pontos pelo senso crítico de checar fontes"
          }
          fakePercent={70}
          factPercent={30}
          explanation="A matéria promete milagre ('cura em 3 horas'), não cita universidade responsável e não possui publicação em revista científica com revisão por pares."
          nextHref="/olimpo/ranking"
          nextLabel="Ver Placar da Sala"
        />
      )}
    </div>
  );
}
