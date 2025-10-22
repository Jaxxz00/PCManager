import { type Employee, type InsertEmployee, type Pc, type InsertPc, type PcWithEmployee, type User, type InsertUser, type InviteToken, type InsertInviteToken, type PcHistory, type InsertPcHistory, type Document, type InsertDocument, type Maintenance, type InsertMaintenance, type Asset, type InsertAsset } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

export interface IStorage {
  // Employee methods
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployees(): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, updateData: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;

  // PC methods
  getPcs(): Promise<Pc[]>;
  getPc(id: string): Promise<Pc | undefined>;
  createPc(pc: InsertPc): Promise<Pc>;
  updatePc(id: string, updateData: Partial<InsertPc>): Promise<Pc | undefined>;
  deletePc(id: string): Promise<boolean>;
  getPcsWithEmployees(): Promise<PcWithEmployee[]>;

  // Asset methods
  getAssets(): Promise<Asset[]>;
  getAsset(id: string): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: string, updateData: Partial<InsertAsset>): Promise<Asset | undefined>;
  deleteAsset(id: string): Promise<boolean>;

  // User methods
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  validatePassword(email: string, password: string): Promise<User | null>;
  setUserPassword(userId: string, password: string): Promise<boolean>;

  // Session methods
  createSession(userId: string): Promise<string>;
  validateSession(sessionId: string): Promise<User | null>;
  deleteSession(sessionId: string): Promise<boolean>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalPCs: number;
    activePCs: number;
    maintenancePCs: number;
    retiredPCs: number;
    totalEmployees: number;
    assignedPCs: number;
    availablePCs: number;
    byType: {
      pc: { total: number; active: number; assigned: number };
      smartphone: { total: number; active: number; assigned: number };
      tablet: { total: number; active: number; assigned: number };
      sim: { total: number; active: number; assigned: number };
      other: { total: number; active: number; assigned: number };
    };
  }>;

  // 2FA methods
  setup2FA(userId: string): Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }>;
  enable2FA(userId: string, secret: string, token: string): Promise<boolean>;
  disable2FA(userId: string, password: string, token: string): Promise<boolean>;
  verify2FA(userId: string, token: string): Promise<boolean>;
  regenerateBackupCodes(userId: string): Promise<string[]>;

  // Invite token methods
  createInviteToken(userId: string): Promise<string>;
  getInviteToken(token: string): Promise<{ userId: string; expiresAt: Date } | null>;
  useInviteToken(token: string, password: string): Promise<boolean>;

  // PC History methods
  getPcHistory(pcId: string): Promise<PcHistory[]>;
  getPcHistoryBySerial(serialNumber: string): Promise<PcHistory[]>;
  addPcHistoryEntry(historyEntry: InsertPcHistory): Promise<PcHistory>;
  getAllPcHistory(): Promise<PcHistory[]>;

  // Document methods
  getAllDocuments(): Promise<Document[]>;
  getDocumentById(id: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, updateData: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;

  // Maintenance methods
  getMaintenance(id: string): Promise<Maintenance | undefined>;
  getAllMaintenance(): Promise<Maintenance[]>;
  createMaintenance(maintenance: InsertMaintenance): Promise<Maintenance>;
  updateMaintenance(id: string, maintenance: Partial<InsertMaintenance>): Promise<Maintenance | undefined>;
  deleteMaintenance(id: string): Promise<boolean>;
}

