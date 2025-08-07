import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  department: text("department").notNull(),
  position: text("position").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pcs = pgTable("pcs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pcId: text("pc_id").notNull().unique(),
  employeeId: varchar("employee_id").references(() => employees.id),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  cpu: text("cpu").notNull(),
  ram: integer("ram").notNull(), // in GB
  storage: text("storage").notNull(),
  operatingSystem: text("operating_system").notNull(),
  serialNumber: text("serial_number").notNull().unique(),
  purchaseDate: date("purchase_date").notNull(),
  warrantyExpiry: date("warranty_expiry").notNull(),
  status: text("status").notNull().default("active"), // active, maintenance, retired
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertPcSchema = createInsertSchema(pcs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertPc = z.infer<typeof insertPcSchema>;
export type Pc = typeof pcs.$inferSelect;

// Extended type for PC with employee data
export type PcWithEmployee = Pc & {
  employee?: Pick<Employee, 'id' | 'name' | 'email'> | null;
};
