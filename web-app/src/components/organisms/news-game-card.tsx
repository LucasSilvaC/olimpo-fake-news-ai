import { Globe, User } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/atoms/badge";
import { Card } from "@/components/atoms/card";
import { cn } from "@/lib/utils";

export interface INewsGameCardProps extends React.HTMLAttributes<HTMLDivElement> {
  authorType: "friend" | "system";
  authorName: string;
  source: string;
  time: string;
  headline: string;
  snippet: string;
  imgLabel?: string;
}

export function NewsGameCard({
  className,
  authorType,
  authorName,
  source,
  time,
  headline,
  snippet,
  imgLabel = "[ X FOTO / PRINT DE REDE SOCIAL X ]",
  ...properties
}: INewsGameCardProps): React.ReactElement {
  return (
    <div className={cn("flex flex-col gap-3.5", className)} {...properties}>
      {/* Author Badge */}
      <div className="flex items-center gap-1.5 self-start">
        <Badge
          variant={authorType === "friend" ? "secondary" : "outline"}
          className="gap-1.5 px-3 py-1"
        >
          {authorType === "friend" ? (
            <User className="text-muted-foreground h-3.5 w-3.5" />
          ) : (
            <Globe className="text-muted-foreground h-3.5 w-3.5" />
          )}
          <span>
            {authorType === "friend" ? `Desafio do Amigo: Enviado por ${authorName}` : authorName}
          </span>
        </Badge>
      </div>

      {/* Main Card */}
      <Card className="p-5 sm:p-6">
        {/* Placeholder image box with technical wireframe look */}
        <div className="border-border bg-muted/40 relative flex h-36 w-full items-center justify-center overflow-hidden rounded-lg border-2 sm:h-44">
          {/* Subtle diagonal lines */}
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <div className="border-foreground absolute inset-0 origin-center scale-150 rotate-12 border-t border-dashed" />
            <div className="border-foreground absolute inset-0 origin-center scale-150 -rotate-12 border-t border-dashed" />
          </div>
          <span className="border-border bg-card text-muted-foreground z-10 rounded border px-3 py-1 font-mono text-[10px] font-bold tracking-wider uppercase shadow-xs sm:text-xs">
            {imgLabel}
          </span>
        </div>

        {/* Source metadata */}
        <div className="text-muted-foreground mt-3 flex items-center justify-between font-mono text-xs">
          <span className="inline-flex max-w-[280px] items-center gap-1 truncate font-semibold">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span>{source}</span>
          </span>
          <span>{time}</span>
        </div>

        {/* Headline */}
        <h2 className="mt-2.5 text-lg font-extrabold tracking-tight sm:text-xl">{headline}</h2>

        {/* Snippet */}
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed sm:text-sm">{snippet}</p>
      </Card>
    </div>
  );
}
