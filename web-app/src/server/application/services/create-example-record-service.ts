import type {
  ICreateExampleRecordDTO,
  ICreateExampleRecordResultDTO,
} from "@/server/application/dtos/create-example-record-dto";
import { ExampleRecord } from "@/server/domain/entities/example-record";
import type { IExampleRecordRepository } from "@/server/domain/repositories/example-record-repository";
import { ExampleTitle } from "@/server/domain/value-objects/example-title";

export class CreateExampleRecordService {
  constructor(private readonly exampleRecordRepository: IExampleRecordRepository) {}
  async execute(input: ICreateExampleRecordDTO): Promise<ICreateExampleRecordResultDTO> {
    const record = ExampleRecord.create({
      id: crypto.randomUUID(),
      title: ExampleTitle.create(input.title),
      createdAt: new Date(),
    });
    const savedRecord = await this.exampleRecordRepository.save(record);
    const primitives = savedRecord.toPrimitives();
    return {
      id: primitives.id,
      title: primitives.title.content,
      createdAt: primitives.createdAt.toISOString(),
    };
  }
}
