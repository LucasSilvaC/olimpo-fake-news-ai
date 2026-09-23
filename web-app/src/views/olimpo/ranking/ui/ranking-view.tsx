import { Home, RefreshCw, ShieldCheck, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/atoms/badge";
import { Button, buttonVariants } from "@/components/atoms/button";
import { Card } from "@/components/atoms/card";
import { PodiumStep } from "@/components/molecules/podium-step";
import { LeaderboardTable, type ILeaderboardEntry } from "@/components/organisms/leaderboard-table";
import { cn } from "@/lib/utils";

export function RankingView(): React.ReactElement {
  const leaderboardEntries: ILeaderboardEntry[] = [
    { rank: 1, name: "@Sofia", badge: "streak", hits: "4/4", bluffs: "+150", points: 3250 },
    { rank: 2, name: "@Você", hits: "3/4", bluffs: "+300", points: 2890, isYou: true },
    { rank: 3, name: "@Lucas", badge: "bluff", hits: "3/4", bluffs: "+450", points: 2410 },
    { rank: 4, name: "@Pedro", hits: "2/4", bluffs: "0", points: 1850 },
    { rank: 5, name: "@Mariana", hits: "2/4", bluffs: "+150", points: 1720 },
    { rank: 6, name: "@Bia", hits: "1/4", bluffs: "0", points: 980 },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-border flex items-center justify-between border-b pb-3.5">
        <div>
          <Badge variant="tag">PLACAR AO VIVO</Badge>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">
            Classificação dos Amigos
          </h1>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Atualizar</span>
        </Button>
      </div>

      {/* Visual Podium */}
      <div className="border-border bg-card/60 flex items-end justify-center gap-3 rounded-xl border p-4 shadow-xs sm:gap-6 sm:p-8">
        <PodiumStep place={2} name="@Você" initials="VC" score="2.890 pts" medal="PRATA" />
        <PodiumStep place={1} name="@Sofia" initials="SO" score="3.250 pts" medal="OURO" hasCrown />
        <PodiumStep place={3} name="@Lucas" initials="LC" score="2.410 pts" medal="BRONZE" />
      </div>

      {/* Leaderboard Table */}
      <LeaderboardTable entries={leaderboardEntries} />

      {/* Achievements Card */}
      <Card className="bg-muted/30 space-y-2 border-dashed p-4">
        <span className="block text-xs font-bold tracking-wider uppercase">
          Suas Conquistas da Rodada:
        </span>
        <div className="flex flex-wrap gap-2 pt-0.5">
          <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Imune a Fake</span>
          </Badge>
          <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Mestre do Blefe (+300 pts)</span>
          </Badge>
          <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-xs">
            <Zap className="h-3.5 w-3.5 text-yellow-500" />
            <span>Resposta Rápida</span>
          </Badge>
        </div>
      </Card>

      {/* Navigation Actions */}
      <div className="flex flex-col gap-2 pt-1 sm:flex-row">
        <Link
          href="/olimpo"
          className={cn(buttonVariants({ variant: "outline" }), "flex-1 gap-1.5 text-xs font-bold")}
        >
          <Home className="h-3.5 w-3.5" />
          <span>Voltar ao Lobby</span>
        </Link>
        <Link
          href="/olimpo/game"
          className={cn(buttonVariants({ variant: "default" }), "flex-1 gap-1.5 text-xs font-bold")}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Continuar Jogando</span>
        </Link>
      </div>
    </div>
  );
}
