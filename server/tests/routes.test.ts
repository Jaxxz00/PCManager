import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import request from "supertest";
import type { Server } from "http";
import express from "express";
import { registerRoutes } from "../routes";
import { storage } from "../storage";

// Mock the storage module
vi.mock("../storage", () => ({
  storage: {
    getPcByPcId: vi.fn(),
    createPc: vi.fn((pc) => Promise.resolve({ ...pc, id: "mock-id" })),
    validateSession: vi.fn().mockResolvedValue({
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      role: 'admin',
    }),
  },
}));

// Mock the authenticateRequest middleware
const mockAuthenticateRequest = (req, res, next) => {
  req.session = {
    id: 'mock-session-id',
    userId: 'test-user-id',
    user: {
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      role: 'admin',
    },
  };
  next();
};

describe("PC Routes", () => {
  let server: Server;
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use("/api/pcs", mockAuthenticateRequest); // Apply mock auth to all /api/pcs routes
    server = await registerRoutes(app);
    await new Promise(resolve => server.listen(0, resolve)); // Listen on a random free port
  });

  afterAll((done) => {
    server.close(done);
  });

  describe("POST /api/pcs", () => {
    const validPcPayload = {
      brand: "TestBrand",
      model: "TestModel",
      serialNumber: "ABC-1234567890",
      cpu: "Intel i5",
      ram: 16, // Corrected to be a number
      storage: "512GB SSD",
      operatingSystem: "Windows 11",
      purchaseDate: new Date().toISOString(),
      warrantyExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    };

    it("should create a new PC and generate the pcId from the last 6 chars of the serial number", async () => {
      const serialNumber = "ABC-1234567890";
      const expectedPcIdSuffix = "567890"; // Correctly slice the last 6 characters

      (storage.getPcByPcId as vi.Mock).mockResolvedValue(null);
      (storage.createPc as vi.Mock).mockImplementation(pc => Promise.resolve({ ...pc, id: "mock-pc-id" }));

      const response = await request(app)
        .post("/api/pcs")
        .send({ ...validPcPayload, serialNumber: serialNumber })
        .expect(201);

      expect(response.body).toHaveProperty("pcId");
      expect(response.body.pcId).toBe(`PC-${expectedPcIdSuffix}`);

      expect(storage.createPc).toHaveBeenCalledWith(
        expect.objectContaining({
          pcId: `PC-${expectedPcIdSuffix}`,
        })
      );
    });

    it("should return 400 if the pcId already exists", async () => {
        const serialNumber = "EXISTINGSN123";
        const expectedPcId = `PC-${serialNumber.slice(-6).toUpperCase()}`;

        (storage.getPcByPcId as vi.Mock).mockResolvedValue({ id: "existing-pc-id", pcId: expectedPcId });

        await request(app)
            .post("/api/pcs")
            .send({ ...validPcPayload, serialNumber: serialNumber })
            .expect(400)
            .then(response => {
                expect(response.body).toEqual({ message: "PC ID già esistente per questo serial number" });
            });
    });
  });
});