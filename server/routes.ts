import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertPcSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Employee routes
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(req.params.id, validatedData);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteEmployee(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // PC routes
  app.get("/api/pcs", async (req, res) => {
    try {
      const pcs = await storage.getPcs();
      res.json(pcs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch PCs" });
    }
  });

  app.get("/api/pcs/:id", async (req, res) => {
    try {
      const pc = await storage.getPc(req.params.id);
      if (!pc) {
        return res.status(404).json({ message: "PC not found" });
      }
      res.json(pc);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch PC" });
    }
  });

  app.post("/api/pcs", async (req, res) => {
    try {
      const validatedData = insertPcSchema.parse(req.body);
      
      // Check if PC ID already exists
      const existingPc = await storage.getPcByPcId(validatedData.pcId);
      if (existingPc) {
        return res.status(400).json({ message: "PC ID already exists" });
      }

      const pc = await storage.createPc(validatedData);
      res.status(201).json(pc);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create PC" });
    }
  });

  app.put("/api/pcs/:id", async (req, res) => {
    try {
      const validatedData = insertPcSchema.partial().parse(req.body);
      const pc = await storage.updatePc(req.params.id, validatedData);
      if (!pc) {
        return res.status(404).json({ message: "PC not found" });
      }
      res.json(pc);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update PC" });
    }
  });

  app.delete("/api/pcs/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePc(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "PC not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete PC" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
