export interface NewsInsightMeasurement {
  feature: string;
  label: string;
  value: number;
  operator: "<=" | ">=";
  threshold: number;
  denominator: string;
  count?: number;
  denominatorCount?: number;
}

export interface NewsInsight {
  patternId: string;
  observationTitle: string;
  observation: string;
  reflectionQuestions: string[];
  redundancyFamily: string;
  measurements: NewsInsightMeasurement[];
}

export interface NewsInsightsAnalysis {
  analysisStatus: "ok" | "no_match" | "invalid_text" | "unavailable";
  catalogVersion: string;
  extractorVersion: string;
  analyzedText: string;
  characterLimit: number;
  quality: { empty: boolean; noEligibleTokens: boolean; truncated: boolean };
  insights: NewsInsight[];
}

export interface NewsInsightsResponse {
  round: number;
  playlistItemId: string;
  article: {
    title: string | null;
    description: string | null;
    publisher: string | null;
    authors: string[];
    publishedAt: string | null;
    imageUrl: string | null;
    url: string;
    content: string;
  };
  analysis: NewsInsightsAnalysis;
}
