import type { ICreateExampleRecordResultDTO } from "@/server/application/dtos/create-example-record-dto";

export interface IExampleRecordResponse {
  id: string;
  title: string;
  createdAt: string;
}
export function mapExampleRecordResponse(
  result: ICreateExampleRecordResultDTO,
): IExampleRecordResponse {
  return { id: result.id, title: result.title, createdAt: result.createdAt };
}
