import { Sparkles } from "lucide-react";
import * as React from "react";

import { AnnotationCallout } from "@/components/atoms/annotation-callout";
import { Badge } from "@/components/atoms/badge";
import { SubmitNewsForm } from "@/components/organisms/submit-news-form";

export function SubmitView(): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-border space-y-1 border-b pb-3.5">
        <Badge variant="tag">CRIADOR DE DESAFIOS</Badge>
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
          Envie sua Própria Notícia
        </h1>
        <p className="text-muted-foreground text-xs">
          Coloque uma notícia para a sala tentar adivinhar a veracidade!
        </p>
      </div>

      {/* Bluff Tip Annotation */}
      <AnnotationCallout
        icon={<Sparkles className="text-primary mt-0.5 h-4 w-4" />}
        title="Dica de Blefe:"
      >
        Se você mandar uma Fake News e seus amigos votarem &ldquo;FATO&rdquo;, você rouba pontos
        deles para o seu ranking!
      </AnnotationCallout>

      {/* Creator Form */}
      <SubmitNewsForm />
    </div>
  );
}
