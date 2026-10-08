import { MLTargetType } from "@/server/shared/database/schemas/enums";

export interface ChallengeAnalysisDTO {
  classification: MLTargetType;
  reasons: string[];
  confidence: number;
}

export function getDefaultAnalysis(targetClassification: MLTargetType): ChallengeAnalysisDTO {
  switch (targetClassification) {
    case "reliable":
      return {
        classification: "reliable",
        confidence: 95,
        reasons: [
          "Fonte primária verificada e publicação em veículo de jornalismo profissional com editoria reconhecida.",
          "Dados factuais respaldados por entidades oficiais, pesquisas ou dados estatísticos confirmáveis.",
          "Texto informativo com atribuição clara de fontes e ausência de títulos apelativos ou enganosos.",
        ],
      };
    case "unreliable":
      return {
        classification: "unreliable",
        confidence: 98,
        reasons: [
          "Alegações factuais inconsistentes previamente desmentidas por agências de checagem de fatos.",
          "Ausência de fontes primárias, evidências científicas ou confirmação oficial nos órgãos competentes.",
          "Estrutura com apelo emocional ou sensacionalista típica de desinformação viral.",
        ],
      };
    case "uncertain":
      return {
        classification: "uncertain",
        confidence: 60,
        reasons: [
          "Tema com divergência técnica entre analistas ou pesquisas com conclusões preliminares.",
          "Cenário em evolução com eventos ainda em andamento e dados sujeitos a revisão futura.",
          "Informações demandam acompanhamento de desdobramentos para conclusões definitivas.",
        ],
      };
  }
}
