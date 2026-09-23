import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  HelpCircle,
  Search,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/atoms/badge";
import { buttonVariants } from "@/components/atoms/button";
import { Card } from "@/components/atoms/card";
import { PollBar } from "@/components/molecules/poll-bar";
import { cn } from "@/lib/utils";

export interface IRoundResultCardProps extends React.HTMLAttributes<HTMLDivElement> {
  status: "correct" | "bluffed" | "timeout" | "doubt";
  headline: string;
  pointsText: string;
  fakePercent: number;
  factPercent: number;
  explanation: string;
  nextHref?: string;
  nextLabel?: string;
}

export function RoundResultCard({
  className,
  status = "correct",
  headline,
  pointsText,
  fakePercent,
  factPercent,
  explanation,
  nextHref = "/olimpo/game",
  nextLabel = "Próxima Notícia",
  ...properties
}: IRoundResultCardProps): React.ReactElement {
  const statusConfig = {
    correct: {
      badgeText: "VOCÊ ACERTOU!",
      icon: CheckCircle2,
      badgeVariant: "default" as const,
    },
    bluffed: {
      badgeText: "CAIU NO BLEFE!",
      icon: AlertTriangle,
      badgeVariant: "destructive" as const,
    },
    timeout: {
      badgeText: "TEMPO ESGOTADO!",
      icon: Clock,
      badgeVariant: "secondary" as const,
    },
    doubt: {
      badgeText: "EM DÚVIDA / CHECAGEM",
      icon: HelpCircle,
      badgeVariant: "outline" as const,
    },
  };

  const { badgeText, icon: Icon, badgeVariant } = statusConfig[status];

  return (
    <Card
      className={cn("flex flex-col gap-4 border-2 p-5 shadow-sm sm:p-6", className)}
      {...properties}
    >
      {/* Verdict Header */}
      <div className="border-border flex flex-wrap items-center gap-3 border-b pb-3.5">
        <Badge variant={badgeVariant} className="gap-1.5 px-3 py-1 text-xs font-black">
          <Icon className="h-4 w-4" />
          <span>{badgeText}</span>
        </Badge>
        <div>
          <h3 className="text-sm font-extrabold">{headline}</h3>
          <p className="text-muted-foreground text-xs">{pointsText}</p>
        </div>
      </div>

      {/* Poll Voting Bar */}
      <div>
        <span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
          Como seus amigos da sala votaram:
        </span>
        <div className="mt-2">
          <PollBar fakePercent={fakePercent} factPercent={factPercent} />
        </div>
      </div>

      {/* Fact-Checking Explanation */}
      <div className="border-border bg-muted/50 rounded-lg border p-3.5 text-xs leading-relaxed">
        <span className="text-foreground mb-1 flex items-center gap-1.5 font-bold">
          <Search className="h-3.5 w-3.5" />
          <span>Análise & Sinais de Alerta:</span>
        </span>
        <p className="text-muted-foreground">{explanation}</p>
      </div>

      {/* Action Buttons using Next.js Links */}
      <div className="flex flex-col gap-2 pt-1 sm:flex-row">
        <Link
          href="/olimpo/ranking"
          className={cn(buttonVariants({ variant: "outline" }), "flex-1 gap-1.5 text-xs font-bold")}
        >
          <Trophy className="h-3.5 w-3.5" />
          <span>Ver Placar da Sala</span>
        </Link>
        <Link
          href={nextHref}
          className={cn(buttonVariants({ variant: "default" }), "flex-1 gap-1.5 text-xs font-bold")}
        >
          <span>{nextLabel}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}
