import {
  AIAnalysisResult,
  ArticleAnalysisInput,
  IAIAnalysisService,
} from "./ai-analysis-service.interface";

import { MLTargetType } from "@/server/shared/database/schemas/enums";

const UNRELIABLE_KEYWORDS = [
  /\bchocante\b/i,
  /\bsegredo\s+revelado\b/i,
  /\bfraude\b/i,
  /\bconspira/i,
  /\bcura\s+milagrosa\b/i,
  /\bningu[eé]m\s+pode\s+saber\b/i,
  /\burgente:?\b/i,
  /\bbomba\b/i,
  /\bfarsa\b/i,
  /\balarmis/i,
  /\bdesinforma/i,
];

const RELIABLE_KEYWORDS = [
  /\bestudo\s+publicado\b/i,
  /\bpesquisa\s+cient[ií]fica\b/i,
  /\bdados\s+oficiais\b/i,
  /\buniversidade\b/i,
  /\bminist[eé]rio\b/i,
  /\brevisad[ao]\s+por\s+pares\b/i,
  /\binstituto\b/i,
  /\bfonte\s+oficial\b/i,
  /\bag[eê]ncia\b/i,
];

const REASONS_MAP: Record<MLTargetType, { reasons: string[]; confidence: number }> = {
  reliable: {
    confidence: 0.92,
    reasons: [
      "Fonte institucional ou jornalística identificável com citação de especialistas e dados verificáveis.",
      "Linguagem objetiva e factual, com metodologia explícita e ausência de apelo sensacionalista.",
      "Corroboração de fatos consistente com registros documentais e fontes oficiais.",
    ],
  },
  unreliable: {
    confidence: 0.88,
    reasons: [
      "Manchete sensacionalista com gatilhos alarmistas e tom conspiratório típico de desinformação.",
      "Ausência de fontes primárias, comprovação empírica ou dados científicos auditáveis.",
      "Alegações extraordinárias sem sustentação em veículos confiáveis ou relatórios oficiais.",
    ],
  },
  uncertain: {
    confidence: 0.62,
    reasons: [
      "Informações preliminares ou parciais com relatos divergentes entre as fontes citadas.",
      "Presença de dados contextuais verdadeiros mesclados com hipóteses ou inferências especulativas.",
      "Necessita de verificação adicional antes de ser categorizado como fato plenamente estabelecido.",
    ],
  },
};

export class MockAIAnalysisService implements IAIAnalysisService {
  async analyze(article: ArticleAnalysisInput): Promise<AIAnalysisResult> {
    const classification = this.determineClassification(article);
    const template = REASONS_MAP[classification];

    return {
      classification,
      confidence: template.confidence,
      reasons: [...template.reasons],
      modelVersion: "mock-v1",
    };
  }

  private determineClassification(article: ArticleAnalysisInput): MLTargetType {
    if (
      article.targetClassification &&
      ["reliable", "uncertain", "unreliable"].includes(article.targetClassification)
    ) {
      return article.targetClassification;
    }

    const fullText = `${article.title} ${article.content}`;

    const hasUnreliable = UNRELIABLE_KEYWORDS.some((regex) => regex.test(fullText));
    if (hasUnreliable) {
      return "unreliable";
    }

    const hasReliable = RELIABLE_KEYWORDS.some((regex) => regex.test(fullText));
    if (hasReliable) {
      return "reliable";
    }

    return "uncertain";
  }
}

export const mockAIAnalysisService = new MockAIAnalysisService();
