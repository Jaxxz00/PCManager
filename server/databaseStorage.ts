import { type Employee, type InsertEmployee, type Pc, type InsertPc, type PcWithEmployee, type User, type InsertUser, type Asset, type InsertAsset } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { getDb, hasDb } from "./db";

export class DatabaseStorage {
  private db: any;

  constructor() {
    // Database will be initialized lazily when first used
  }

  private async getDb() {
    if (!this.db) {
      this.db = await getDb();
    }
    return this.db;
  }

  // Employee methods
  async getEmployee(id: string): Promise<Employee | undefined> {
    try {
      const db = await this.getDb();
      const result = await db.select().from('employees').where({ id }).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting employee:', error);
      return undefined;
    }
  }

  async getEmployees(): Promise<Employee[]> {
    try {
      const db = await this.getDb();
      const result = await db.select().from('employees');
      return result || [];
    } catch (error) {
      console.error('Error getting employees:', error);
      return [];
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
      await db.insert('employees').values(employee);
      return employee;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  async updateEmployee(id: string, updateData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    try {
      const db = await this.getDb();
      await db.update('employees').set(updateData).where({ id });
      return this.getEmployee(id);
    } catch (error) {
      console.error('Error updating employee:', error);
      return undefined;
    }
  }

  async deleteEmployee(id: string): Promise<boolean> {
    try {
      const db = await this.getDb();
      await db.delete('employees').where({ id });
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
      await db.update('pcs').set({ employeeId: null }).where({ employeeId });
      await db.update('assets').set({ employeeId: null }).where({ employeeId });
    } catch (error) {
      console.error('Error removing employee from history:', error);
    }
  }

  // PC methods
  async getPc(id: string): Promise<Pc | undefined> {
    try {
      const result = await this.db.select().from('pcs').where({ id }).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting PC:', error);
      return undefined;
    }
  }

  async getPcs(): Promise<PcWithEmployee[]> {
    try {
      const result = await this.db
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
      const result = await this.db.select().from('pcs').where({ pcId }).limit(1);
      return result[0] || undefined;
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
      await this.db.insert('pcs').values(pc);
      return pc;
    } catch (error) {
      console.error('Error creating PC:', error);
      throw error;
    }
  }

  async updatePc(id: string, updateData: Partial<InsertPc>): Promise<Pc | undefined> {
    try {
      await this.db.update('pcs').set({ ...updateData, updatedAt: new Date() }).where({ id });
      return this.getPc(id);
    } catch (error) {
      console.error('Error updating PC:', error);
      return undefined;
    }
  }

  async deletePc(id: string): Promise<boolean> {
    try {
      await this.db.delete('pcs').where({ id });
      return true;
    } catch (error) {
      console.error('Error deleting PC:', error);
      return false;
    }
  }

  // Asset methods
  async getAsset(id: string): Promise<Asset | undefined> {
    try {
      const result = await this.db.select().from('assets').where({ id }).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting asset:', error);
      return undefined;
    }
  }

  async getAssets(type?: string): Promise<Asset[]> {
    try {
      let query = this.db.select().from('assets');
      if (type) {
        query = query.where({ assetType: type });
      }
      const result = await query;
      return result || [];
    } catch (error) {
      console.error('Error getting assets:', error);
      return [];
    }
  }

  async getAssetByCode(assetCode: string): Promise<Asset | undefined> {
    try {
      const result = await this.db.select().from('assets').where({ assetCode }).limit(1);
      return result[0] || undefined;
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
      await this.db.insert('assets').values(asset);
      return asset;
    } catch (error) {
      console.error('Error creating asset:', error);
      throw error;
    }
  }

  async updateAsset(id: string, updateData: Partial<InsertAsset>): Promise<Asset | undefined> {
    try {
      await this.db.update('assets').set({ ...updateData, updatedAt: new Date() }).where({ id });
      return this.getAsset(id);
    } catch (error) {
      console.error('Error updating asset:', error);
      return undefined;
    }
  }

  async deleteAsset(id: string): Promise<boolean> {
    try {
      await this.db.delete('assets').where({ id });
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
      const result = await this.db.select().from('assets').where({ assetType });
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
      const result = await this.db.select().from('users').where({ id }).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await this.db.select().from('users').where({ username }).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await this.db.select().from('users').where({ email }).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await this.db.select().from('users');
      return result || [];
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
      await this.db.insert('users').values(user);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    try {
      await this.db.update('users').set({ ...updateData, updatedAt: new Date() }).where({ id });
      return this.getUser(id);
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await this.db.delete('users').where({ id });
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    try {
      await this.db.update('users').set({ lastLogin: new Date() }).where({ id });
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
      await this.db.insert('sessions').values({ id: sessionId, userId, expiresAt });
      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async validateSession(sessionId: string): Promise<User | null> {
    try {
      const session = await this.db.select().from('sessions').where({ id: sessionId }).limit(1);
      if (!session[0]) return null;
      
      if (new Date(session[0].expiresAt) < new Date()) {
        await this.deleteSession(sessionId);
        return null;
      }
      
      return this.getUser(session[0].userId);
    } catch (error) {
      console.error('Error validating session:', error);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await this.db.delete('sessions').where({ id: sessionId });
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  // Dashboard stats
  async getDashboardStats() {
    try {
      const allPcs = await this.db.select().from('pcs');
      const allAssets = await this.db.select().from('assets');
      const allEmployees = await this.db.select().from('employees');
      const allMaintenance = await this.db.select().from('maintenance');
      
      // Conteggi totali corretti
      const totalPCs = allPcs.length;
      const totalAssets = allAssets.length;
      const totalDevices = totalPCs + totalAssets;
      
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
    throw new Error("Documents not supported in database storage");
  }

  async getDocumentById(id: string): Promise<any> {
    throw new Error("Documents not supported in database storage");
  }

  async createDocument(document: any): Promise<any> {
    throw new Error("Documents not supported in database storage");
  }

  async updateDocument(id: string, document: any): Promise<any> {
    throw new Error("Documents not supported in database storage");
  }

  async deleteDocument(id: string): Promise<boolean> {
    throw new Error("Documents not supported in database storage");
  }

  async getMaintenance(id: string): Promise<any> {
    throw new Error("Maintenance not supported in database storage");
  }

  async getAllMaintenance(): Promise<any[]> {
    try {
      const result = await this.db.select().from('maintenance');
      return result || [];
    } catch (error) {
      console.error('Error getting maintenance:', error);
      return [];
    }
  }

  async createMaintenance(maintenance: any): Promise<any> {
    const id = randomUUID();
    const newMaintenance = { id, ...maintenance, createdAt: new Date() };
    
    try {
      await this.db.insert('maintenance').values(newMaintenance);
      return newMaintenance;
    } catch (error) {
      console.error('Error creating maintenance:', error);
      throw error;
    }
  }

  async updateMaintenance(id: string, maintenance: any): Promise<any> {
    try {
      await this.db.update('maintenance').set(maintenance).where({ id });
      return this.getMaintenance(id);
    } catch (error) {
      console.error('Error updating maintenance:', error);
      return undefined;
    }
  }

  async deleteMaintenance(id: string): Promise<boolean> {
    try {
      await this.db.delete('maintenance').where({ id });
      return true;
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      return false;
    }
  }
}
