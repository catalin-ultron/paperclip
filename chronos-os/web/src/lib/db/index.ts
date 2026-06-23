import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgresql://chronos:chronos_secret@localhost:5432/chronos_db";

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
