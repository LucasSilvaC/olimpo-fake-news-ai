'use client';

import React, { useState } from 'react';
import { ArticlePreview } from "@/entities/news-article";
import { ExtractNewsForm, useExtractNewsViewModel } from "@/features/extract-news";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";

interface MockResult {
  isFake: boolean;
  reason: string;
  triggers: string[];
}

export function NewsEvaluatorPage(): React.ReactElement {
  const { url, setUrl, loading: isExtracting, error: extractError, article, handleSubmit } = useExtractNewsViewModel();
  
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<MockResult | null>(null);

  const handleEvaluateMock = () => {
    setIsEvaluating(true);
    
    setTimeout(() => {
      setEvaluationResult({
        isFake: false,
        reason: "[Simulação] O modelo detectou um tom alarmista e uso excessivo de palavras apelativas, características comuns em clickbaits ou desinformação.",
        triggers: ["urgente", "chocante", "exclusivo", "que", "do", "da", "para", "com"] 
      });
      setIsEvaluating(false);
    }, 2000);
  };

  const renderHighlightedText = (text: string, triggers: string[]) => {
    if (!text) return null;
    const words = text.split(/(\s+)/);
    
    return words.map((word, index) => {
      const cleanWord = word.replace(/[.,!?"]/g, '').toLowerCase();
      const isTrigger = triggers.includes(cleanWord);
      return isTrigger ? (
        // Classes dark: adicionadas para inverter a cor no modo noturno
        <strong key={index} className="bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200 font-bold px-1 rounded mx-0.5">
          {word}
        </strong>
      ) : (
        <span key={index}>{word}</span>
      );
    });
  };

  return (
    // Adicionado pt-24 (padding-top) para empurrar o conteúdo para baixo do header flutuante e px-4 para margem no celular
    <div className="pt-24 px-4 space-y-8 max-w-4xl mx-auto">
      <header className="space-y-2">
        <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Detector de fakenews
        </h1>
        <p className="text-muted-foreground text-base">
          Extraia uma notícia e utilize nossa IA para analisar padrões de desinformação.
        </p>
      </header>

      <ExtractNewsForm
        url={url}
        setUrl={setUrl}
        loading={isExtracting}
        error={extractError}
        onSubmit={handleSubmit}
      />

      {article ? (
        <div className="space-y-8 animate-in fade-in">
          <ArticlePreview article={article} />
          
          {!evaluationResult ? (
            <Button 
              onClick={handleEvaluateMock} 
              disabled={isEvaluating}
              className="w-full h-14 text-lg"
            >
              {isEvaluating ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analisando com a IA...</>
              ) : (
                "Avaliar Veracidade com IA"
              )}
            </Button>
          ) : (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
              {/* Classes dark: adicionadas no alerta de sucesso */}
              <Alert variant={evaluationResult.isFake ? "destructive" : "default"} className={!evaluationResult.isFake ? "border-green-500 text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800" : ""}>
                {evaluationResult.isFake ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />}
                <AlertTitle className="text-lg font-bold">
                  {evaluationResult.isFake ? "Alerta de Desinformação!" : "Parece Confiável!"}
                </AlertTitle>
                <AlertDescription className="text-base mt-2">
                  {evaluationResult.reason}
                </AlertDescription>
              </Alert>

              {/* Trocado bg-slate-50 por bg-muted para usar as variáveis nativas do tema */}
              <div className="bg-muted p-6 rounded-md border text-lg leading-relaxed">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Texto Analisado (Simulação de Padrões Destacados)
                </h3>
                <p className="text-foreground">
                  {renderHighlightedText(article.content || "", evaluationResult.triggers)}
                </p>
              </div>

              <Button variant="outline" onClick={() => setEvaluationResult(null)} className="w-full">
                Testar Novamente
              </Button>
            </div>
          )}
        </div>
      ) : !isExtracting && !extractError ? (
        <p className="text-muted-foreground py-10 text-center text-sm">
          Cole uma URL para começar a análise.
        </p>
      ) : null}
    </div>
  );
}