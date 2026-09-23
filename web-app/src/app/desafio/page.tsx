'use client';

import React, { useState, useEffect } from 'react';
import { ExtractNewsForm, useExtractNewsViewModel } from "@/features/extract-news";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Trophy, Check, X, Target, RotateCcw } from "lucide-react";

// Tipagens para o estado do jogo
type GameState = 'setup' | 'playing' | 'result';

interface WordObject {
  text: string;
  clean: string;
}

export default function DesafioPage(): React.ReactElement {
  // Hook de extração da sua arquitetura
  const { url, setUrl, loading: isExtracting, error: extractError, article, handleSubmit } = useExtractNewsViewModel();
  
  // Estados do Jogo
  const [gameState, setGameState] = useState<GameState>('setup');
  const [words, setWords] = useState<WordObject[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [score, setScore] = useState({ hits: 0, misses: 0, totalTarget: 0 });
  const [modelVerdict, setModelVerdict] = useState<{ isFake: boolean, reason: string } | null>(null);

  // Palavras que simulam o que a IA consideraria como "fake news" ou clickbait
  const mockModelTriggers = ["urgente", "chocante", "exclusivo", "segredo", "espalhem", "ninguém", "comprovado"];

  // Prepara o tabuleiro assim que a notícia é extraída
  useEffect(() => {
    if (article && article.content) {
      const splitText = article.content.split(/(\s+)/).filter(w => w.trim().length > 0).map(word => ({
        text: word,
        clean: word.replace(/[.,!?"]/g, '').toLowerCase()
      }));
      setWords(splitText);
      setGameState('playing');
    }
  }, [article]);

  const toggleWordSelection = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleSubmitGame = () => {
    let hits = 0;
    let misses = 0;
    
    selectedIndices.forEach(index => {
      if (mockModelTriggers.includes(words[index].clean)) {
        hits++;
      } else {
        misses++;
      }
    });

    const totalTarget = words.filter(w => mockModelTriggers.includes(w.clean)).length;
    
    setScore({ hits, misses, totalTarget });
    
    // Simula o veredito geral da IA sobre a notícia
    setModelVerdict({
      isFake: totalTarget > 2,
      reason: totalTarget > 2 
        ? "O modelo classificou esta notícia como DESINFORMAÇÃO devido ao alto volume de termos apelativos e tom alarmista."
        : "O modelo classificou esta notícia como VERDADEIRA, pois apresenta linguagem neutra e baixo índice de termos manipuladores."
    });

    setGameState('result');
  };

  const handleReset = () => {
    setUrl("");
    setSelectedIndices([]);
    setScore({ hits: 0, misses: 0, totalTarget: 0 });
    setModelVerdict(null);
    setGameState('setup');
    // Em um cenário real, você também chamaria uma função do ViewModel para limpar o estado do 'article'
  };

  return (
    <div className="pt-24 px-4 space-y-8 max-w-4xl mx-auto pb-12">
      <header className="space-y-2 flex justify-between items-end">
        <div>
          <span className="text-xs font-bold tracking-widest text-amber-500 uppercase flex items-center gap-2 mb-2">
            <Target className="h-4 w-4" /> GAMIFICAÇÃO
          </span>
          <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Desafio do Detetive
          </h1>
          <p className="text-muted-foreground text-base mt-2">
            Extraia um texto e tente adivinhar quais palavras nossa IA considera como manipuladoras ou clickbait.
          </p>
        </div>
        
        {gameState === 'result' && (
          <Badge className="hidden sm:flex text-lg py-1 px-4 bg-amber-500 hover:bg-amber-600 text-white gap-2">
            <Trophy className="h-5 w-5" /> 
            {Math.max(0, (score.hits * 10) - (score.misses * 5))} Pts
          </Badge>
        )}
      </header>

      {gameState === 'setup' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ExtractNewsForm
            url={url}
            setUrl={setUrl}
            loading={isExtracting}
            error={extractError}
            onSubmit={handleSubmit}
          />
          {!isExtracting && !extractError && (
            <p className="text-muted-foreground py-10 text-center text-sm">
              Cole uma URL acima para carregar o tabuleiro do desafio.
            </p>
          )}
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900">
            <AlertTitle className="text-blue-800 dark:text-blue-300 font-bold flex items-center gap-2">
              <Target className="h-5 w-5" /> Sua vez!
            </AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-400 mt-1">
              Leia o texto abaixo e <strong>clique nas palavras</strong> que você acha que indicam exagero emocional, urgência falsa ou desinformação.
            </AlertDescription>
          </Alert>
          
          <div className="p-6 bg-background border rounded-xl shadow-sm text-lg leading-loose flex flex-wrap gap-x-1 gap-y-2">
            {words.map((wordObj, index) => {
              const isSelected = selectedIndices.includes(index);
              return (
                <button
                  key={index}
                  onClick={() => toggleWordSelection(index)}
                  className={`px-1.5 py-0.5 rounded-md transition-all duration-200 select-none ${
                    isSelected 
                      ? "bg-primary text-primary-foreground shadow-md transform scale-105 font-medium" 
                      : "hover:bg-muted bg-transparent text-foreground"
                  }`}
                  aria-pressed={isSelected}
                >
                  {wordObj.text}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">
              {selectedIndices.length} palavra(s) selecionada(s)
            </span>
            <Button 
              onClick={handleSubmitGame} 
              disabled={selectedIndices.length === 0}
              size="lg"
              className="px-8"
            >
              Verificar Respostas
            </Button>
          </div>
        </div>
      )}

      {gameState === 'result' && modelVerdict && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* Veredito do Modelo */}
          <Alert variant={modelVerdict.isFake ? "destructive" : "default"} className={!modelVerdict.isFake ? "border-green-500 text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800" : ""}>
            <AlertTitle className="text-xl font-bold mb-2">
              Veredito da IA: {modelVerdict.isFake ? "Falso / Manipulador" : "Verdadeiro / Confiável"}
            </AlertTitle>
            <AlertDescription className="text-base">
              {modelVerdict.reason}
            </AlertDescription>
          </Alert>

          {/* Placar do Usuário */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl shadow-sm">
              <Check className="h-10 w-10 text-green-600 dark:text-green-500 mx-auto mb-3" />
              <h4 className="font-bold text-green-900 dark:text-green-400 text-3xl">{score.hits}</h4>
              <p className="text-sm text-green-700 dark:text-green-500 font-medium mt-1">Acertos</p>
            </div>
            <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl shadow-sm">
              <X className="h-10 w-10 text-red-600 dark:text-red-500 mx-auto mb-3" />
              <h4 className="font-bold text-red-900 dark:text-red-400 text-3xl">{score.misses}</h4>
              <p className="text-sm text-red-700 dark:text-red-500 font-medium mt-1">Erros (Falsos Positivos)</p>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-muted-foreground text-lg">
              A IA encontrou <strong>{score.totalTarget}</strong> palavras suspeitas no total. 
              {score.hits === score.totalTarget && score.totalTarget > 0 
                ? " Você tem uma leitura perfeitamente alinhada com o modelo!" 
                : " Continue treinando para identificar todos os gatilhos."}
            </p>

            <Button onClick={handleReset} variant="outline" size="lg" className="w-full sm:w-auto">
              <RotateCcw className="mr-2 h-4 w-4" /> Jogar Novamente
            </Button>
          </div>

        </div>
      )}
    </div>
  );
}