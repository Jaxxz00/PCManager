import { type Employee, type InsertEmployee, type Pc, type InsertPc, type PcWithEmployee } from "@shared/schema";
import { randomUUID } from "crypto";

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

export const storage = new MemStorage();
