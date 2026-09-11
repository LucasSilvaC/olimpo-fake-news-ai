"use server";

import { createExampleRecordSchema } from "@/features/example/schemas/create-example-record-schema";
import { createExampleRecordController } from "@/server/composition-root";

export interface ICreateExampleRecordActionResult {
  isSuccess: boolean;
  message: string;
}
export async function createExampleRecordAction(
  _: ICreateExampleRecordActionResult,
  formData: FormData,
): Promise<ICreateExampleRecordActionResult> {
  try {
    const input = createExampleRecordSchema.parse({ title: formData.get("title") });
    const record = await createExampleRecordController().create(input);
    return { isSuccess: true, message: `Created \"${record.title}\".` };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to create the example record.";
    return { isSuccess: false, message };
  }
}
