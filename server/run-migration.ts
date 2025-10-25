#!/usr/bin/env tsx
/**
 * Migration Runner - Applies database migrations
 * Usage: npx tsx server/run-migration.ts
 */

import { getDb } from "./db";
import { sql } from "drizzle-orm";
import { readFileSync } from "fs";
import { join } from "path";

async function runMigration() {
  console.log("🔄 Starting database migration...\n");

  try {
    // Connect to database
    console.log("📡 Connecting to database...");
    const db = await getDb();
    console.log("✅ Connected successfully\n");

    // Read migration file
    const migrationPath = join(__dirname, "migrations", "add-maintenance-indexes.sql");
    console.log(`📄 Reading migration file: ${migrationPath}`);
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    // Split SQL statements (ignore comments and empty lines)
    const statements = migrationSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`📝 Found ${statements.length} SQL statements\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments and SHOW INDEX
      if (statement.startsWith("--") || statement.toUpperCase().includes("SHOW INDEX")) {
        console.log(`⏭️  Skipping: ${statement.substring(0, 50)}...`);
        continue;
      }

      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      console.log(`   ${statement.substring(0, 80)}...`);

      try {
        await db.execute(sql.raw(statement));
        console.log(`   ✅ Success\n`);
      } catch (error: any) {
        // If index already exists, it's not a fatal error
        if (error.message && error.message.includes("Duplicate key name")) {
          console.log(`   ⚠️  Index already exists (skipping)\n`);
        } else {
          throw error;
        }
      }
    }

    // Verify indexes were created
    console.log("🔍 Verifying indexes...\n");
    const result = await db.execute(sql.raw("SHOW INDEX FROM maintenance"));

    console.log("📊 Current indexes on 'maintenance' table:");
    console.log("─".repeat(80));

    const indexes = result as any[];
    const indexNames = new Set<string>();

    indexes.forEach((row: any) => {
      indexNames.add(row.Key_name);
    });

    const expectedIndexes = [
      "PRIMARY",
      "maintenance_asset_id_idx",
      "maintenance_status_idx",
      "maintenance_priority_idx",
      "maintenance_scheduled_date_idx",
    ];

    expectedIndexes.forEach((indexName) => {
      if (indexNames.has(indexName)) {
        console.log(`✅ ${indexName}`);
      } else {
        console.log(`❌ ${indexName} - NOT FOUND`);
      }
    });

    console.log("─".repeat(80));
    console.log("\n✨ Migration completed successfully!\n");

    // Close connection
    await db.end();
    process.exit(0);

  } catch (error: any) {
    console.error("\n❌ Migration failed!");
    console.error("Error:", error.message);
    console.error("\nStack trace:");
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
runMigration();
