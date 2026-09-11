import "server-only";

import { CreateExampleRecordService } from "@/server/application/services/create-example-record-service";
import { DrizzleExampleRecordRepository } from "@/server/infrastructure/database/drizzle/repositories/drizzle-example-record-repository";
import { ExampleRecordController } from "@/server/presentation/controllers/example-record-controller";

export function createExampleRecordController(): ExampleRecordController {
  const exampleRecordRepository = new DrizzleExampleRecordRepository();
  const createExampleRecordService = new CreateExampleRecordService(exampleRecordRepository);
  return new ExampleRecordController(createExampleRecordService);
}
