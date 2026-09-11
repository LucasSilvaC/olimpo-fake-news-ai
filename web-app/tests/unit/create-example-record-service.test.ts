import { describe, expect, it } from "vitest";

import { CreateExampleRecordService } from "@/server/application/services/create-example-record-service";
import type { ExampleRecord } from "@/server/domain/entities/example-record";
import type { IExampleRecordRepository } from "@/server/domain/repositories/example-record-repository";

class InMemoryExampleRecordRepository implements IExampleRecordRepository {
  async save(record: ExampleRecord): Promise<ExampleRecord> {
    return record;
  }
}

describe("CreateExampleRecordService", () => {
  it("creates a serializable example record", async () => {
    const service = new CreateExampleRecordService(new InMemoryExampleRecordRepository());
    const result = await service.execute({ title: "Architecture example" });
    expect(result.title).toBe("Architecture example");
    expect(result.id).toMatch(/^[\da-f-]{36}$/);
  });
});
