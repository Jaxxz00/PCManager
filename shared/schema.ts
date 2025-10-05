import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, date, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  department: text("department").notNull(),
  company: text("company").notNull().default("Maori Group"),
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
  // 2FA fields
  twoFactorSecret: text("two_factor_secret"),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  backupCodes: text("backup_codes").array(),
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

// Tabella storico PC per tracciare cambiamenti e eventi
export const pcHistory = pgTable("pc_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pcId: varchar("pc_id").notNull().references(() => pcs.id),
  serialNumber: text("serial_number").notNull(), // Duplicato per ricerche veloci
  eventType: text("event_type").notNull(), // created, assigned, unassigned, maintenance, status_change, specs_update, notes_update
  eventDescription: text("event_description").notNull(),
  oldValue: text("old_value"), // Valore precedente se applicabile
  newValue: text("new_value"), // Nuovo valore se applicabile
  performedBy: varchar("performed_by").references(() => users.id),
  performedByName: text("performed_by_name"), // Nome utente per storico
  relatedEmployeeId: varchar("related_employee_id").references(() => employees.id),
  relatedEmployeeName: text("related_employee_name"), // Nome dipendente per storico
  maintenanceId: varchar("maintenance_id"), // Riferimento a manutenzione se applicabile
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabella manutenzione PC
export const maintenance = pgTable("maintenance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pcId: varchar("pc_id").notNull().references(() => pcs.id),
  type: text("type").notNull(), // Tipo intervento (es: Sostituzione Hardware, Pulizia Sistema, etc.)
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
  description: text("description").notNull(),
  technician: text("technician").notNull(),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  estimatedCost: integer("estimated_cost"), // in EUR cents
  actualCost: integer("actual_cost"), // in EUR cents
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

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username richiesto"),
  password: z.string().min(1, "Password richiesta"),
  twoFactorCode: z.string().optional(),
});

export const setup2FASchema = z.object({
  secret: z.string().min(1, "Secret richiesto"),
  token: z.string().length(6, "Codice deve essere di 6 cifre"),
});

export const verify2FASchema = z.object({
  token: z.string().length(6, "Codice deve essere di 6 cifre"),
});

export const disable2FASchema = z.object({
  password: z.string().min(1, "Password richiesta"),
  token: z.string().length(6, "Codice deve essere di 6 cifre"),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password minimo 6 caratteri"),
  confirmPassword: z.string().min(1, "Conferma password richiesta"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

// Schema per storico PC
export const insertPcHistorySchema = createInsertSchema(pcHistory).omit({
  id: true,
  createdAt: true,
});

export const insertMaintenanceSchema = createInsertSchema(maintenance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertPc = z.infer<typeof insertPcSchema>;
export type Pc = typeof pcs.$inferSelect;
export type PcHistory = typeof pcHistory.$inferSelect;
export type InsertPcHistory = z.infer<typeof insertPcHistorySchema>;
export type Maintenance = typeof maintenance.$inferSelect;
export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

// Invite tokens table for password setup
export const inviteTokens = pgTable("invite_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InviteToken = typeof inviteTokens.$inferSelect;
export type InsertInviteToken = typeof inviteTokens.$inferInsert;

// Schema validation for invite tokens
export const setPasswordSchema = z.object({
  token: z.string().min(1, "Token richiesto"),
  password: z.string().min(6, "Password minimo 6 caratteri"),
  confirmPassword: z.string().min(1, "Conferma password richiesta"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

export type SetPasswordData = z.infer<typeof setPasswordSchema>;

// Documents table for manleve and other documents
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  type: text("type").notNull(), // manleva, contratto, fattura, etc.
  description: text("description"),
  fileName: text("file_name"),
  fileSize: integer("file_size"), // size in bytes
  pcId: varchar("pc_id").references(() => pcs.id),
  employeeId: varchar("employee_id").references(() => employees.id),
  tags: text("tags"), // comma-separated tags
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
  createdAt: true,
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

// Extended type for PC with employee data
export type PcWithEmployee = Pc & {
  employee?: Pick<Employee, 'id' | 'name' | 'email'> | null;
};
