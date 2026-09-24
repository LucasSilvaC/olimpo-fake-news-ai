"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertCircle, Search, Loader2, ShieldCheck, Activity } from "lucide-react";
import { useExtractNewsViewModel } from "@/features/extract-news";

export function AnalysisUnified() {
  const [content, setContent] = React.useState("");
  const [localError, setLocalError] = React.useState("");
  
  const [isTrueNews, setIsTrueNews] = React.useState(false);
  const [probability, setProbability] = React.useState(0);
  const [simulatedText, setSimulatedText] = React.useState<string | null>(null);
  const [isSimulatingText, setIsSimulatingText] = React.useState(false);

  const { url, setUrl, loading: extractorLoading, error: extractorError, article, handleSubmit } = useExtractNewsViewModel();

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const isAnalyzing = isSimulatingText || extractorLoading;
  const isSubmitDisabled = content.trim().length === 0 || isAnalyzing;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setUrl(newContent); 
    
    if (localError) setLocalError("");
    setSimulatedText(null);

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(60, textarea.scrollHeight)}px`;
    }
  };

  const handleAnalyze = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    
    const isUrl = /^(http|https):\/\/[^ "]+$/.test(content.trim());
    
    if (isUrl) {
      handleSubmit(e);
      setSimulatedText(null);
    } else {
      const isTooShort = content.trim().split(/\s+/).length < 10;
      if (isTooShort) {
        setLocalError("O texto parece demasiado curto. Insira a notícia completa ou o link.");
        return;
      }
      
      setIsSimulatingText(true);
      setTimeout(() => {
        setIsSimulatingText(false);
        setSimulatedText(content);
      }, 2500);
    }
  };

  React.useEffect(() => {
    if (article || simulatedText) {
      const randomProb = Math.floor(Math.random() * 50) + 51;
      setProbability(randomProb);
    }
  }, [article, simulatedText]);

  const renderHighlightedText = (text: string) => {
    const fakeTriggers = ["supostamente", "escondido", "urgente", "chocante", "enganar", "oficiais", "eficácia", "recorde", "drasticamente"];
    
    const colorClass = isTrueNews ? "text-[var(--brand-green)]" : "text-[var(--brand-red)]";
    const bgClass = isTrueNews ? "bg-[var(--brand-green)]/10" : "bg-[var(--brand-red)]/10";

    return text.split(" ").map((word, index) => {
      const cleanWord = word.replace(/[.,()"]/g, "").toLowerCase();
      
      const isHighlighted = fakeTriggers.includes(cleanWord) || (index % 12 === 3 && cleanWord.length > 5);

      if (isHighlighted) {
        return (
          <strong key={index} className={`${colorClass} ${bgClass} px-1 rounded-md font-bold transition-colors`}>
            {word}{" "}
          </strong>
        );
      }
      return <span key={index}>{word} </span>;
    });
  };

  const hasResult = !!article || !!simulatedText;
  const displayError = localError || extractorError;

  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 animate-in fade-in duration-700">
      
      <div className="text-center max-w-3xl mb-10 space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-[var(--brand-purple)]/10 rounded-full shadow-inner">
            <ShieldCheck className="w-14 h-14 text-[var(--brand-purple)]" />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
          Verifique a <span className="text-[var(--brand-purple)]">Veracidade</span><br /> das Notícias
        </h1>
      </div>

      <div className="w-full max-w-3xl relative bg-background/60 backdrop-blur-md p-6 rounded-2xl border shadow-sm">
        
        <div className="flex items-center justify-end gap-3 mb-4">
          <Label htmlFor="simulation-toggle" className="text-sm font-medium text-muted-foreground">
            Simular Resultado: {isTrueNews ? "Verdadeiro" : "Falso"}
          </Label>
          <Switch 
            id="simulation-toggle" 
            checked={isTrueNews} 
            onCheckedChange={setIsTrueNews}
            className={isTrueNews ? "data-[state=checked]:bg-[var(--brand-green)]" : "data-[state=unchecked]:bg-[var(--brand-red)]"}
          />
        </div>

        <form onSubmit={handleAnalyze} className="space-y-4">
          <Textarea
            ref={textareaRef}
            placeholder="Cole o link do site ou o texto da notícia..."
            className="w-full resize-none overflow-hidden text-lg p-5 rounded-xl border-border focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all"
            style={{ minHeight: "60px" }}
            value={content}
            onChange={handleContentChange}
            disabled={isAnalyzing}
          />

          {displayError && (
            <div className="flex items-center gap-2 px-2 text-sm font-medium text-[var(--brand-gold)]">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          <Button 
            type="submit"
            size="lg"
            className="w-full h-14 text-lg bg-[var(--brand-purple)] hover:opacity-90 text-white rounded-xl shadow-lg transition-all disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none"
            disabled={isSubmitDisabled}
          >
            {isAnalyzing ? (
              <><Loader2 className="w-6 h-6 animate-spin mr-2" /> Extraindo e analisando conteúdo...</>
            ) : (
              <><Search className="w-6 h-6 mr-2" /> Verificar Notícia</>
            )}
          </Button>
        </form>

        {isAnalyzing && (
          <div className="flex justify-center items-center gap-2 text-muted-foreground animate-pulse mt-4">
            <Activity className="w-4 h-4 text-[var(--brand-purple)]" />
            <span className="text-sm font-medium">A IA está a processar os dados web...</span>
          </div>
        )}

        {hasResult && !isAnalyzing && (
          <div className="mt-10 animate-in slide-in-from-bottom-4">
            
            <div className="text-center">
              <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${
                isTrueNews ? "text-[var(--brand-green)]" : "text-[var(--brand-red)]"
              }`}>
                Essa notícia tem {probability}% de chances de ser {isTrueNews ? "verdadeira" : "falsa"}.
              </h2>
            </div>

            <div className="mt-12 text-left">
              {article ? (
                <>
                  <div className="space-y-2">
                    <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Descrição</h3>
                    <p className="text-foreground text-sm leading-relaxed sm:text-base">
                      {article.description ?? "Não informada"}
                    </p>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Conteúdo Principal</h3>
                    <div className="text-foreground text-sm leading-relaxed break-words whitespace-pre-wrap sm:text-base">
                      {renderHighlightedText(article.content)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Conteúdo Principal</h3>
                  <div className="text-foreground text-sm leading-relaxed break-words whitespace-pre-wrap sm:text-base">
                    {renderHighlightedText(simulatedText!)}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}