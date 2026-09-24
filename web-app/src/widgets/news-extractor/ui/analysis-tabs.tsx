// /src/widgets/analysis-tabs.tsx
"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Link, FileText, AlertCircle } from "lucide-react";

export function AnalysisTabs() {
  const [textMode, setTextMode] = React.useState("");
  const [linkMode, setLinkMode] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("texto");
  const [error, setError] = React.useState("");

  const currentInput = activeTab === "texto" ? textMode : linkMode;
  const isSubmitDisabled = currentInput.trim().length === 0;

  const handleAnalyze = () => {
    if (activeTab === "link" && !currentInput.startsWith("http")) {
      setError("Por favor, insira um link válido (deve começar com http:// ou https://).");
      return;
    }
    setError("");
    // Lógica de submissão para a API do Projeto OLIMPO
    console.log("A analisar:", currentInput);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 rounded-xl bg-background/60 backdrop-blur-md border shadow-sm">
      <Tabs defaultValue="texto" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="texto" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Texto da Notícia
          </TabsTrigger>
          <TabsTrigger value="link" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            Link da Notícia
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="texto">
          <Textarea
            placeholder="Cole aqui o conteúdo completo da notícia..."
            className="min-h-[150px] resize-y"
            value={textMode}
            onChange={(e) => setTextMode(e.target.value)}
          />
        </TabsContent>
        
        <TabsContent value="link">
          <Input
            type="url"
            placeholder="https://exemplo.com/noticia"
            value={linkMode}
            onChange={(e) => setLinkMode(e.target.value)}
          />
        </TabsContent>
      </Tabs>

      {error && (
        <div className="flex items-center gap-2 mt-3 text-sm text-[#D19200] dark:text-[#EBA814]">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <Button 
        className="w-full mt-6 bg-[#7A2ADB] hover:bg-[#7A2ADB]/90 dark:bg-[#9F5BFF] dark:hover:bg-[#9F5BFF]/90 text-white font-semibold transition-all"
        disabled={isSubmitDisabled}
        onClick={handleAnalyze}
      >
        Analisar Notícia
      </Button>
    </div>
  );
}