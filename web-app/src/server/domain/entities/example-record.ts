import { ExampleTitle } from "@/server/domain/value-objects/example-title";

interface IExampleRecordProperties {
  id: string;
  title: ExampleTitle;
  createdAt: Date;
}
export class ExampleRecord {
  private constructor(private readonly properties: IExampleRecordProperties) {}
  static create(properties: IExampleRecordProperties): ExampleRecord {
    return new ExampleRecord(properties);
  }
  toPrimitives(): IExampleRecordProperties {
    return this.properties;
  }
}
