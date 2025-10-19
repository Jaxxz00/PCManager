import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
  verbose: process.env.NODE_ENV === 'development',
  strict: process.env.NODE_ENV === 'production',
});
