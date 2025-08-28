import { type Employee, type InsertEmployee, type Pc, type InsertPc, type PcWithEmployee, type User, type InsertUser, employees, pcs, users, sessions } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

export interface IStorage {
  // Employee methods
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployees(): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;

  // PC methods
  getPc(id: string): Promise<Pc | undefined>;
  getPcs(): Promise<PcWithEmployee[]>;
  getPcByPcId(pcId: string): Promise<Pc | undefined>;
  createPc(pc: InsertPc): Promise<Pc>;
  updatePc(id: string, pc: Partial<InsertPc>): Promise<Pc | undefined>;
  deletePc(id: string): Promise<boolean>;

  // User authentication methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { password: string }): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  updateLastLogin(id: string): Promise<void>;
  validatePassword(username: string, password: string): Promise<User | null>;

  // Session management
  createSession(userId: string): Promise<string>;
  validateSession(sessionId: string): Promise<User | null>;
  deleteSession(sessionId: string): Promise<boolean>;

  // 2FA methods
  setup2FA(userId: string): Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }>;
  enable2FA(userId: string, secret: string, token: string): Promise<boolean>;
  disable2FA(userId: string, password: string, token: string): Promise<boolean>;
  verify2FA(userId: string, token: string): Promise<boolean>;
  regenerateBackupCodes(userId: string): Promise<string[]>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalPCs: number;
    activePCs: number;
    maintenancePCs: number;
    retiredPCs: number;
    expiringWarranties: number;
  }>;
}

