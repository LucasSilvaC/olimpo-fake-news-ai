import type { ICreateExampleRecordDTO } from "@/server/application/dtos/create-example-record-dto";
import type { CreateExampleRecordService } from "@/server/application/services/create-example-record-service";
import {
  mapExampleRecordResponse,
  type IExampleRecordResponse,
} from "@/server/presentation/mappers/example-record-mapper";

export class ExampleRecordController {
  constructor(private readonly createExampleRecordService: CreateExampleRecordService) {}
  async create(input: ICreateExampleRecordDTO): Promise<IExampleRecordResponse> {
    const result = await this.createExampleRecordService.execute(input);
    return mapExampleRecordResponse(result);
  }
}
