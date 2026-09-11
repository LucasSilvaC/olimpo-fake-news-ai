import { ExampleRecord } from "@/server/domain/entities/example-record";
import type { IExampleRecordRepository } from "@/server/domain/repositories/example-record-repository";
import { ExampleTitle } from "@/server/domain/value-objects/example-title";
import { databaseClient } from "@/server/infrastructure/database/drizzle/client";
import { exampleRecords } from "@/server/infrastructure/database/drizzle/schemas";

export class DrizzleExampleRecordRepository implements IExampleRecordRepository { async save(record: ExampleRecord): Promise<ExampleRecord> { const primitives = record.toPrimitives(); const [savedRecord] = await databaseClient.insert(exampleRecords).values({ id: primitives.id, title: primitives.title.content, createdAt: primitives.createdAt }).returning(); if (!savedRecord) throw new Error("Unable to save example record."); return ExampleRecord.create({ id: savedRecord.id, title: ExampleTitle.create(savedRecord.title), createdAt: savedRecord.createdAt }); } }
