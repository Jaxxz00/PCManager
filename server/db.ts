import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from "@shared/schema";

// Only initialize database connection if DATABASE_URL is provided
let connection!: mysql.Connection;
let db!: ReturnType<typeof drizzle>;

(async () => {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
    // MySQL connection
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    db = drizzle(connection, { schema, mode: 'default' });
  } else {
    if (process.env.NODE_ENV !== 'production') {
      console.log("No DATABASE_URL provided, using in-memory storage for development");
    }
  }
})();

function hasDb(): boolean {
  return typeof connection !== 'undefined' && typeof db !== 'undefined';
}

function getDb(): ReturnType<typeof drizzle> {
  if (!hasDb()) {
    throw new Error('Database not initialized. Set DATABASE_URL to enable DatabaseStorage.');
  }
  return db;
}

export { connection, db, hasDb, getDb };