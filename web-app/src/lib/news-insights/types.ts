export interface NewsInsightMeasurement {
  feature: string;
  label: string;
  value: number;
  operator: "<=" | ">=";
  threshold: number;
  denominator: string;
  count?: number;
  denominatorCount?: number;
  displayLabel?: string;
  displayText?: string;
}

export interface NewsInsightClassFrequency {
  count: number;
  total: number;
  frequency: number;
}

/** Frequency of the complete matched pattern within each reference corpus class. */
export interface NewsInsightComparison {
  kind: "descriptive_corpus_frequency";
  referenceDataset: string;
  partition: "validation";
  authorScope: "all";
  sourceRun: string;
  variant: string;
  scope: "matched_pattern";
  fake: NewsInsightClassFrequency;
  true: NewsInsightClassFrequency;
}

export interface NewsInsight {
  patternId: string;
  observationTitle: string;
  observation: string;
  reflectionQuestions: string[];
  redundancyFamily: string;
  measurements: NewsInsightMeasurement[];
  comparison: NewsInsightComparison;
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
