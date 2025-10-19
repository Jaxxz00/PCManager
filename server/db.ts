import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from "@shared/schema";

// Only initialize database connection if DATABASE_URL is provided
let connection: mysql.Connection | undefined;
let db: ReturnType<typeof drizzle> | undefined;
let isInitialized = false;

async function initializeDatabase() {
  if (isInitialized) return;
  
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
    try {
      console.log("Initializing database connection...");
      connection = await mysql.createConnection(process.env.DATABASE_URL);
      db = drizzle(connection, { schema, mode: 'default' });
      isInitialized = true;
      console.log("Database connection established");
    } catch (error) {
      console.error("Failed to connect to database:", error);
      throw error;
    }
  } else {
    if (process.env.NODE_ENV !== 'production') {
      console.log("No DATABASE_URL provided, using in-memory storage for development");
    }
    isInitialized = true;
  }
}

async function hasDb(): Promise<boolean> {
  await initializeDatabase();
  return typeof connection !== 'undefined' && typeof db !== 'undefined';
}

async function getDb(): Promise<ReturnType<typeof drizzle>> {
  await initializeDatabase();
  if (!connection || !db) {
    throw new Error('Database not initialized. Set DATABASE_URL to enable DatabaseStorage.');
  }
  return db;
}

export { connection, db, hasDb, getDb, initializeDatabase };