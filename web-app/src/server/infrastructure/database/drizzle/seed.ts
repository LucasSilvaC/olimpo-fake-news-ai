import { databaseClient } from "@/server/infrastructure/database/drizzle/client";
import { exampleRecords } from "@/server/infrastructure/database/drizzle/schemas";

async function seedDatabase(): Promise<void> { await databaseClient.insert(exampleRecords).values({ id: crypto.randomUUID(), title: "Welcome example", createdAt: new Date() }); }
seedDatabase().then(() => process.exit(0)).catch((error: unknown) => { console.error(error); process.exit(1); });