// MemStorage implementation (placeholder - not used)
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

  // Invite token methods (placeholder for MemStorage)
  async createInviteToken(userId: string): Promise<string> {
    throw new Error("Invite tokens not supported in memory storage");
  }

  async getInviteToken(token: string): Promise<{ userId: string; expiresAt: Date } | null> {
    throw new Error("Invite tokens not supported in memory storage");
  }

  async useInviteToken(token: string, password: string): Promise<boolean> {
    throw new Error("Invite tokens not supported in memory storage");
  }

  // PC History methods (placeholder for MemStorage)
  async getPcHistory(pcId: string): Promise<PcHistory[]> {
    return [];
  }

  async getPcHistoryBySerial(serialNumber: string): Promise<PcHistory[]> {
    return [];
  }

  async addPcHistoryEntry(historyEntry: InsertPcHistory): Promise<PcHistory> {
    throw new Error("PC history not supported in memory storage");
  }

  async getAllPcHistory(): Promise<PcHistory[]> {
    return [];
  }

  // Document methods (placeholder for MemStorage)
  async getAllDocuments(): Promise<Document[]> {
    return [];
  }

  async getDocumentById(id: string): Promise<Document | undefined> {
    return undefined;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    throw new Error("Documents not supported in memory storage");
  }

  async updateDocument(id: string, updateData: Partial<InsertDocument>): Promise<Document | undefined> {
    throw new Error("Documents not supported in memory storage");
  }

  async deleteDocument(id: string): Promise<boolean> {
    return false;
  }

  // Maintenance methods (placeholder for MemStorage)
  async getMaintenance(id: string): Promise<Maintenance | undefined> {
    return undefined;
  }

  async getAllMaintenance(): Promise<Maintenance[]> {
    return [];
  }

  async createMaintenance(maintenanceData: InsertMaintenance): Promise<Maintenance> {
    throw new Error("Maintenance not supported in memory storage");
  }

  async updateMaintenance(id: string, updateData: Partial<InsertMaintenance>): Promise<Maintenance | undefined> {
    throw new Error("Maintenance not supported in memory storage");
  }

  async deleteMaintenance(id: string): Promise<boolean> {
    return false;
  }

  // Employee methods
  async getEmployees(): Promise<Employee[]> {
    return [];
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    return undefined;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    const newEmployee: Employee = {
      id,
      ...employee,
      address: employee.address ?? null,
      company: employee.company || "",
      createdAt: new Date(),
    };
    return newEmployee;
  }

  async updateEmployee(id: string, updateData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    return undefined;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    return false;
  }

  // PC methods
  async getPcs(): Promise<Pc[]> {
    return [];
  }

  async getPc(id: string): Promise<Pc | undefined> {
    return undefined;
  }

  async createPc(pc: InsertPc): Promise<Pc> {
    const id = randomUUID();
    const newPc: Pc = {
      id,
      ...pc,
      status: pc.status || "active",
      pcId: pc.pcId || `PC-${id.slice(0, 8).toUpperCase()}`,
      employeeId: pc.employeeId || null,
      notes: pc.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return newPc;
  }

  async updatePc(id: string, updateData: Partial<InsertPc>): Promise<Pc | undefined> {
    return undefined;
  }

  async deletePc(id: string): Promise<boolean> {
    return false;
  }

  async getPcsWithEmployees(): Promise<PcWithEmployee[]> {
    return [];
  }

  // Asset methods
  async getAssets(): Promise<Asset[]> {
    return [];
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    return undefined;
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const id = randomUUID();
    const newAsset: Asset = {
      id,
      ...asset,
      assetCode: asset.assetCode || `ASSET-${id.slice(0, 8).toUpperCase()}`,
      employeeId: asset.employeeId || null,
      purchaseDate: asset.purchaseDate || null,
      warrantyExpiry: asset.warrantyExpiry || null,
      notes: asset.notes || null,
      specs: asset.specs || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return newAsset;
  }

  async updateAsset(id: string, updateData: Partial<InsertAsset>): Promise<Asset | undefined> {
    return undefined;
  }

  async deleteAsset(id: string): Promise<boolean> {
    return false;
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return [];
  }

  async getUser(id: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = randomUUID();
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash((user as any).password || 'defaultpassword', saltRounds);
    
    const newUser: User = {
      id,
      ...user,
      role: user.role || "user",
      passwordHash,
      twoFactorSecret: null,
      twoFactorEnabled: false,
      backupCodes: null,
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return newUser;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    return undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    return false;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    return null;
  }

  async setUserPassword(userId: string, password: string): Promise<boolean> {
    return false;
  }

  // Session methods
  async createSession(userId: string): Promise<string> {
    const sessionId = randomUUID();
    return sessionId;
  }

  async validateSession(sessionId: string): Promise<User | null> {
    return null;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return false;
  }

  // Dashboard stats
  async getDashboardStats() {
    return {
      totalPCs: 0,
      activePCs: 0,
      maintenancePCs: 0,
      retiredPCs: 0,
      totalEmployees: 0,
      assignedPCs: 0,
      availablePCs: 0,
      byType: {
        pc: { total: 0, active: 0, assigned: 0 },
        smartphone: { total: 0, active: 0, assigned: 0 },
        tablet: { total: 0, active: 0, assigned: 0 },
        sim: { total: 0, active: 0, assigned: 0 },
        other: { total: 0, active: 0, assigned: 0 },
      },
    };
  }

  // Method to initialize with test data (run once)
  async initializeWithTestData(): Promise<void> {
    // MemStorage doesn't have PC history, so this is a no-op
  }
  
  // Crea l'utente admin di default
  private async createDefaultAdmin(): Promise<void> {
    // MemStorage doesn't support persistent admin creation
  }
}
