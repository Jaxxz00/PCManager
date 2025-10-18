import { sql } from "drizzle-orm";
import { mysqlTable, varchar, int, date, timestamp, boolean, json, index, text } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = mysqlTable("employees", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  department: varchar("department", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull().default("Maori Group"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  emailIdx: index("employees_email_idx").on(table.email),
  nameIdx: index("employees_name_idx").on(table.name),
}));

export const pcs = mysqlTable("pcs", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  pcId: varchar("pc_id", { length: 50 }).notNull().unique(),
  employeeId: varchar("employee_id", { length: 36 }).references(() => employees.id),
  brand: varchar("brand", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  cpu: varchar("cpu", { length: 100 }).notNull(),
  ram: int("ram").notNull(), // in GB
  storage: varchar("storage", { length: 100 }).notNull(),
  operatingSystem: varchar("operating_system", { length: 100 }).notNull(),
  serialNumber: varchar("serial_number", { length: 100 }).notNull().unique(),
  purchaseDate: date("purchase_date").notNull(),
  warrantyExpiry: date("warranty_expiry").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, maintenance, retired
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  pcIdIdx: index("pcs_pc_id_idx").on(table.pcId),
  serialNumberIdx: index("pcs_serial_number_idx").on(table.serialNumber),
  employeeIdIdx: index("pcs_employee_id_idx").on(table.employeeId),
  statusIdx: index("pcs_status_idx").on(table.status),
}));

// Tabella asset unificata per tutti i tipi di dispositivi
export const assets = mysqlTable("assets", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  assetCode: varchar("asset_code", { length: 50 }).notNull().unique(), // PC-001, PHONE-001, SIM-001, KB-001, MON-001, OTHER-001
  assetType: varchar("asset_type", { length: 20 }).notNull(), // pc, smartphone, sim, tastiera, monitor, altro
  employeeId: varchar("employee_id", { length: 36 }).references(() => employees.id),
  brand: varchar("brand", { length: 100 }), // Non obbligatorio per SIM
  model: varchar("model", { length: 100 }), // Non obbligatorio per SIM
  serialNumber: varchar("serial_number", { length: 100 }).unique(), // Opzionale per alcuni tipi
  purchaseDate: date("purchase_date"),
  warrantyExpiry: date("warranty_expiry"),
  status: varchar("status", { length: 20 }).notNull().default("disponibile"), // disponibile, assegnato, manutenzione, dismesso
  specs: json("specs"), // Dati specifici del tipo (CPU/RAM per PC, IMEI per smartphone, numero SIM, ecc)
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  assetCodeIdx: index("assets_asset_code_idx").on(table.assetCode),
  assetTypeIdx: index("assets_asset_type_idx").on(table.assetType),
  employeeIdIdx: index("assets_employee_id_idx").on(table.employeeId),
  statusIdx: index("assets_status_idx").on(table.status),
  serialNumberIdx: index("assets_serial_number_idx").on(table.serialNumber),
}));

// Tabella utenti per l'autenticazione
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("admin"), // admin, user
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  // 2FA fields
  twoFactorSecret: text("two_factor_secret"),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  backupCodes: json("backup_codes"), // Changed from array to JSON
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  usernameIdx: index("users_username_idx").on(table.username),
  emailIdx: index("users_email_idx").on(table.email),
}));

// Tabella sessioni per gestire le sessioni utente
export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("sessions_user_id_idx").on(table.userId),
  expiresAtIdx: index("sessions_expires_at_idx").on(table.expiresAt),
}));

