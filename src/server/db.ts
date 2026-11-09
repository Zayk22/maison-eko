import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required. Use the pooled connection string from Neon.",
  );
}

// Module-scoped pool so a single connection is reused across invocations of
// the same function instance on Vercel. max: 1 keeps the connection count
// predictable under serverless concurrency.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

export const db = drizzle(pool, { schema });