export class MemStorage implements IStorage {
  // 2FA stub methods for interface compliance
  async setup2FA(userId: string): Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }> {
    throw new Error("2FA not supported in memory storage");
  }
  
  async enable2FA(userId: string, secret: string, token: string): Promise<boolean> {
    throw new Error("2FA not supported in memory storage");
  }
  
  async disable2FA(userId: string, password: string, token: string): Promise<boolean> {
    throw new Error("2FA not supported in memory storage");
  }
  
  async verify2FA(userId: string, token: string): Promise<boolean> {
    throw new Error("2FA not supported in memory storage");
  }
  
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    throw new Error("2FA not supported in memory storage");
  }
  private employees: Map<string, Employee>;
  private pcs: Map<string, Pc>;
  private users: Map<string, User>;
  private sessions: Map<string, { userId: string; expiresAt: Date }>;

  constructor() {
    this.employees = new Map();
    this.pcs = new Map();
    this.users = new Map();
    this.sessions = new Map();
    this.initializeTestData();
  }

  private initializeTestData() {
    // Add some test employees
    const testEmployees: Employee[] = [
      {
        id: "emp-1",
        name: "Luca Bianchi",
        email: "luca.bianchi@company.com",
        department: "IT",
        position: "Developer",
        createdAt: new Date(),
      },
      {
        id: "emp-2",
        name: "Sara Verdi",
        email: "sara.verdi@company.com",
        department: "Marketing",
        position: "Manager",
        createdAt: new Date(),
      },
      {
        id: "emp-3",
        name: "Marco Neri",
        email: "marco.neri@company.com",
        department: "Sales",
        position: "Representative",
        createdAt: new Date(),
      },
    ];

    testEmployees.forEach(emp => this.employees.set(emp.id, emp));

    // Add some test PCs
    const testPCs: Pc[] = [
      {
        id: "pc-uuid-1",
        pcId: "PC-001",
        employeeId: "emp-1",
        brand: "Dell",
        model: "OptiPlex 7090",
        cpu: "Intel i7-11700",
        ram: 16,
        storage: "512GB SSD",
        operatingSystem: "Windows 11 Pro",
        serialNumber: "DL001234567",
        purchaseDate: "2024-01-15",
        warrantyExpiry: "2027-01-15",
        status: "active",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "pc-uuid-2",
        pcId: "PC-002",
        employeeId: "emp-2",
        brand: "HP",
        model: "EliteDesk 800",
        cpu: "Intel i5-11500",
        ram: 8,
        storage: "256GB SSD",
        operatingSystem: "Windows 11 Pro",
        serialNumber: "HP001234567",
        purchaseDate: "2024-02-10",
        warrantyExpiry: "2027-02-10",
        status: "maintenance",
        notes: "Scheduled maintenance",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    testPCs.forEach(pc => this.pcs.set(pc.id, pc));
  }

  // Employee methods
  async getEmployee(id: string): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    const employee: Employee = {
      ...insertEmployee,
      id,
      createdAt: new Date(),
    };
    this.employees.set(id, employee);
    return employee;
  }

  async updateEmployee(id: string, updateData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const employee = this.employees.get(id);
    if (!employee) return undefined;

    const updatedEmployee: Employee = { ...employee, ...updateData };
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    return this.employees.delete(id);
  }

  // PC methods
  async getPc(id: string): Promise<Pc | undefined> {
    return this.pcs.get(id);
  }

  async getPcs(): Promise<PcWithEmployee[]> {
    const pcs = Array.from(this.pcs.values());
    return pcs.map(pc => {
      const employee = pc.employeeId ? this.employees.get(pc.employeeId) : null;
      return {
        ...pc,
        employee: employee ? {
          id: employee.id,
          name: employee.name,
          email: employee.email,
        } : null,
      };
    });
  }

  async getPcByPcId(pcId: string): Promise<Pc | undefined> {
    return Array.from(this.pcs.values()).find(pc => pc.pcId === pcId);
  }

  async createPc(insertPc: InsertPc): Promise<Pc> {
    const id = randomUUID();
    const pc: Pc = {
      ...insertPc,
      id,
      employeeId: insertPc.employeeId || null,
      status: insertPc.status || "active",
      notes: insertPc.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.pcs.set(id, pc);
    return pc;
  }

  async updatePc(id: string, updateData: Partial<InsertPc>): Promise<Pc | undefined> {
    const pc = this.pcs.get(id);
    if (!pc) return undefined;

    const updatedPc: Pc = {
      ...pc,
      ...updateData,
      updatedAt: new Date(),
    };
    this.pcs.set(id, updatedPc);
    return updatedPc;
  }

  async deletePc(id: string): Promise<boolean> {
    return this.pcs.delete(id);
  }

  async getDashboardStats() {
    const pcs = Array.from(this.pcs.values());
    const totalPCs = pcs.length;
    const activePCs = pcs.filter(pc => pc.status === "active").length;
    const maintenancePCs = pcs.filter(pc => pc.status === "maintenance").length;
    const retiredPCs = pcs.filter(pc => pc.status === "retired").length;
    
    // Calculate warranties expiring in next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringWarranties = pcs.filter(pc => {
      const warrantyDate = new Date(pc.warrantyExpiry);
      return warrantyDate <= thirtyDaysFromNow && warrantyDate >= new Date();
    }).length;

    return {
      totalPCs,
      activePCs,
      maintenancePCs,
      retiredPCs,
      expiringWarranties,
    };
  }

  // User authentication methods (placeholder for MemStorage)
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(userData: InsertUser & { password: string }): Promise<User> {
    const { password, ...insertData } = userData;
    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    
    const user: User = {
      ...insertData,
      id,
      passwordHash,
      role: insertData.role || 'admin',
      isActive: insertData.isActive ?? true,
      lastLogin: null,
      twoFactorSecret: null,
      twoFactorEnabled: false,
      backupCodes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...updateData,
      updatedAt: new Date(),
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateLastLogin(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.lastLogin = new Date();
      this.users.set(id, user);
    }
  }

  async validatePassword(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;
    
    await this.updateLastLogin(user.id);
    return user;
  }

  async createSession(userId: string): Promise<string> {
    const sessionId = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    this.sessions.set(sessionId, { userId, expiresAt });
    return sessionId;
  }

  async validateSession(sessionId: string): Promise<User | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return null;
    }
    
    return this.users.get(session.userId) || null;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }
}

