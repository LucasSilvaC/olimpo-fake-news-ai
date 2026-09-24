// /src/widgets/home-hero.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertCircle, Search, Loader2, ShieldCheck, Activity } from "lucide-react";

export function AnalysisUnified() {
  const [content, setContent] = React.useState("");
  const [error, setError] = React.useState("");
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isTrueNews, setIsTrueNews] = React.useState(false); // Inicia simulando Falsa para ver o destaque
  const [result, setResult] = React.useState<{ text: string; isUrl: boolean } | null>(null);
  
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const isSubmitDisabled = content.trim().length === 0 || isAnalyzing;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (error) setError("");
    setResult(null);

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(60, textarea.scrollHeight)}px`;
    }
  };

  const handleAnalyze = () => {
    const isUrl = /^(http|https):\/\/[^ "]+$/.test(content.trim());
    const isTooShort = !isUrl && content.trim().split(/\s+/).length < 10;

    if (isTooShort) {
      setError("O texto parece demasiado curto. Insira a notícia completa ou o link.");
      return;
    }

    setError("");
    setIsAnalyzing(true);

    setTimeout(() => {
      setIsAnalyzing(false);
      // Simulação do texto lido
      const finalText = isUrl 
        ? "Descobriram supostamente um segredo escondido nos bastidores do governo. A notícia urgente e chocante revela que a eficácia do tratamento foi manipulada para enganar a população."
        : content;
        
      setResult({ text: finalText, isUrl });
    }, 2500);
  };

  // Função atualizada para destacar apenas palavras falsas em vermelho
  const renderHighlightedText = (text: string) => {
    if (isTrueNews) {
      return <span>{text}</span>;
    }

    // Gatilhos comuns de fake news
    const fakeTriggers = ["supostamente", "escondido", "urgente", "chocante", "enganar"];

    return text.split(" ").map((word, index) => {
      const cleanWord = word.replace(/[.,]/g, "").toLowerCase();
      if (fakeTriggers.includes(cleanWord)) {
        return (
          <strong key={index} className="text-[#CF240A] dark:text-[#F04D36] font-bold">
            {word}{" "}
          </strong>
        );
      }
      return <span key={index}>{word} </span>;
    });
  };

  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 animate-in fade-in duration-700">
      
      <div className="text-center max-w-3xl mb-10 space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-[#7A2ADB]/10 dark:bg-[#9F5BFF]/10 rounded-full shadow-inner">
            <ShieldCheck className="w-14 h-14 text-[#7A2ADB] dark:text-[#9F5BFF]" />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
          Verifique a <span style={{ color: "var(--roxo, #7A2ADB)" }}>Veracidade</span><br /> das Notícias
        </h1>
      </div>

      <div className="w-full max-w-3xl relative bg-background/60 backdrop-blur-md p-6 rounded-2xl border shadow-sm">
        
        {/* Toggle Provisório */}
        <div className="flex items-center justify-end gap-3 mb-4">
          <Label htmlFor="simulation-toggle" className="text-sm text-muted-foreground">
            Simular Notícia: {isTrueNews ? "Verdadeira" : "Falsa"}
          </Label>
          <Switch 
            id="simulation-toggle" 
            checked={isTrueNews} 
            onCheckedChange={setIsTrueNews}
            className={isTrueNews ? "data-[state=checked]:bg-[#3BA809]" : "data-[state=unchecked]:bg-[#CF240A]"}
          />
        </div>

        <Textarea
          ref={textareaRef}
          placeholder="Cole o link do site ou o texto da notícia..."
          className="w-full resize-none overflow-hidden text-lg p-5 rounded-xl border-border focus:border-[#7A2ADB] focus:ring-2 focus:ring-[#7A2ADB]/20 transition-all"
          style={{ minHeight: "60px" }}
          value={content}
          onChange={handleContentChange}
          disabled={isAnalyzing}
        />

        {error && (
          <div className="flex items-center gap-2 mt-4 text-sm font-medium text-[#D19200] dark:text-[#EBA814]">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button 
          size="lg"
          className="w-full mt-6 h-14 text-lg bg-[#7A2ADB] hover:bg-[#7A2ADB]/90 text-white rounded-xl shadow-lg transition-all"
          disabled={isSubmitDisabled}
          onClick={handleAnalyze}
        >
          {isAnalyzing ? (
            <><Loader2 className="w-6 h-6 animate-spin mr-2" /> A processar dados...</>
          ) : (
            <><Search className="w-6 h-6 mr-2" /> Verificar Notícia</>
          )}
        </Button>

        {isAnalyzing && (
          <div className="flex justify-center items-center gap-2 text-muted-foreground animate-pulse mt-4">
            <Activity className="w-4 h-4 text-[#7A2ADB]" />
            <span className="text-sm font-medium">Extraindo e analisando conteúdo web...</span>
          </div>
        )}

        {/* Exibição do Resultado Simulado */}
        {result && !isAnalyzing && (
          <div className="mt-8 p-6 bg-muted/50 rounded-xl border animate-in slide-in-from-bottom-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              {result.isUrl ? "Texto Extraído da URL:" : "Texto Analisado:"}
            </h3>
            <p className="text-foreground leading-relaxed text-lg">
              {renderHighlightedText(result.text)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}