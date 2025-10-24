import request from 'supertest';
import express, { Express } from 'express';
import { JsonStorage } from '../server/jsonStorage';
import { registerRoutes } from '../server/routes';

describe('API Integration Tests', () => {
  let app: Express;
  let storage: JsonStorage;
  let server: any;
  let authToken: string;

  beforeAll(async () => {
    app = express() as Express;
    app.use(express.json());

    // Use in-memory storage for tests
    storage = new JsonStorage();

    // Register routes
    server = await registerRoutes(app, storage);

    // Create an admin user directly through storage (registration is disabled)
    await storage.createUser({
      username: 'admin@test.com',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      password: 'admin123',
      role: 'admin',
      isActive: true
    });

    // Login to get session token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'admin123'
      });

    // Extract sessionId from response body
    authToken = loginResponse.body.sessionId;

    // Debug: verify token is set
    if (!authToken) {
      console.error('Failed to get auth token. Login response:', loginResponse.body);
    }
  });

  afterAll(async () => {
    // Stop storage cleanup scheduler
    if (storage && storage.stopCleanupScheduler) {
      storage.stopCleanupScheduler();
    }

    // Cleanup server
    if (server && server.close) {
      await new Promise<void>((resolve) => server.close(resolve));
    }
  });

  describe('Health Check', () => {
    it('GET /health should return 200', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('Authentication', () => {
    it('POST /api/register should be disabled for security', async () => {
      const userData = {
        username: 'testuser',
        password: 'testpassword123',
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('REGISTRATION_DISABLED');
    });

    it('POST /api/login should authenticate user', async () => {
      // Create a test user directly through storage
      await storage.createUser({
        username: 'login@test.com',
        email: 'login@test.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
        role: 'user',
        isActive: true
      });

      // Try to login with email
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('sessionId');
    });

    it('POST /api/login should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Employees API', () => {
    it('POST /api/employees should create an employee', async () => {
      const employeeData = {
        name: 'Test Employee',
        email: 'employee@test.com',
        department: 'IT',
        company: 'Test Company'
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(employeeData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(employeeData.name);
    });

    it('GET /api/employees should return all employees', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('PCs API', () => {
    it('POST /api/pcs should create a PC', async () => {
      const pcData = {
        pcId: 'TEST-PC-001',
        brand: 'HP',
        model: 'EliteBook 840',
        cpu: 'Intel i7',
        ram: 16,
        storage: '512GB SSD',
        operatingSystem: 'Windows 11 Pro',
        serialNumber: 'SN123456789',
        purchaseDate: '2024-01-01',
        warrantyExpiry: '2027-01-01',
        status: 'available',
        notes: 'Test PC'
      };

      const response = await request(app)
        .post('/api/pcs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(pcData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('GET /api/pcs should return all PCs', async () => {
      const response = await request(app)
        .get('/api/pcs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on login endpoint', async () => {
      // Make multiple rapid requests (more than the limit of 5)
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({ username: 'test', password: 'test' })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);

      // At least one request should be rate limited
      expect(rateLimited).toBe(true);
    }, 10000);
  });
});
