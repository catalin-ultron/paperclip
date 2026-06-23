import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://chronos:chronos_secret@localhost:5432/chronosos",
});

export const db = drizzle(pool);
