import { BookOpen, Play, Plus } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { AnnotationCallout } from "@/components/atoms/annotation-callout";
import { Avatar } from "@/components/atoms/avatar";
import { Badge } from "@/components/atoms/badge";
import { buttonVariants } from "@/components/atoms/button";
import { Card } from "@/components/atoms/card";
import { PlayerChip } from "@/components/molecules/player-chip";
import { RoomPinCard } from "@/components/molecules/room-pin-card";
import { cn } from "@/lib/utils";

export function LobbyView(): React.ReactElement {
  const players = [
    { name: "@Você", initials: "VC", isYou: true, isLeader: true },
    { name: "@Lucas", initials: "LC", statusText: "📝+2" },
    { name: "@Sofia", initials: "SO", statusText: "📝+1" },
    { name: "@Pedro", initials: "PD", statusText: "Pronto" },
    { name: "@Mariana", initials: "MA", statusText: "Pronto" },
    { name: "@Bia", initials: "BI", statusText: "Digitando..." },
  ];

  return (
    <div className="space-y-4">
      {/* Lobby Header */}
      <div className="border-border flex items-start justify-between border-b pb-3.5">
        <div className="space-y-1">
          <Badge variant="tag">LOBBY MULTIPLAYER</Badge>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Sala da Turma 9ºB</h1>
          <p className="text-muted-foreground text-xs">Criado por @Você • Modo: Notícias Mistas</p>
        </div>
        <Avatar size="lg" initials="VC" title="Seu perfil (@Você)" />
      </div>

      {/* UX Note */}
      <AnnotationCallout title="Dinâmica de Jogo:">
        Os participantes entram pelo PIN ou criam notícias para enganar os amigos antes de iniciar a
        rodada.
      </AnnotationCallout>

      {/* PIN Card */}
      <RoomPinCard pin="884 102" />

      {/* Connected Players Grid - spans nicely across wide desktop */}
      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-wider uppercase">
            Amigos na Sala ({players.length} conectados)
          </span>
          <span className="text-muted-foreground font-mono text-[10px] font-semibold">
            AGUARDANDO O LÍDER
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
          {players.map((p) => (
            <PlayerChip
              key={p.name}
              name={p.name}
              initials={p.initials}
              isYou={p.isYou}
              isLeader={p.isLeader}
              statusText={p.statusText}
            />
          ))}
        </div>
      </Card>

      {/* Deck Configuration */}
      <Card className="bg-muted/30 border-dashed p-4">
        <span className="block text-xs font-bold tracking-wider uppercase">Baralho da Partida</span>
        <p className="text-muted-foreground mt-1 text-xs">
          Total de rodadas: <strong className="text-foreground font-bold">4 notícias</strong>{" "}
          (inclui notícias do sistema e as cadastradas pelos amigos da sala).
        </p>
      </Card>

      {/* Primary Actions */}
      <div className="flex flex-col gap-2 pt-2">
        <Link
          href="/olimpo/game"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "w-full gap-2 text-xs font-extrabold tracking-wide uppercase sm:text-sm",
          )}
        >
          <Play className="h-4 w-4 fill-current" />
          <span>INICIAR PARTIDA AGORA</span>
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/olimpo/submit"
            className={cn(buttonVariants({ variant: "outline" }), "gap-1.5 text-xs font-bold")}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Enviar Minha Notícia</span>
          </Link>
          <Link
            href="/olimpo/tutorial"
            className={cn(buttonVariants({ variant: "outline" }), "gap-1.5 text-xs font-bold")}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Ver Como Jogar</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
