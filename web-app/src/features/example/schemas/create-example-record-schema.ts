import { z } from "zod";

export const createExampleRecordSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Use at least 3 characters.")
    .max(120, "Use at most 120 characters."),
});
export type CreateExampleRecordInput = z.infer<typeof createExampleRecordSchema>;
