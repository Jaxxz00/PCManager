import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertPcSchema } from "@shared/schema";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

// Estendo il tipo Request per includere la sessione
declare module 'express-serve-static-core' {
  interface Request {
    session?: {
      id?: string;
      userId?: string;
    };
  }
}

// Middleware di sicurezza per rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // Max 100 richieste per IP ogni 15 minuti
  message: { error: "Troppe richieste. Riprova più tardi." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware di autenticazione basilare (da espandere con Replit Auth)
const authenticateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Per ora controllo base - da implementare con sistema auth completo
  const apiKey = req.headers['x-api-key'] as string;
  const sessionId = req.session?.id;
  
  if (!apiKey && !sessionId) {
    return res.status(401).json({ error: "Autenticazione richiesta" });
  }
  
  // TODO: Implementare controlli auth più robusti
  next();
};

// Middleware per validazione input
const validateInput = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Dati non validi",
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Sicurezza: Helmet per headers sicuri - configurato per sviluppo
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Permette Vite HMR
        connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"], // WebSocket per HMR
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disabilita per sviluppo
  }));
  
  // Rate limiting per API pubbliche
  app.use('/api/', apiLimiter);
  
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

  // Document management routes
  
  // Endpoint per servire documenti pubblici
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Endpoint per servire documenti privati - RICHIEDE AUTENTICAZIONE
  app.get("/objects/:objectPath(*)", authenticateRequest, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      
      // Controllo ACL - solo utenti autorizzati possono accedere
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: req.session?.userId || 'anonymous',
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Endpoint per ottenere URL di upload - RICHIEDE AUTENTICAZIONE
  app.post("/api/objects/upload", authenticateRequest, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Endpoint per salvare i metadati del documento dopo upload - PROTETTO
  app.post("/api/documents", authenticateRequest, validateInput(z.object({
    documentURL: z.string().url(),
    filename: z.string().min(1).max(255),
    type: z.enum(['manleva', 'contratto', 'documento', 'altro'])
  })), async (req, res) => {
    if (!req.body.documentURL || !req.body.filename || !req.body.type) {
      return res.status(400).json({ error: "documentURL, filename, and type are required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.documentURL,
      );

      // Qui potresti salvare i metadati nel database se necessario
      // Per ora restituiamo solo il path normalizzato
      
      res.status(200).json({
        objectPath: objectPath,
        filename: req.body.filename,
        type: req.body.type,
        uploadedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error saving document metadata:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
