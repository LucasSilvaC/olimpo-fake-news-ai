import type { ExampleRecord } from "@/server/domain/entities/example-record";

export interface IExampleRecordRepository {
  save(record: ExampleRecord): Promise<ExampleRecord>;
}
