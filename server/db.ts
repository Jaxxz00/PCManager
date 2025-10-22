import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from "@shared/schema";

// Database connection state
let connection: mysql.Connection | undefined;
let db: ReturnType<typeof drizzle> | undefined;
let initPromise: Promise<void> | undefined;

/**
 * Initialize database connection (idempotent)
 * Returns a Promise that resolves when DB is ready or rejects on error
 */
async function initializeDatabase(): Promise<void> {
  // Return existing promise if initialization is in progress
  if (initPromise) {
    return initPromise;
  }

  // Return immediately if already initialized
  if (connection && db) {
    return Promise.resolve();
  }

  // Start new initialization
  initPromise = (async () => {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
      try {
        console.log("Initializing database connection...");
        connection = await mysql.createConnection(process.env.DATABASE_URL);
        db = drizzle(connection, { schema, mode: 'default' });
        console.log('[DB] MySQL connection established');
      } catch (error) {
        console.error('[DB] Failed to connect to MySQL:', error);
        throw error;
      }
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.log("[DB] No DATABASE_URL provided, using in-memory storage for development");
      }
    }
  })();

  return initPromise;
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