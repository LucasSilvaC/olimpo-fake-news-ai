import { z } from "zod";

export const supervisedIdentitySchema = z.object({
  modelVersion: z
    .string()
    .min(1)
    .refine((value) => !value.startsWith("mock")),
  policyVersion: z.literal("olimpo-decision-policy-v1"),
  artifactSha256: z.string().regex(/^[a-f0-9]{64}$/),
  inferenceVersion: z.string().min(1),
});
export const supervisedAnalysisSchema = supervisedIdentitySchema
  .extend({
    analysisStatus: z.enum(["ok", "insufficient_text", "invalid_text", "unavailable"]),
    classification: z.enum(["reliable", "uncertain", "unreliable"]).nullable(),
    fakeProbability: z.number().min(0).max(1).nullable(),
    fakeScore: z.number().min(0).max(100).nullable(),
    scoreKind: z.literal("predicted_fake_probability"),
    reasons: z.array(z.string().trim().min(1).max(4000)).max(50),
    inputScope: z
      .object({
        source: z.literal("article_body"),
        wordLimit: z.literal(100),
        analyzedWordCount: z.number().int().min(0).max(100),
        truncated: z.boolean(),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const reject = (message: string) => ctx.addIssue({ code: "custom", message });
    if (value.analysisStatus === "ok") {
      const p = value.fakeProbability;
      if (p === null || value.fakeScore === null || Math.abs(value.fakeScore - 100 * p) > 1e-8) {
        reject("Probability and score must be consistent");
        return;
      }
      const expected = p <= 0.35 ? "reliable" : p >= 0.65 ? "unreliable" : "uncertain";
      if (value.classification !== expected || value.inputScope.analyzedWordCount < 30) {
        reject("Classification or word count contradicts the decision policy");
      }
    } else {
      if (value.fakeProbability !== null || value.fakeScore !== null)
        reject("No score without analysis");
      if (value.analysisStatus === "insufficient_text") {
        if (value.classification !== "uncertain" || value.inputScope.analyzedWordCount >= 30)
          reject("Invalid insufficient text result");
      } else if (value.classification !== null)
        reject("Failed analysis must have null classification");
    }
  });