// DatabaseStorage implementation with PostgreSQL
export class DatabaseStorage implements IStorage {
  // Employee methods
  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db
      .insert(employees)
      .values(insertEmployee)
      .returning();
    return employee;
  }

  async updateEmployee(id: string, updateData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [employee] = await db
      .update(employees)
      .set(updateData)
      .where(eq(employees.id, id))
      .returning();
    return employee || undefined;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const result = await db
      .delete(employees)
      .where(eq(employees.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // PC methods
  async getPc(id: string): Promise<Pc | undefined> {
    const [pc] = await db.select().from(pcs).where(eq(pcs.id, id));
    return pc || undefined;
  }

  async getPcs(): Promise<PcWithEmployee[]> {
    const result = await db
      .select({
        pc: pcs,
        employee: {
          id: employees.id,
          name: employees.name,
          email: employees.email,
        },
      })
      .from(pcs)
      .leftJoin(employees, eq(pcs.employeeId, employees.id));

    return result.map(row => ({
      ...row.pc,
      employee: row.employee?.id ? row.employee : null,
    }));
  }

  async getPcByPcId(pcId: string): Promise<Pc | undefined> {
    const [pc] = await db.select().from(pcs).where(eq(pcs.pcId, pcId));
    return pc || undefined;
  }

  async createPc(insertPc: InsertPc): Promise<Pc> {
    const [pc] = await db
      .insert(pcs)
      .values({
        ...insertPc,
        employeeId: insertPc.employeeId || null,
        status: insertPc.status || "active",
      })
      .returning();
    return pc;
  }

  async updatePc(id: string, updateData: Partial<InsertPc>): Promise<Pc | undefined> {
    const [pc] = await db
      .update(pcs)
      .set({
        ...updateData,
        updatedAt: sql`now()`,
      })
      .where(eq(pcs.id, id))
      .returning();
    return pc || undefined;
  }

  async deletePc(id: string): Promise<boolean> {
    const result = await db
      .delete(pcs)
      .where(eq(pcs.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // User authentication methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: InsertUser & { password: string }): Promise<User> {
    const { password, ...insertData } = userData;
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertData,
        passwordHash,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: sql`now()`,
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLogin: sql`now()` })
      .where(eq(users.id, id));
  }

  async validatePassword(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;
    
    await this.updateLastLogin(user.id);
    return user;
  }

  // Session management
  async createSession(userId: string): Promise<string> {
    const sessionId = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Session dura 7 giorni
    
    await db
      .insert(sessions)
      .values({
        id: sessionId,
        userId,
        expiresAt,
      });
    
    return sessionId;
  }

  async validateSession(sessionId: string): Promise<User | null> {
    const result = await db
      .select({
        user: users,
        session: sessions,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.id, sessionId));

    if (result.length === 0) return null;
    
    const { user, session } = result[0];
    
    // Controlla se la sessione è scaduta
    if (session.expiresAt < new Date()) {
      await this.deleteSession(sessionId);
      return null;
    }
    
    return user;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const result = await db
      .delete(sessions)
      .where(eq(sessions.id, sessionId));
    return (result.rowCount ?? 0) > 0;
  }

  async getDashboardStats() {
    try {
      const result = await db.execute(sql`
        SELECT 
          COUNT(*) as total_pcs,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_pcs,
          COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_pcs,
          COUNT(CASE WHEN status = 'retired' THEN 1 END) as retired_pcs,
          COUNT(CASE 
            WHEN warranty_expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' 
            THEN 1 
          END) as expiring_warranties
        FROM pcs
      `);

      const stats = result.rows[0] || {};
      
      return {
        totalPCs: Number(stats.total_pcs || 0),
        activePCs: Number(stats.active_pcs || 0),
        maintenancePCs: Number(stats.maintenance_pcs || 0),
        retiredPCs: Number(stats.retired_pcs || 0),
        expiringWarranties: Number(stats.expiring_warranties || 0),
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Fallback to basic count queries
      const allPcs = await db.select().from(pcs);
      const totalPCs = allPcs.length;
      const activePCs = allPcs.filter(pc => pc.status === 'active').length;
      const maintenancePCs = allPcs.filter(pc => pc.status === 'maintenance').length;
      const retiredPCs = allPcs.filter(pc => pc.status === 'retired').length;
      
      // Calculate expiring warranties
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const expiringWarranties = allPcs.filter(pc => {
        const warrantyDate = new Date(pc.warrantyExpiry);
        return warrantyDate <= thirtyDaysFromNow && warrantyDate >= new Date();
      }).length;

      return {
        totalPCs,
        activePCs,
        maintenancePCs,
        retiredPCs,
        expiringWarranties,
      };
    }
  }

  // Method to initialize with test data (run once)
  async initializeWithTestData(): Promise<void> {
    // Check if data already exists
    const existingEmployees = await this.getEmployees();
    if (existingEmployees.length > 0) {
      console.log("Database already has data, skipping initialization");
      
      // Controlla se esiste almeno un utente admin
      const adminUsers = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
      if (adminUsers.length === 0) {
        console.log("No admin user found, creating default admin...");
        await this.createDefaultAdmin();
      }
      
      return;
    }

    console.log("Initializing database with test data...");
    
    // Crea l'utente admin di default
    await this.createDefaultAdmin();

    // Create test employees
    const testEmployees: InsertEmployee[] = [
      {
        name: "Luca Bianchi",
        email: "luca.bianchi@maorigroup.com",
        department: "IT",
        position: "Developer",
      },
      {
        name: "Sara Verdi",
        email: "sara.verdi@maorigroup.com",
        department: "Marketing",
        position: "Manager",
      },
      {
        name: "Marco Neri",
        email: "marco.neri@maorigroup.com",
        department: "Sales",
        position: "Representative",
      },
    ];

    const createdEmployees = [];
    for (const emp of testEmployees) {
      const created = await this.createEmployee(emp);
      createdEmployees.push(created);
    }

    // Create test PCs
    const testPCs: InsertPc[] = [
      {
        pcId: "PC-001",
        employeeId: createdEmployees[0].id,
        brand: "Dell",
        model: "OptiPlex 7090",
        cpu: "Intel i7-11700",
        ram: 16,
        storage: "512GB SSD",
        operatingSystem: "Windows 11 Pro",
        serialNumber: "DL001234567",
        purchaseDate: "2024-01-15",
        warrantyExpiry: "2027-01-15",
        status: "active",
        notes: "Workstation principale sviluppo",
      },
      {
        pcId: "PC-002",
        employeeId: createdEmployees[1].id,
        brand: "HP",
        model: "EliteDesk 800",
        cpu: "Intel i5-11500",
        ram: 8,
        storage: "256GB SSD",
        operatingSystem: "Windows 11 Pro",
        serialNumber: "HP001234567",
        purchaseDate: "2024-02-10",
        warrantyExpiry: "2027-02-10",
        status: "maintenance",
        notes: "Manutenzione programmata",
      },
    ];

    for (const pc of testPCs) {
      await this.createPc(pc);
    }

    console.log("Test data initialized successfully!");
  }
  
  // Crea l'utente admin di default
  private async createDefaultAdmin(): Promise<void> {
    try {
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash("admin123", saltRounds);
      
      const [adminUser] = await db.insert(users).values({
        username: "admin",
        email: "admin@maorigroup.com",
        firstName: "Amministratore",
        lastName: "Sistema",
        role: "admin",
        isActive: true,
        passwordHash,
      }).returning();
      
      console.log(`Admin user created: ${adminUser.username} (${adminUser.email})`);
      console.log("Default password: admin123 - Please change it after first login");
    } catch (error) {
      console.error("Error creating default admin user:", error);
    }
  }

  // 2FA methods implementation
  async setup2FA(userId: string): Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Maori Group PC Manager (${user.username})`,
      issuer: 'Maori Group',
      length: 32,
    });

    // Generate QR code URL
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    return {
      secret: secret.base32!,
      qrCodeUrl,
      backupCodes,
    };
  }

  async enable2FA(userId: string, secret: string, token: string): Promise<boolean> {
    // Verify the token with the secret
    const verified = speakeasy.totp.verify({
      secret,
      token,
      window: 2, // Allow 2 time steps of tolerance
    });

    if (!verified) {
      return false;
    }

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Update user with 2FA enabled
    await db
      .update(users)
      .set({
        twoFactorSecret: secret,
        twoFactorEnabled: true,
        backupCodes,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return true;
  }

  async disable2FA(userId: string, password: string, token: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) {
      return false;
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return false;
    }

    // Verify 2FA token
    if (!user.twoFactorSecret) {
      return false;
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      token,
      window: 2,
    });

    if (!verified) {
      return false;
    }

    // Disable 2FA
    await db
      .update(users)
      .set({
        twoFactorSecret: null,
        twoFactorEnabled: false,
        backupCodes: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return true;
  }

  async verify2FA(userId: string, token: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || !user.twoFactorSecret) {
      return false;
    }

    // Check if it's a backup code first
    if (user.backupCodes && user.backupCodes.includes(token)) {
      // Remove used backup code
      const updatedBackupCodes = user.backupCodes.filter(code => code !== token);
      await db
        .update(users)
        .set({
          backupCodes: updatedBackupCodes,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
      
      return true;
    }

    // Verify TOTP token
    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      token,
      window: 2,
    });
  }

  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const user = await this.getUser(userId);
    if (!user || !user.twoFactorEnabled) {
      throw new Error("2FA not enabled for this user");
    }

    const newBackupCodes = this.generateBackupCodes();

    await db
      .update(users)
      .set({
        backupCodes: newBackupCodes,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return newBackupCodes;
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      // Generate 8-digit backup codes
      const code = Math.floor(10000000 + Math.random() * 90000000).toString();
      codes.push(code);
    }
    return codes;
  }
}

// Switch to DatabaseStorage
export const storage = new DatabaseStorage();
