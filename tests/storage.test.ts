import { JsonStorage } from '../server/jsonStorage';
import { promises as fs } from 'fs';
import path from 'path';

describe('JsonStorage', () => {
  let storage: JsonStorage;
  const testDataPath = path.join(process.cwd(), 'test-data.json');

  beforeEach(async () => {
    // Clean up before creating new storage
    try {
      await fs.unlink(testDataPath);
    } catch (error) {
      // File doesn't exist, ignore
    }

    storage = new JsonStorage();
  });

  afterEach(async () => {
    // Stop cleanup scheduler
    if (storage && (storage as any).stopCleanupScheduler) {
      (storage as any).stopCleanupScheduler();
    }

    // Clean up test data file if it exists
    try {
      await fs.unlink(testDataPath);
    } catch (error) {
      // File doesn't exist, ignore
    }
  });

  describe('Employee operations', () => {
    it('should create an employee', async () => {
      const employeeData = {
        name: 'John Doe',
        email: 'john@example.com',
        department: 'IT',
        company: 'Maori Group'
      };

      const employee = await storage.createEmployee(employeeData);

      expect(employee).toHaveProperty('id');
      expect(employee.name).toBe(employeeData.name);
      expect(employee.email).toBe(employeeData.email);
      expect(employee.createdAt).toBeInstanceOf(Date);
    });

    it('should retrieve an employee by ID', async () => {
      const employeeData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        department: 'HR',
        company: 'Maori Group'
      };

      const created = await storage.createEmployee(employeeData);
      const retrieved = await storage.getEmployee(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe(employeeData.name);
    });

    it('should update an employee', async () => {
      const employee = await storage.createEmployee({
        name: 'Test User',
        email: 'test@example.com',
        department: 'IT',
        company: 'Maori Group'
      });

      const updated = await storage.updateEmployee(employee.id, {
        department: 'Engineering'
      });

      expect(updated).toBeDefined();
      expect(updated?.department).toBe('Engineering');
      expect(updated?.name).toBe('Test User'); // Unchanged
    });

    it('should delete an employee', async () => {
      const employee = await storage.createEmployee({
        name: 'To Delete',
        email: 'delete@example.com',
        department: 'IT',
        company: 'Maori Group'
      });

      const deleted = await storage.deleteEmployee(employee.id);
      expect(deleted).toBe(true);

      const retrieved = await storage.getEmployee(employee.id);
      expect(retrieved).toBeUndefined();
    });

    it('should get all employees', async () => {
      await storage.createEmployee({
        name: 'Employee 1',
        email: 'emp1@example.com',
        department: 'IT',
        company: 'Maori Group'
      });

      await storage.createEmployee({
        name: 'Employee 2',
        email: 'emp2@example.com',
        department: 'HR',
        company: 'Maori Group'
      });

      const employees = await storage.getEmployees();
      expect(employees.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('PC operations', () => {
    it('should create a PC', async () => {
      const pcData = {
        pcId: 'TEST-001',
        brand: 'HP',
        model: 'EliteBook',
        cpu: 'i7',
        ram: 16,
        storage: '512GB',
        operatingSystem: 'Windows 11',
        serialNumber: 'SN-TEST-001',
        purchaseDate: new Date('2024-01-01'),
        warrantyExpiry: new Date('2027-01-01'),
        status: 'available' as const,
        notes: 'Test PC'
      };

      const pc = await storage.createPc(pcData);

      expect(pc).toHaveProperty('id');
      expect(pc.pcId).toBe(pcData.pcId);
      expect(pc.brand).toBe(pcData.brand);
    });

    it('should retrieve a PC by ID', async () => {
      const pc = await storage.createPc({
        pcId: 'TEST-002',
        brand: 'Dell',
        model: 'Latitude',
        cpu: 'i5',
        ram: 8,
        storage: '256GB',
        operatingSystem: 'Windows 10',
        serialNumber: 'SN-TEST-002',
        purchaseDate: new Date('2023-01-01'),
        warrantyExpiry: new Date('2026-01-01'),
        status: 'available' as const,
        notes: ''
      });

      const retrieved = await storage.getPc(pc.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(pc.id);
    });

    it('should assign a PC to an employee', async () => {
      const employee = await storage.createEmployee({
        name: 'PC User',
        email: 'pcuser@example.com',
        department: 'IT',
        company: 'Maori Group'
      });

      const pc = await storage.createPc({
        pcId: 'ASSIGN-001',
        brand: 'HP',
        model: 'ProBook',
        cpu: 'i5',
        ram: 8,
        storage: '256GB',
        operatingSystem: 'Windows 11',
        serialNumber: 'SN-ASSIGN-001',
        purchaseDate: new Date('2024-01-01'),
        warrantyExpiry: new Date('2027-01-01'),
        status: 'available' as const,
        notes: ''
      });

      const updated = await storage.updatePc(pc.id, {
        employeeId: employee.id,
        status: 'assigned'
      });

      expect(updated).toBeDefined();
      expect(updated?.employeeId).toBe(employee.id);
      expect(updated?.status).toBe('assigned');
    });
  });

  describe('Session cleanup', () => {
    it('should cleanup expired sessions', async () => {
      // Create an expired session manually
      const storage = new JsonStorage();

      // Add expired session to data
      (storage as any).data.sessions.push({
        id: 'expired-session',
        userId: 'test-user',
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        createdAt: new Date()
      });

      const removed = await storage.cleanupExpiredSessions();
      expect(removed).toBeGreaterThan(0);

      const sessions = (storage as any).data.sessions;
      const hasExpired = sessions.some((s: any) => s.id === 'expired-session');
      expect(hasExpired).toBe(false);
    });

    it('should not remove valid sessions', async () => {
      const storage = new JsonStorage();

      // Add valid session
      (storage as any).data.sessions.push({
        id: 'valid-session',
        userId: 'test-user',
        expiresAt: new Date(Date.now() + 3600000), // Expires in 1 hour
        createdAt: new Date()
      });

      await storage.cleanupExpiredSessions();

      const sessions = (storage as any).data.sessions;
      const hasValid = sessions.some((s: any) => s.id === 'valid-session');
      expect(hasValid).toBe(true);
    });
  });
});
