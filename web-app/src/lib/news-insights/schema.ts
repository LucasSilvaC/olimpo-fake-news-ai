import { z } from "zod";

export const newsInsightsRequestSchema = z.strictObject({
  roomId: z.string().trim().min(1).max(200),
  round: z.number().int().min(1),
});

// Object schemas intentionally project the public DTO, stripping unknown fields
// at every level. Class comparisons are never part of the game contract.
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
        reflectionQuestions: z.array(z.string().min(1).max(1000)).min(1).max(10),
        redundancyFamily: z.string().min(1).max(200),
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
            }),
          )
          .min(1)
          .max(30),
      }),
    )
    .max(100),
});
