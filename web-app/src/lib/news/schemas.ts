import { z } from "zod";

export const extractNewsSchema = z.object({
  url: z.string().trim().min(1).max(4096).url(),
});

export const newsArticleSchema = z.object({
  url: z.string(),
  canonicalUrl: z.string().nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  authors: z.array(z.string()),
  publishedAt: z.string().nullable(),
  modifiedAt: z.string().nullable(),
  content: z.string(),
  imageUrl: z.string().nullable(),
  publisher: z.string().nullable(),
  language: z.string().nullable(),
  extractionMethod: z.enum(["local", "jina"]),
  usedFallback: z.boolean(),
});
