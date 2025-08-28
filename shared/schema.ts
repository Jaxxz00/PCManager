import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, date, timestamp, boolean } from "drizzle-orm/pg-core";
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

// Tabella utenti per l'autenticazione
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("admin"), // admin, user
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabella sessioni per gestire le sessioni utente
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username richiesto"),
  password: z.string().min(1, "Password richiesta"),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password minimo 6 caratteri"),
  confirmPassword: z.string().min(1, "Conferma password richiesta"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertPc = z.infer<typeof insertPcSchema>;
export type Pc = typeof pcs.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

// Extended type for PC with employee data
export type PcWithEmployee = Pc & {
  employee?: Pick<Employee, 'id' | 'name' | 'email'> | null;
};
