"use client";

import { Send } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Card } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Textarea } from "@/components/atoms/textarea";
import { VeracityToggle } from "@/components/molecules/veracity-toggle";
import { cn } from "@/lib/utils";

export interface ISubmittedNewsItem {
  id: string;
  headline: string;
  veracity: "fake" | "fact";
  stats: string;
  badge: string;
}

export function SubmitNewsForm({
  className,
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  const [veracity, setVeracity] = React.useState<"fake" | "fact">("fake");
  const [submittedList, setSubmittedList] = React.useState<ISubmittedNewsItem[]>([
    {
      id: "1",
      headline: "Fruta milagrosa cura resfriado em 3h",
      veracity: "fake",
      stats: "4 amigos caíram (+300 XP)",
      badge: "Ativa",
    },
  ]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const form = event.currentTarget;
    const headline = (form.elements.namedItem("headline") as HTMLInputElement).value;
    if (!headline) return;

    setSubmittedList((previous) => [
      {
        id: String(Date.now()),
        headline: headline.length > 40 ? `${headline.slice(0, 40)}...` : headline,
        veracity,
        stats: "Adicionada à rodada dos amigos",
        badge: "Nova",
      },
      ...previous,
    ]);

    form.reset();
    setVeracity("fake");
  };

  return (
    <div className={cn("space-y-6", className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Headline */}
        <div className="space-y-1.5">
          <Label htmlFor="inp-headline" className="text-xs font-bold tracking-wider uppercase">
            Manchete / Título da Notícia *
          </Label>
          <Input
            id="inp-headline"
            name="headline"
            placeholder="Ex: Governo decreta feriado em toda quarta-feira"
            required
          />
        </div>

        {/* Source */}
        <div className="space-y-1.5">
          <Label htmlFor="inp-source" className="text-xs font-bold tracking-wider uppercase">
            Veículo / Fonte Simulada
          </Label>
          <Input id="inp-source" name="source" placeholder="Ex: g1.globo.com ou zap-noticias.net" />
        </div>

        {/* Snippet */}
        <div className="space-y-1.5">
          <Label htmlFor="inp-snippet" className="text-xs font-bold tracking-wider uppercase">
            Texto ou Trecho da Notícia *
          </Label>
          <Textarea
            id="inp-snippet"
            name="snippet"
            placeholder="Escreva o trecho curto que aparecerá no cartão para os amigos lerem..."
            required
          />
        </div>

        {/* Secret Answer */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold tracking-wider uppercase">
            Qual é o Gabarito Real? (Seus amigos não verão agora) *
          </Label>
          <VeracityToggle value={veracity} onChange={setVeracity} />
        </div>

        {/* Explanation */}
        <div className="space-y-1.5">
          <Label htmlFor="inp-explanation" className="text-xs font-bold tracking-wider uppercase">
            Por que é Fato ou Fake? (Explicação para a revelação) *
          </Label>
          <Textarea
            id="inp-explanation"
            name="explanation"
            placeholder="Explique os sinais para quem errar aprender a checar..."
            required
          />
        </div>

        {/* Target Room Card */}
        <Card className="bg-muted/40 border-dashed p-3.5 text-xs">
          <span className="font-bold">Destino do Envio: </span>
          <span className="text-muted-foreground font-mono">Sala Ativa: #884-102 (Turma 9ºB)</span>
        </Card>

        {/* Submit Action */}
        <Button
          type="submit"
          size="lg"
          className="w-full gap-2 text-xs font-bold tracking-wide uppercase"
        >
          <Send className="h-4 w-4" />
          <span>PUBLICAR NOTÍCIA NA SALA</span>
        </Button>
      </form>

      {/* User Submitted News Section */}
      <div className="space-y-2.5 pt-2">
        <span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
          Suas Notícias Enviadas Nesta Sala ({submittedList.length}):
        </span>

        <div className="space-y-2">
          {submittedList.map((item) => (
            <div
              key={item.id}
              className="border-border bg-card text-card-foreground flex items-center justify-between gap-3 rounded-lg border p-3 text-xs shadow-xs"
            >
              <div className="space-y-0.5 truncate">
                <strong className="block truncate font-semibold">
                  &ldquo;{item.headline}&rdquo;
                </strong>
                <span className="text-muted-foreground block text-[11px]">
                  Gabarito: {item.veracity === "fake" ? "FAKE NEWS (Blefe)" : "FATO REAL"} •{" "}
                  {item.stats}
                </span>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {item.badge}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
