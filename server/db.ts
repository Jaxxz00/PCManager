import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Only initialize database connection if DATABASE_URL is provided
let pool: Pool | undefined;
let db: ReturnType<typeof drizzle> | undefined;

if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else {
  if (process.env.NODE_ENV !== 'production') {
    console.log("No DATABASE_URL provided, using in-memory storage for development");
  }
}
export { pool, db };