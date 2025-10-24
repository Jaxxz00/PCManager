import { type Employee, type InsertEmployee, type Pc, type InsertPc, type PcWithEmployee, type User, type InsertUser, type Asset, type InsertAsset, users, sessions, employees, pcs, assets, maintenance } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { getDb, hasDb } from "./db";
import { eq, desc } from "drizzle-orm";

export class DatabaseStorage {
  private db: any;
  private connectionPromise: Promise<any> | null = null;

  constructor() {
    // Database will be initialized lazily when first used
  }

  private async getDb() {
    if (!this.db) {
      if (!this.connectionPromise) {
        this.connectionPromise = getDb();
      }
      this.db = await this.connectionPromise;
    }
    return this.db;
  }

  // Metodo per chiudere la connessione
  async close() {
    if (this.db) {
      try {
        await this.db.end();
        this.db = null;
        this.connectionPromise = null;
      } catch (error) {
        console.error('Error closing database connection:', error);
      }
    }
  }

  // Metodo helper per gestione errori
  private handleError(operation: string, error: any, defaultValue: any = undefined) {
    console.error(`Error ${operation}:`, error);
    return defaultValue;
  }

  // Metodo per eseguire transazioni
  private async executeTransaction<T>(operation: () => Promise<T>): Promise<T> {
    try {
      const db = await this.getDb();
      return await db.transaction(operation);
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  }

  // Employee methods
  async getEmployee(id: string): Promise<Employee | undefined> {
    try {
      const db = await this.getDb();
      const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
      return (result as any)[0] || undefined;
    } catch (error) {
      return this.handleError('getting employee', error);
    }
  }

  async getEmployees(): Promise<Employee[]> {
    try {
      const db = await this.getDb();
      const result = await db.select().from(employees);
      return (result as any) || [];
    } catch (error) {
      return this.handleError('getting employees', error, []);
    }
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    const employee: Employee = {
      ...insertEmployee,
      id,
      company: insertEmployee.company || "Maori Group",
      createdAt: new Date(),
    };
    
    try {
      const db = await this.getDb();
      await db.insert(employees).values(employee as any);
      return employee;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw new Error(`Failed to create employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateEmployee(id: string, updateData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    try {
      const db = await this.getDb();
      await db.update(employees).set(updateData as any).where(eq(employees.id, id));
      return this.getEmployee(id);
    } catch (error) {
      console.error('Error updating employee:', error);
      return undefined;
    }
  }

  async deleteEmployee(id: string): Promise<boolean> {
    try {
      const db = await this.getDb();
      await db.delete(employees).where(eq(employees.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      return false;
    }
  }

  async removeEmployeeFromHistory(employeeId: string): Promise<void> {
    // Implementation for removing employee from history
    try {
      const db = await this.getDb();
      await db.update(pcs).set({ employeeId: null }).where(eq(pcs.employeeId, employeeId));
      await db.update(assets).set({ employeeId: null }).where(eq(assets.employeeId, employeeId));
    } catch (error) {
      console.error('Error removing employee from history:', error);
    }
  }

  // PC methods
  async getPc(id: string): Promise<Pc | undefined> {
    try {
      const db = await this.getDb();
      const result = await db.select().from(pcs).where(eq(pcs.id, id)).limit(1);
      return (result as any)[0] || undefined;
    } catch (error) {
      console.error('Error getting PC:', error);
      return undefined;
    }
  }

  async getPcs(): Promise<PcWithEmployee[]> {
    try {
      const db = await this.getDb();
      const result = await db
        .select({
          id: 'pcs.id',
          pcId: 'pcs.pcId',
          employeeId: 'pcs.employeeId',
          brand: 'pcs.brand',
          model: 'pcs.model',
          cpu: 'pcs.cpu',
          ram: 'pcs.ram',
          storage: 'pcs.storage',
          operatingSystem: 'pcs.operatingSystem',
          serialNumber: 'pcs.serialNumber',
          purchaseDate: 'pcs.purchaseDate',
          warrantyExpiry: 'pcs.warrantyExpiry',
          status: 'pcs.status',
          notes: 'pcs.notes',
          createdAt: 'pcs.createdAt',
          updatedAt: 'pcs.updatedAt',
          employee: {
            id: 'employees.id',
            name: 'employees.name',
            email: 'employees.email'
          }
        })
        .from('pcs')
        .leftJoin('employees', { 'pcs.employeeId': 'employees.id' });
      
      return result.map((row: any) => ({
        ...row,
        employee: row.employee.id ? row.employee : null
      }));
    } catch (error) {
      console.error('Error getting PCs:', error);
      return [];
    }
  }

  async getPcByPcId(pcId: string): Promise<Pc | undefined> {
    try {
      const db = await this.getDb();
      const result = await db.select().from(pcs).where(eq(pcs.pcId, pcId)).limit(1);
      return (result as any)[0] || undefined;
    } catch (error) {
      console.error('Error getting PC by PC ID:', error);
      return undefined;
    }
  }

  async createPc(insertPc: InsertPc): Promise<Pc> {
    const id = randomUUID();
    const pc: Pc = {
      ...insertPc,
      id,
      pcId: insertPc.pcId || `PC-${insertPc.serialNumber?.slice(-6).toUpperCase() || id.slice(0, 6)}`,
      employeeId: insertPc.employeeId || null,
      status: insertPc.status || "active",
      notes: insertPc.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    try {
      const db = await this.getDb();
      await db.insert(pcs).values(pc as any);
      return pc;
    } catch (error) {
      console.error('Error creating PC:', error);
      throw error;
    }
  }

  async updatePc(id: string, updateData: Partial<InsertPc>): Promise<Pc | undefined> {
    try {
      const db = await this.getDb();
      await db.update(pcs).set({ ...updateData, updatedAt: new Date() } as any).where(eq(pcs.id, id));
      return this.getPc(id);
    } catch (error) {
      console.error('Error updating PC:', error);
      return undefined;
    }
  }

  async deletePc(id: string): Promise<boolean> {
    try {
      const db = await this.getDb();
      await db.delete(pcs).where(eq(pcs.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting PC:', error);
      return false;
    }
  }

  // Asset methods
  async getAsset(id: string): Promise<Asset | undefined> {
    try {
      const db = await this.getDb();
      const result = await db.select().from(assets).where(eq(assets.id, id)).limit(1);
      return (result as any)[0] || undefined;
    } catch (error) {
      console.error('Error getting asset:', error);
      return undefined;
    }
  }

  async getAssets(type?: string): Promise<Asset[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(assets);
      if (type) {
        query = query.where(eq(assets.assetType, type));
      }
      const result = await query;
      return (result as any) || [];
    } catch (error) {
      console.error('Error getting assets:', error);
      return [];
    }
  }

  // Metodo per ottenere tutti gli asset inclusi i PC
  async getAllAssetsIncludingPCs(): Promise<any[]> {
    try {
      const db = await this.getDb();
      
      // Ottieni tutti gli asset non-PC
      const nonPcAssets = await db.select().from(assets);
      
      // Ottieni tutti i PC e convertili in formato asset
      const pcsData = await db.select().from(pcs);
      const pcAssets = pcsData.map((pc: any) => ({
        id: pc.id,
        assetCode: pc.pcId,
        assetType: 'computer',
        name: `${pc.brand} ${pc.model}`,
        brand: pc.brand,
        model: pc.model,
        serialNumber: pc.serialNumber,
        status: pc.status,
        employeeId: pc.employeeId,
        purchaseDate: pc.purchaseDate,
        warrantyExpiry: pc.warrantyExpiry,
        notes: pc.notes,
        createdAt: pc.createdAt,
        updatedAt: pc.updatedAt,
        isPc: true // Flag per identificare che è un PC
      }));
      
      // Combina asset e PC
      return [...(nonPcAssets as any), ...pcAssets];
    } catch (error) {
      console.error('Error getting all assets including PCs:', error);
      return [];
    }
  }

  async getAssetByCode(assetCode: string): Promise<Asset | undefined> {
    try {
      const db = await this.getDb();
      const result = await db.select().from(assets).where(eq(assets.assetCode, assetCode)).limit(1);
      return (result as any)[0] || undefined;
    } catch (error) {
      console.error('Error getting asset by code:', error);
      return undefined;
    }
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
    
    try {
      const db = await this.getDb();
      await db.insert(assets).values(asset as any);
      return asset;
    } catch (error) {
      console.error('Error creating asset:', error);
      throw error;
    }
  }

  async updateAsset(id: string, updateData: Partial<InsertAsset>): Promise<Asset | undefined> {
    try {
      const db = await this.getDb();
      await db.update(assets).set({ ...updateData, updatedAt: new Date() } as any).where(eq(assets.id, id));
      return this.getAsset(id);
    } catch (error) {
      console.error('Error updating asset:', error);
      return undefined;
    }
  }

  async deleteAsset(id: string): Promise<boolean> {
    try {
      const db = await this.getDb();
      await db.delete(assets).where(eq(assets.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting asset:', error);
      return false;
    }
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
    
    try {
      const db = await this.getDb();
      const result = await db.select().from(assets).where(eq(assets.assetType, assetType));
      const nextValue = result.length + 1;
      const paddedNumber = String(nextValue).padStart(3, '0');
      return `${prefix}-${paddedNumber}`;
    } catch (error) {
      console.error('Error getting next asset code:', error);
      return `${prefix}-001`;
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    try {
      const db = await this.getDb();
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return (result as any)[0] || undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const db = await this.getDb();
      const result = await db.select().from('users').where({ username }).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const db = await this.getDb();
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return (result as any)[0] || undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const db = await this.getDb();
      const result = await db.select().from(users);
      return (result as any) || [];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
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
    
    try {
      const db = await this.getDb();
      await db.insert(users).values(user as any);
      return user as any;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const db = await this.getDb();
      await db.update(users).set({ ...(updateData as any), updatedAt: new Date() }).where(eq(users.id, id));
      return this.getUser(id);
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const db = await this.getDb();
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, id));
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) return null;
      
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) return null;
      
      await this.updateLastLogin(user.id);
      return user;
    } catch (error) {
      console.error('Error validating password:', error);
      return null;
    }
  }

  // Session methods
  async createSession(userId: string): Promise<string> {
    const sessionId = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    try {
      const db = await this.getDb();
      await db.insert(sessions).values({ id: sessionId, userId, expiresAt } as any);
      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async validateSession(sessionId: string): Promise<User | null> {
    try {
      const db = await this.getDb();
      const sessionRows = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      const session = (sessionRows as any)[0];
      if (!session) return null;
      
      if (new Date(session.expiresAt) < new Date()) {
        await this.deleteSession(sessionId);
        return null;
      }
      
      const user = await this.getUser(session.userId);
      return user || null;
    } catch (error) {
      console.error('Error validating session:', error);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const db = await this.getDb();
      await db.delete(sessions).where(eq(sessions.id, sessionId));
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  // Dashboard stats
  async getDashboardStats() {
    try {
      const db = await this.getDb();
      const allPcs = await db.select().from(pcs);
      const allAssets = await db.select().from(assets);
      const allEmployees = await db.select().from(employees);
      const allMaintenance = await db.select().from(maintenance);
      
      // Conteggi totali corretti
      const totalPCs = allPcs.length;
      const totalNonPcAssets = allAssets.length;
      const totalDevices = totalPCs + totalNonPcAssets; // PC inclusi negli asset totali
      
      // Conteggi status corretti
      const activePCs = allPcs.filter((p: any) => p.status === 'active' || p.status === 'assegnato').length;
      const activeAssets = allAssets.filter((a: any) => a.status === 'active' || a.status === 'assegnato').length;
      const totalActive = activePCs + activeAssets;
      
      // Conteggio manutenzione corretto
      const maintenancePCs = allMaintenance.filter((m: any) => 
        m.status === 'pending' || m.status === 'in_progress'
      ).length;
      
      // Conteggi retired
      const retiredPCs = allPcs.filter((p: any) => p.status === 'retired' || p.status === 'dismesso').length;
      const retiredAssets = allAssets.filter((a: any) => a.status === 'retired' || a.status === 'dismesso').length;
      const totalRetired = retiredPCs + retiredAssets;
      
      // Conteggi assegnati
      const assignedPCs = allPcs.filter((p: any) => p.employeeId).length;
      const assignedAssets = allAssets.filter((a: any) => a.employeeId).length;
      const totalAssigned = assignedPCs + assignedAssets;
      
      // Conteggi disponibili
      const availablePCs = allPcs.filter((p: any) => p.status === 'disponibile' && !p.employeeId).length;
      const availableAssets = allAssets.filter((a: any) => a.status === 'disponibile' && !a.employeeId).length;
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
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
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
          monitor: { total: 0, active: 0, assigned: 0 },
          computer: { total: 0, active: 0, assigned: 0 },
          other: { total: 0, active: 0, assigned: 0 },
        },
      };
    }
  }

  // Initialize with test data
  async initializeWithTestData(): Promise<void> {
    // Check if data already exists
    const existingUsers = await this.getAllUsers();
    if (existingUsers.length > 0) {
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
    throw new Error("2FA not supported in database storage");
  }
  
  async enable2FA(userId: string, secret: string, token: string): Promise<boolean> {
    throw new Error("2FA not supported in database storage");
  }
  
  async disable2FA(userId: string, password: string, token: string): Promise<boolean> {
    throw new Error("2FA not supported in database storage");
  }
  
  async verify2FA(userId: string, token: string): Promise<boolean> {
    throw new Error("2FA not supported in database storage");
  }
  
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    throw new Error("2FA not supported in database storage");
  }

  async createInviteToken(userId: string): Promise<string> {
    throw new Error("Invite tokens not supported in database storage");
  }

  async getInviteToken(token: string): Promise<{ userId: string; expiresAt: Date } | null> {
    throw new Error("Invite tokens not supported in database storage");
  }

  async useInviteToken(token: string, password: string): Promise<boolean> {
    throw new Error("Invite tokens not supported in database storage");
  }

  async getPcHistory(pcId: string): Promise<any[]> {
    return [];
  }
  
  async getPcHistoryBySerial(serialNumber: string): Promise<any[]> {
    return [];
  }
  
  async addPcHistoryEntry(historyEntry: any): Promise<any> {
    throw new Error("PC History not supported in database storage");
  }
  
  async getAllPcHistory(): Promise<any[]> {
    return [];
  }

  async getAllDocuments(): Promise<any[]> {
    const db = await this.getDb();
    const { documents } = await import("@shared/schema");
    
    try {
      const result = await db.select().from(documents).orderBy(desc(documents.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching documents:", error);
      return [];
    }
  }

  async getDocumentById(id: string): Promise<any> {
    const db = await this.getDb();
    const { documents } = await import("@shared/schema");
    
    try {
      const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error("Error fetching document:", error);
      return null;
    }
  }

  async createDocument(document: any): Promise<any> {
    const db = await this.getDb();
    const { documents } = await import("@shared/schema");
    
    try {
      const newDocument = {
        id: crypto.randomUUID(),
        title: document.title,
        type: document.type,
        description: document.description,
        fileName: document.fileName,
        fileSize: document.fileSize,
        pcId: document.pcId,
        employeeId: document.employeeId,
        tags: document.tags,
        uploadedAt: document.uploadedAt || new Date(),
        createdAt: new Date(),
      };

      await db.insert(documents).values(newDocument);
      return newDocument;
    } catch (error) {
      console.error("Error creating document:", error);
      throw error;
    }
  }

  async updateDocument(id: string, document: any): Promise<any> {
    const db = await this.getDb();
    const { documents } = await import("@shared/schema");
    
    try {
      const updateData = {
        title: document.title,
        type: document.type,
        description: document.description,
        fileName: document.fileName,
        fileSize: document.fileSize,
        pcId: document.pcId,
        employeeId: document.employeeId,
        tags: document.tags,
      };

      await db.update(documents).set(updateData).where(eq(documents.id, id));
      
      const updated = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
      return updated[0];
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  }

  async deleteDocument(id: string): Promise<boolean> {
    const db = await this.getDb();
    const { documents } = await import("@shared/schema");
    
    try {
      await db.delete(documents).where(eq(documents.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting document:", error);
      return false;
    }
  }

  async getMaintenance(id: string): Promise<any> {
    throw new Error("Maintenance not supported in database storage");
  }

  async getAllMaintenance(): Promise<any[]> {
    try {
      const db = await this.getDb();
      const result = await db.select().from(maintenance);
      return (result as any) || [];
    } catch (error) {
      console.error('Error getting maintenance:', error);
      return [];
    }
  }

  async createMaintenance(maintenance: any): Promise<any> {
    const id = randomUUID();
    const newMaintenance = { id, ...maintenance, createdAt: new Date() };
    
    try {
      const db = await this.getDb();
      await db.insert(maintenance).values(newMaintenance as any);
      return newMaintenance;
    } catch (error) {
      console.error('Error creating maintenance:', error);
      throw error;
    }
  }

  async updateMaintenance(id: string, maintenance: any): Promise<any> {
    try {
      const db = await this.getDb();
      await db.update(maintenance).set(maintenance as any).where(eq(maintenance.id, id));
      return this.getMaintenance(id);
    } catch (error) {
      console.error('Error updating maintenance:', error);
      return undefined;
    }
  }

  async deleteMaintenance(id: string): Promise<boolean> {
    try {
      const db = await this.getDb();
      await db.delete(maintenance).where(eq(maintenance.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      return false;
    }
  }
}
