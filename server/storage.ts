import { type Employee, type InsertEmployee, type Pc, type InsertPc, type PcWithEmployee, employees, pcs } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

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
  private employees: Map<string, Employee>;
  private pcs: Map<string, Pc>;

  constructor() {
    this.employees = new Map();
    this.pcs = new Map();
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
      status: insertPc.status || "active",
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
    return result.rowCount > 0;
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
      employee: row.employee.id ? row.employee : null,
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
    return result.rowCount > 0;
  }

  async getDashboardStats() {
    const [stats] = await db.execute(sql`
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

    return {
      totalPCs: Number(stats.total_pcs),
      activePCs: Number(stats.active_pcs),
      maintenancePCs: Number(stats.maintenance_pcs),
      retiredPCs: Number(stats.retired_pcs),
      expiringWarranties: Number(stats.expiring_warranties),
    };
  }

  // Method to initialize with test data (run once)
  async initializeWithTestData(): Promise<void> {
    // Check if data already exists
    const existingEmployees = await this.getEmployees();
    if (existingEmployees.length > 0) {
      console.log("Database already has data, skipping initialization");
      return;
    }

    console.log("Initializing database with test data...");

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
}

// Switch to DatabaseStorage
export const storage = new DatabaseStorage();
