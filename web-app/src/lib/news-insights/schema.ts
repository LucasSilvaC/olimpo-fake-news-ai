import { z } from "zod";

export const newsInsightsRequestSchema = z.strictObject({
  roomId: z.string().trim().min(1).max(200),
  round: z.number().int().min(1),
});

const classFrequencySchema = z
  .object({
    count: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    total: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    frequency: z.number().finite().min(0).max(1),
  })
  .refine((value) => value.count <= value.total, "Count exceeds the class sample size")
  .refine(
    (value) => Math.abs(value.frequency - value.count / value.total) <= 1e-9,
    "Frequency must describe matches within this class",
  );

// Object schemas project the public DTO at every level. Corpus frequencies are
// descriptive reference data; classifications, confidence, and class composition
// fields remain outside this contract.
const comparisonSchema = z.object({
  kind: z.literal("descriptive_corpus_frequency"),
  referenceDataset: z.string().trim().min(1).max(200),
  partition: z.literal("validation"),
  authorScope: z.literal("all"),
  sourceRun: z.string().trim().min(1).max(200),
  variant: z.string().trim().min(1).max(200),
  scope: z.literal("matched_pattern"),
  fake: classFrequencySchema,
  true: classFrequencySchema,
});

export const newsInsightsAnalysisSchema = z.object({
  analysisStatus: z.enum(["ok", "no_match", "invalid_text", "unavailable"]),
  catalogVersion: z.string().max(200),
  extractorVersion: z.string().max(200),
  analyzedText: z.string().max(600),
  characterLimit: z.literal(300),
  quality: z.object({
    empty: z.boolean(),
    noEligibleTokens: z.boolean(),
    truncated: z.boolean(),
  }),
  insights: z
    .array(
      z.object({
        patternId: z.string().min(1).max(200),
        observationTitle: z.string().min(1).max(500),
        observation: z.string().min(1).max(3000),
        reflectionQuestions: z.array(z.string().min(1).max(1000)).max(10),
        redundancyFamily: z.string().min(1).max(200),
        comparison: comparisonSchema,
        measurements: z
          .array(
            z.object({
              feature: z.string().min(1).max(200),
              label: z.string().min(1).max(500),
              value: z.number().finite(),
              operator: z.enum(["<=", ">="]),
              threshold: z.number().finite(),
              denominator: z.string().min(1).max(500),
              count: z.number().int().nonnegative().optional(),
              denominatorCount: z.number().int().nonnegative().optional(),
              displayLabel: z.string().min(1).max(500).optional(),
              displayText: z.string().min(1).max(1000).optional(),
            }),
          )
          .min(1)
          .max(30),
      }),
    )
    .max(100),
});