// Tabella storico PC per tracciare cambiamenti e eventi
export const pcHistory = mysqlTable("pc_history", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  pcId: varchar("pc_id", { length: 36 }).notNull().references(() => pcs.id),
  serialNumber: varchar("serial_number", { length: 100 }).notNull(), // Duplicato per ricerche veloci
  eventType: varchar("event_type", { length: 50 }).notNull(), // created, assigned, unassigned, maintenance, status_change, specs_update, notes_update
  eventDescription: text("event_description").notNull(),
  oldValue: text("old_value"), // Valore precedente se applicabile
  newValue: text("new_value"), // Nuovo valore se applicabile
  performedBy: varchar("performed_by", { length: 36 }).references(() => users.id),
  performedByName: varchar("performed_by_name", { length: 200 }), // Nome utente per storico
  relatedEmployeeId: varchar("related_employee_id", { length: 36 }).references(() => employees.id),
  relatedEmployeeName: varchar("related_employee_name", { length: 200 }), // Nome dipendente per storico
  maintenanceId: varchar("maintenance_id", { length: 36 }), // Riferimento a manutenzione se applicabile
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabella manutenzione PC
export const maintenance = mysqlTable("maintenance", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  assetId: varchar("asset_id", { length: 36 }).notNull().references(() => assets.id),
  type: varchar("type", { length: 100 }).notNull(), // Tipo intervento (es: Sostituzione Hardware, Pulizia Sistema, etc.)
  priority: varchar("priority", { length: 20 }).notNull().default("medium"), // low, medium, high, urgent
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, in_progress, completed, cancelled
  description: text("description").notNull(),
  technician: varchar("technician", { length: 100 }).notNull(),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  estimatedCost: int("estimated_cost"), // in EUR cents
  actualCost: int("actual_cost"), // in EUR cents
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabella sequenze codici asset per auto-generazione
export const assetCodeSequences = mysqlTable("asset_code_sequences", {
  assetType: varchar("asset_type", { length: 20 }).primaryKey(), // pc, smartphone, sim, tastiera, monitor, altro
  prefix: varchar("prefix", { length: 10 }).notNull(), // PC, PHONE, SIM, KB, MON, OTHER
  lastValue: int("last_value").notNull().default(0), // Ultimo numero usato
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertPcSchema = z.object({
  pcId: z.string().min(1).optional(), // Generato automaticamente se non fornito
  brand: z.string().min(1),
  model: z.string().min(1),
  cpu: z.string().min(1),
  ram: z.number().int().positive(),
  storage: z.string().min(1),
  operatingSystem: z.string().min(1),
  serialNumber: z.string().min(1),
  purchaseDate: z.string().min(1).transform((str) => new Date(str)),
  warrantyExpiry: z.string().min(1).transform((str) => new Date(str)),
  status: z.string().optional(),
  notes: z.string().optional(),
  employeeId: z.string().optional(),
});

export const insertAssetSchema = z.object({
  assetCode: z.string().optional().transform((v) => (v && v.trim().length > 0 ? v : undefined)),
  assetType: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  serialNumber: z.string().min(1),
  purchaseDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  warrantyExpiry: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  status: z.string().default("disponibile"),
  employeeId: z.string().optional().transform((val) => val === '' ? undefined : val),
  specs: z.record(z.any()).optional(),
  notes: z.string().optional(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
  passwordHash: true, // Password will be handled separately
  twoFactorSecret: true,
  twoFactorEnabled: true,
  backupCodes: true,
});

export const loginSchema = z.object({
  email: z.string().email("Email non valida"),
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
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assets.$inferSelect;
export type PcHistory = typeof pcHistory.$inferSelect;
export type InsertPcHistory = z.infer<typeof insertPcHistorySchema>;
export type Maintenance = typeof maintenance.$inferSelect;
export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

// Invite tokens table for password setup
export const inviteTokens = mysqlTable("invite_tokens", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
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
export const documents = mysqlTable("documents", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // manleva, contratto, fattura, etc.
  description: text("description"),
  fileName: varchar("file_name", { length: 255 }),
  fileSize: int("file_size"), // size in bytes
  pcId: varchar("pc_id", { length: 36 }).references(() => pcs.id),
  employeeId: varchar("employee_id", { length: 36 }).references(() => employees.id),
  tags: varchar("tags", { length: 500 }), // comma-separated tags
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

