import { promises as fs } from 'fs';
import path from 'path';
import { type Employee, type InsertEmployee, type Pc, type InsertPc, type PcWithEmployee, type User, type InsertUser, type Asset, type InsertAsset } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

interface JsonData {
  employees: Employee[];
  pcs: Pc[];
  assets: Asset[];
  users: User[];
  sessions: Array<{ id: string; userId: string; expiresAt: string }>;
  inviteTokens?: Array<{ token: string; userId: string; expiresAt: string; used: boolean }>;
  maintenance: any[];
}

export class JsonStorage {
  private dataPath: string;
  private data: JsonData;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.dataPath = path.join(process.cwd(), 'data.json');
    this.data = {
      employees: [],
      pcs: [],
      assets: [],
      users: [],
      sessions: [],
      inviteTokens: [],
      maintenance: []
    };
    this.loadData();
    this.startCleanupScheduler();
  }

  private async loadData() {
    try {
      const fileContent = await fs.readFile(this.dataPath, 'utf-8');
      this.data = JSON.parse(fileContent);

      // Ensure inviteTokens exists
      if (!this.data.inviteTokens) {
        this.data.inviteTokens = [];
      }

      // Run cleanup on startup
      await this.cleanupExpiredSessions();
      await this.cleanupExpiredInviteTokens();
    } catch (error) {
      // File doesn't exist or is corrupted, start with empty data
      console.log('No existing data file found, starting with empty database');
      await this.saveData();
    }
  }

  /**
   * Start periodic cleanup scheduler (runs every hour)
   */
  private startCleanupScheduler() {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupExpiredSessions();
      await this.cleanupExpiredInviteTokens();
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Stop cleanup scheduler (for graceful shutdown)
   */
  public stopCleanupScheduler() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private async saveData() {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // Employee methods
  async getEmployee(id: string): Promise<Employee | undefined> {
    return this.data.employees.find(emp => emp.id === id);
  }

  async getEmployees(): Promise<Employee[]> {
    return this.data.employees;
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    const employee: Employee = {
      ...insertEmployee,
      id,
      address: insertEmployee.address ?? null,
      company: insertEmployee.company || "Maori Group",
      createdAt: new Date(),
    };
    this.data.employees.push(employee);
    await this.saveData();
    return employee;
  }

  async updateEmployee(id: string, updateData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const index = this.data.employees.findIndex(emp => emp.id === id);
    if (index === -1) return undefined;

    this.data.employees[index] = { ...this.data.employees[index], ...updateData };
    await this.saveData();
    return this.data.employees[index];
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const index = this.data.employees.findIndex(emp => emp.id === id);
    if (index === -1) return false;

    this.data.employees.splice(index, 1);
    await this.saveData();
    return true;
  }

  async removeEmployeeFromHistory(employeeId: string): Promise<void> {
    // No-op for JSON storage
  }

  // PC methods
  async getPc(id: string): Promise<Pc | undefined> {
    return this.data.pcs.find(pc => pc.id === id);
  }

  async getPcs(): Promise<PcWithEmployee[]> {
    return this.data.pcs.map(pc => {
      const employee = pc.employeeId ? this.data.employees.find(emp => emp.id === pc.employeeId) : null;
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
    return this.data.pcs.find(pc => pc.pcId === pcId);
  }

  async createPc(insertPc: InsertPc): Promise<Pc> {
    const id = randomUUID();
    const pc: Pc = {
      ...insertPc,
      id,
      pcId: insertPc.pcId || `PC-${insertPc.serialNumber.slice(-6).toUpperCase()}`,
      employeeId: insertPc.employeeId || null,
      status: insertPc.status || "active",
      notes: insertPc.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.pcs.push(pc);
    await this.saveData();
    return pc;
  }

  async updatePc(id: string, updateData: Partial<InsertPc>): Promise<Pc | undefined> {
    const index = this.data.pcs.findIndex(pc => pc.id === id);
    if (index === -1) return undefined;

    this.data.pcs[index] = {
      ...this.data.pcs[index],
      ...updateData,
      updatedAt: new Date(),
    };
    await this.saveData();
    return this.data.pcs[index];
  }

  async deletePc(id: string): Promise<boolean> {
    const index = this.data.pcs.findIndex(pc => pc.id === id);
    if (index === -1) return false;

    this.data.pcs.splice(index, 1);
    await this.saveData();
    return true;
  }

  // Asset methods
  async getAsset(id: string): Promise<Asset | undefined> {
    return this.data.assets.find(asset => asset.id === id);
  }

  async getAssets(type?: string): Promise<Asset[]> {
    if (type) {
      return this.data.assets.filter(asset => asset.assetType === type);
    }
    return this.data.assets;
  }

  async getAssetByCode(assetCode: string): Promise<Asset | undefined> {
    return this.data.assets.find(asset => asset.assetCode === assetCode);
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const id = randomUUID();
    const assetCode = insertAsset.assetCode || await this.getNextAssetCode(insertAsset.assetType);
    const asset: Asset = {
      ...insertAsset,
      id,
      assetCode,
      employeeId: insertAsset.employeeId || null,
      brand: insertAsset.brand || null,
      model: insertAsset.model || null,
      serialNumber: insertAsset.serialNumber || null,
      purchaseDate: insertAsset.purchaseDate || null,
      warrantyExpiry: insertAsset.warrantyExpiry || null,
      status: insertAsset.status || "disponibile",
      specs: insertAsset.specs || null,
      notes: insertAsset.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.assets.push(asset);
    await this.saveData();
    return asset;
  }

  async updateAsset(id: string, updateData: Partial<InsertAsset>): Promise<Asset | undefined> {
    const index = this.data.assets.findIndex(asset => asset.id === id);
    if (index === -1) return undefined;

    this.data.assets[index] = {
      ...this.data.assets[index],
      ...updateData,
      updatedAt: new Date(),
    };
    await this.saveData();
    return this.data.assets[index];
  }

  async deleteAsset(id: string): Promise<boolean> {
    const index = this.data.assets.findIndex(asset => asset.id === id);
    if (index === -1) return false;

    this.data.assets.splice(index, 1);
    await this.saveData();
    return true;
  }

  async getNextAssetCode(assetType: string): Promise<string> {
    const prefixMap: Record<string, string> = {
      'pc': 'PC',
      'smartphone': 'PHONE',
      'sim': 'SIM',
      'computer': 'PC',
      'tablet': 'TAB',
      'monitor': 'MON',
      'altro': 'OTHER'
    };

    const prefix = prefixMap[assetType] || 'ASSET';
    const existingAssets = this.data.assets.filter(asset => asset.assetType === assetType);
    const nextValue = existingAssets.length + 1;
    const paddedNumber = String(nextValue).padStart(3, '0');
    return `${prefix}-${paddedNumber}`;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.data.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.data.users.find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.data.users.find(user => user.email === email);
  }

  async getAllUsers(): Promise<User[]> {
    return this.data.users;
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
    
    this.data.users.push(user);
    await this.saveData();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const index = this.data.users.findIndex(user => user.id === id);
    if (index === -1) return undefined;
    
    this.data.users[index] = {
      ...this.data.users[index],
      ...updateData,
      updatedAt: new Date(),
    };
    
    await this.saveData();
    return this.data.users[index];
  }

  async deleteUser(id: string): Promise<boolean> {
    const index = this.data.users.findIndex(user => user.id === id);
    if (index === -1) return false;

    this.data.users.splice(index, 1);
    await this.saveData();
    return true;
  }

  async updateLastLogin(id: string): Promise<void> {
    const user = this.data.users.find(user => user.id === id);
    if (user) {
      user.lastLogin = new Date();
      await this.saveData();
    }
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;
    
    await this.updateLastLogin(user.id);
    return user;
  }

  // Session methods
  async createSession(userId: string): Promise<string> {
    const sessionId = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    this.data.sessions.push({ id: sessionId, userId, expiresAt: expiresAt.toISOString() });
    await this.saveData();
    return sessionId;
  }

  async validateSession(sessionId: string): Promise<User | null> {
    const session = this.data.sessions.find(s => s.id === sessionId);
    if (!session) return null;
    
    if (new Date(session.expiresAt) < new Date()) {
      await this.deleteSession(sessionId);
      return null;
    }
    
    return this.data.users.find(user => user.id === session.userId) || null;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const index = this.data.sessions.findIndex(s => s.id === sessionId);
    if (index === -1) return false;

    this.data.sessions.splice(index, 1);
    await this.saveData();
    return true;
  }

  /**
   * Cleanup expired sessions to prevent memory leak
   * Returns the number of sessions removed
   */
  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    const before = this.data.sessions.length;

    this.data.sessions = this.data.sessions.filter(
      s => new Date(s.expiresAt) > now
    );

    const removed = before - this.data.sessions.length;
    if (removed > 0) {
      await this.saveData();
      console.log(`[Storage] Cleaned up ${removed} expired session(s)`);
    }

    return removed;
  }

  /**
   * Cleanup expired invite tokens to prevent memory leak
   * Returns the number of tokens removed
   */
  async cleanupExpiredInviteTokens(): Promise<number> {
    if (!this.data.inviteTokens) {
      this.data.inviteTokens = [];
      return 0;
    }

    const now = new Date();
    const before = this.data.inviteTokens.length;

    this.data.inviteTokens = this.data.inviteTokens.filter(
      token => new Date(token.expiresAt) > now
    );

    const removed = before - this.data.inviteTokens.length;
    if (removed > 0) {
      await this.saveData();
      console.log(`[Storage] Cleaned up ${removed} expired invite token(s)`);
    }

    return removed;
  }

  // Dashboard stats
  async getDashboardStats() {
    const allPcs = this.data.pcs;
    const allAssets = this.data.assets;
    const allEmployees = this.data.employees;
    const allMaintenance = this.data.maintenance || [];
    
    // Conteggi totali corretti
    const totalPCs = allPcs.length;
    const totalAssets = allAssets.length;
    const totalDevices = totalPCs + totalAssets;
    
    // Conteggi status corretti
    const activePCs = allPcs.filter(p => p.status === 'active' || p.status === 'assegnato').length;
    const activeAssets = allAssets.filter(a => a.status === 'active' || a.status === 'assegnato').length;
    const totalActive = activePCs + activeAssets;
    
    // Conteggio manutenzione corretto
    const maintenancePCs = allMaintenance.filter(m => 
      m.status === 'pending' || m.status === 'in_progress'
    ).length;
    
    // Conteggi retired
    const retiredPCs = allPcs.filter(p => p.status === 'retired' || p.status === 'dismesso').length;
    const retiredAssets = allAssets.filter(a => a.status === 'retired' || a.status === 'dismesso').length;
    const totalRetired = retiredPCs + retiredAssets;
    
    // Conteggi assegnati
    const assignedPCs = allPcs.filter(p => p.employeeId).length;
    const assignedAssets = allAssets.filter(a => a.employeeId).length;
    const totalAssigned = assignedPCs + assignedAssets;
    
    // Conteggi disponibili
    const availablePCs = allPcs.filter(p => p.status === 'disponibile' && !p.employeeId).length;
    const availableAssets = allAssets.filter(a => a.status === 'disponibile' && !a.employeeId).length;
    const totalAvailable = availablePCs + availableAssets;

    // Conteggi per tipo corretti
    const byType = {
      pc: { 
        total: allPcs.length, 
        active: activePCs, 
        assigned: assignedPCs 
      },
      smartphone: { total: 0, active: 0, assigned: 0 },
      tablet: { total: 0, active: 0, assigned: 0 },
      sim: { total: 0, active: 0, assigned: 0 },
      monitor: { total: 0, active: 0, assigned: 0 },
      computer: { total: 0, active: 0, assigned: 0 },
      other: { total: 0, active: 0, assigned: 0 },
    };
    
    // Conta gli asset per tipo
    for (const asset of allAssets) {
      const type = (asset.assetType || '').toLowerCase();
      const isActive = asset.status === 'active' || asset.status === 'assegnato';
      const isAssigned = !!asset.employeeId;
      
      if (type === 'smartphone' || type === 'phone') {
        byType.smartphone.total++;
        if (isActive) byType.smartphone.active++;
        if (isAssigned) byType.smartphone.assigned++;
      } else if (type === 'tablet') {
        byType.tablet.total++;
        if (isActive) byType.tablet.active++;
        if (isAssigned) byType.tablet.assigned++;
      } else if (type === 'sim') {
        byType.sim.total++;
        if (isActive) byType.sim.active++;
        if (isAssigned) byType.sim.assigned++;
      } else if (type === 'monitor') {
        byType.monitor.total++;
        if (isActive) byType.monitor.active++;
        if (isAssigned) byType.monitor.assigned++;
      } else if (type === 'computer') {
        byType.computer.total++;
        if (isActive) byType.computer.active++;
        if (isAssigned) byType.computer.assigned++;
      } else {
        byType.other.total++;
        if (isActive) byType.other.active++;
        if (isAssigned) byType.other.assigned++;
      }
    }

    return {
      totalPCs: totalDevices, // Totale dispositivi (PC + Assets)
      activePCs: totalActive, // Totale attivi
      maintenancePCs, // Manutenzione corretta
      retiredPCs: totalRetired, // Totale dismessi
      totalEmployees: allEmployees.length,
      assignedPCs: totalAssigned, // Totale assegnati
      availablePCs: totalAvailable, // Totale disponibili
      byType,
    };
  }

  // Initialize with test data
  async initializeWithTestData(): Promise<void> {
    // Check if data already exists
    if (this.data.employees.length > 0) {
      return;
    }
    
    // Create default admin user
    await this.createUser({
      username: "admin",
      email: "admin@maorigroup.com",
      firstName: "Amministratore",
      lastName: "Sistema",
      role: "admin",
      isActive: true,
      password: "admin123"
    });

    // Create test employees
    const testEmployees: InsertEmployee[] = [
      {
        name: "Luca Bianchi",
        email: "luca.bianchi@maorigroup.com",
        department: "IT",
        company: "Maori Group",
      },
      {
        name: "Sara Verdi",
        email: "sara.verdi@maorigroup.com",
        department: "Marketing",
        company: "Maori Group",
      },
      {
        name: "Marco Neri",
        email: "marco.neri@maorigroup.com",
        department: "Sales",
        company: "Maori Group",
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
        purchaseDate: new Date("2024-01-15"),
        warrantyExpiry: new Date("2027-01-15"),
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
        purchaseDate: new Date("2024-02-10"),
        warrantyExpiry: new Date("2027-02-10"),
        status: "maintenance",
        notes: "Manutenzione programmata",
      },
    ];

    for (const pc of testPCs) {
      await this.createPc(pc);
    }
  }

  // Stub methods for interface compliance
  async setup2FA(userId: string): Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }> {
    throw new Error("2FA not supported in JSON storage");
  }
  
  async enable2FA(userId: string, secret: string, token: string): Promise<boolean> {
    throw new Error("2FA not supported in JSON storage");
  }
  
  async disable2FA(userId: string, password: string, token: string): Promise<boolean> {
    throw new Error("2FA not supported in JSON storage");
  }
  
  async verify2FA(userId: string, token: string): Promise<boolean> {
    throw new Error("2FA not supported in JSON storage");
  }
  
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    throw new Error("2FA not supported in JSON storage");
  }

  async createInviteToken(userId: string): Promise<string> {
    throw new Error("Invite tokens not supported in JSON storage");
  }

  async getInviteToken(token: string): Promise<{ userId: string; expiresAt: Date } | null> {
    throw new Error("Invite tokens not supported in JSON storage");
  }

  async useInviteToken(token: string, password: string): Promise<boolean> {
    throw new Error("Invite tokens not supported in JSON storage");
  }

  async getPcHistory(pcId: string): Promise<any[]> {
    return [];
  }
  
  async getPcHistoryBySerial(serialNumber: string): Promise<any[]> {
    return [];
  }
  
  async addPcHistoryEntry(historyEntry: any): Promise<any> {
    throw new Error("PC History not supported in JSON storage");
  }
  
  async getAllPcHistory(): Promise<any[]> {
    return [];
  }

  async getAllDocuments(): Promise<any[]> {
    throw new Error("Documents not supported in JSON storage");
  }

  async getDocumentById(id: string): Promise<any> {
    throw new Error("Documents not supported in JSON storage");
  }

  async createDocument(document: any): Promise<any> {
    throw new Error("Documents not supported in JSON storage");
  }

  async updateDocument(id: string, document: any): Promise<any> {
    throw new Error("Documents not supported in JSON storage");
  }

  async deleteDocument(id: string): Promise<boolean> {
    throw new Error("Documents not supported in JSON storage");
  }

  async getMaintenance(id: string): Promise<any> {
    throw new Error("Maintenance not supported in JSON storage");
  }

  async getAllMaintenance(): Promise<any[]> {
    return this.data.maintenance || [];
  }

  async createMaintenance(maintenance: any): Promise<any> {
    const id = randomUUID();
    const newMaintenance = { id, ...maintenance, createdAt: new Date() };
    this.data.maintenance.push(newMaintenance);
    await this.saveData();
    return newMaintenance;
  }

  async updateMaintenance(id: string, maintenance: any): Promise<any> {
    const index = this.data.maintenance.findIndex(m => m.id === id);
    if (index === -1) return undefined;
    
    this.data.maintenance[index] = { ...this.data.maintenance[index], ...maintenance };
    await this.saveData();
    return this.data.maintenance[index];
  }

  async deleteMaintenance(id: string): Promise<boolean> {
    const index = this.data.maintenance.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    this.data.maintenance.splice(index, 1);
    await this.saveData();
    return true;
  }
}
