import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { JsonStorage } from "./jsonStorage";
import { insertEmployeeSchema, insertPcSchema, loginSchema, registerSchema, setup2FASchema, verify2FASchema, disable2FASchema, setPasswordSchema } from "@shared/schema";
import { generateInviteLink, generateInviteMessage } from "./emailService";
import { z } from "zod";
import { getDb } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { generateManlevaPDF } from "./pdfGenerators/manlevaGenerator";
import bcrypt from "bcrypt";

// Estendo il tipo Request per includere la sessione
declare module 'express-serve-static-core' {
  interface Request {
    session?: {
      id?: string;
      userId?: string;
      user?: {
        id: string;
        username: string;
        email: string;
        role: string;
      };
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

// Rate limiting specifico per login (più restrittivo)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // Max 5 tentativi di login per IP ogni 15 minuti
  message: { error: "Troppi tentativi di accesso. Riprova tra 15 minuti." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Non conta i login riusciti
});

// Rate limiting per endpoint QR pubblico (protezione anti-enumerazione)
const qrScanLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minuti
  max: 20, // Max 20 scansioni QR per IP ogni 5 minuti
  message: { error: "Troppe scansioni QR. Riprova tra qualche minuto." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting per endpoint inviti pubblici (protezione brute-force token)
const inviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 10, // Max 10 richieste per IP ogni 15 minuti
  message: { error: "Troppe richieste. Riprova tra 15 minuti." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware di autenticazione con sessioni
const createAuthenticateRequest = (storage: JsonStorage) => async (req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.headers['authorization']?.replace('Bearer ', '') ||
                   req.session?.id ||
                   req.cookies?.sessionId;
  
  if (!sessionId) {
    return res.status(401).json({ error: "Autenticazione richiesta" });
  }
  
  try {
    const user = await storage.validateSession(sessionId);
    if (!user) {
      return res.status(401).json({ error: "Sessione non valida o scaduta" });
    }
    
    // Aggiungo i dati utente alla request
    req.session = {
      ...req.session,
      id: sessionId,
      userId: user.id,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      }
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: "Errore interno del server" });
  }
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

export async function registerRoutes(app: Express, storage: JsonStorage): Promise<Server> {
  // Create authenticated middleware
  const authenticateRequest = createAuthenticateRequest(storage);
  // Parser JSON per richieste API
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      // usa il body parser JSON solo per le rotte API
      // evitando conflitti con la SPA
      return express.json()(req, res, next);
    }
    next();
  });

  // Sicurezza: Helmet per headers sicuri - configurato per sviluppo
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: process.env.NODE_ENV === 'production' 
          ? ["'self'"] 
          : ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // unsafe-* solo in dev per HMR
        connectSrc: process.env.NODE_ENV === 'production'
          ? ["'self'"]
          : ["'self'", "ws:", "wss:", "http:", "https:"], // WebSocket solo in dev per HMR
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disabilita per sviluppo
  }));
  
  // Rate limiting per API pubbliche
  app.use('/api/', apiLimiter);
  
  // Blocco globale metodi non standard su endpoint auth
  app.all('/api/auth/login', (req, res, next) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: "Solo POST consentito su /api/auth/login" });
    }
    next();
  });
  
  app.all('/api/auth/me', (req, res, next) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: "Solo GET consentito su /api/auth/me" });
    }
    next();
  });
  
  // Middleware per bloccare metodi HTTP non autorizzati su endpoint specifici
  const methodFilter = (allowedMethods: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!allowedMethods.includes(req.method)) {
        return res.status(405).json({ 
          error: "Metodo non consentito",
          allowed: allowedMethods 
        });
      }
      next();
    };
  };

  // Middleware per validazione Content-Type strict
  const strictContentType = (req: Request, res: Response, next: NextFunction) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        return res.status(415).json({
          error: "Content-Type non supportato",
          required: "application/json"
        });
      }
    }
    next();
  };

  // Health check endpoint (per monitoring esterno)
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      storage: storage ? "connected" : "disconnected",
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Authentication routes (pubbliche, senza autenticazione)
  // Endpoint registrazione DISABILITATO per sicurezza aziendale
  app.post("/api/auth/register", methodFilter(['POST']), (req, res) => {
    res.status(403).json({
      error: "Registrazione non consentita",
      message: "La creazione di nuovi account è riservata esclusivamente agli amministratori di sistema",
      code: "REGISTRATION_DISABLED"
    });
  });

  app.post("/api/auth/login", methodFilter(['POST']), strictContentType, loginLimiter, validateInput(loginSchema), async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Timing attack protection - delay minimo costante
      const startTime = Date.now();
      
      // Validazione credenziali
      const user = await storage.validatePassword(email, password);
      
      // Calcolo timing per protezione da timing attack
      const elapsed = Date.now() - startTime;
      const minDelay = 300; // Delay minimo di 300ms
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }
      
      if (!user) {
        return res.status(401).json({ error: "Credenziali non valide" });
      }
      
      if (!user.isActive) {
        return res.status(401).json({ error: "Account disattivato" });
      }
      
      // 2FA temporaneamente disabilitata
      
      // Creo sessione
      const sessionId = await storage.createSession(user.id);
      
      // Rimuovo la password hash dalla risposta
      const { passwordHash, twoFactorSecret, backupCodes, ...userResponse } = user;
      
      res.json({
        message: "Accesso effettuato con successo",
        sessionId,
        user: userResponse
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Errore durante l'accesso" });
    }
  });

  app.post("/api/auth/logout", methodFilter(['POST']), authenticateRequest, async (req, res) => {
    try {
      const sessionId = req.session?.id;
      if (sessionId) {
        await storage.deleteSession(sessionId);
      }
      
      res.json({ message: "Logout effettuato con successo" });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: "Errore durante il logout" });
    }
  });

  app.get("/api/auth/me", methodFilter(['GET']), authenticateRequest, async (req, res) => {
    try {
      const user = req.session?.user;
      if (!user) {
        return res.status(401).json({ error: "Utente non autenticato" });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: "Errore durante il recupero utente" });
    }
  });

  // Update user profile
  app.put("/api/auth/profile", methodFilter(['PUT']), strictContentType, authenticateRequest, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Sessione non valida" });
      }

      const { firstName, lastName, email } = req.body;
      
      // Validation
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ error: "Nome, cognome e email sono obbligatori" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Email non valida" });
      }

      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      // Non restituisco dati sensibili
      const { passwordHash, twoFactorSecret, backupCodes, ...safeUser } = updatedUser;
      res.json({ 
        message: "Profilo aggiornato con successo",
        user: safeUser 
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  // User Management Routes (Admin only)
  app.get("/api/users", methodFilter(['GET']), authenticateRequest, async (req, res) => {
    try {
      const currentUser = req.session?.user;
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "Accesso negato. Solo amministratori possono visualizzare gli utenti." });
      }

      const users = await storage.getAllUsers();
      // Rimuovi dati sensibili
      const safeUsers = users.map(({ passwordHash, twoFactorSecret, backupCodes, ...safeUser }) => safeUser);
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  app.post("/api/users", methodFilter(['POST']), strictContentType, authenticateRequest, async (req, res) => {
    try {
      const currentUser = req.session?.user;
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "Accesso negato. Solo amministratori possono creare utenti." });
      }

      const { email, firstName, lastName, password, role } = req.body;
      
      // Validation
      if (!email || !firstName || !lastName || !password || !role) {
        return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password deve essere almeno 6 caratteri" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Email non valida" });
      }

      if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: "Ruolo non valido" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ error: "Email già esistente" });
      }

      // Create user with provided password
      const newUser = await storage.createUser({
        username: email as string, // Use email as username
        email: email as string,
        firstName: firstName as string,
        lastName: lastName as string,
        role: role as string,
        isActive: true, // User is active immediately
        password: password as string,
      });

      // Non restituisco dati sensibili
      const { passwordHash: _, twoFactorSecret, backupCodes, ...safeUser } = newUser;
      
      res.status(201).json({ 
        message: "Utente creato con successo.",
        user: safeUser,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  app.patch("/api/users/:userId", methodFilter(['PATCH']), strictContentType, authenticateRequest, async (req, res) => {
    try {
      const currentUser = req.session?.user;
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "Accesso negato. Solo amministratori possono modificare utenti." });
      }

      const { userId } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: "isActive deve essere un booleano" });
      }

      // Don't allow disabling the current admin user
      if (userId === currentUser.id && !isActive) {
        return res.status(400).json({ error: "Non puoi disattivare il tuo stesso account" });
      }

      const updatedUser = await storage.updateUser(userId, { isActive });
      if (!updatedUser) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      // Non restituisco dati sensibili
      const { passwordHash, twoFactorSecret, backupCodes, ...safeUser } = updatedUser;
      res.json({ 
        message: "Stato utente aggiornato",
        user: safeUser 
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  app.delete("/api/users/:userId", methodFilter(['DELETE']), authenticateRequest, async (req, res) => {
    try {
      const currentUser = req.session?.user;
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "Accesso negato. Solo amministratori possono eliminare utenti." });
      }

      const { userId } = req.params;

      // Don't allow deleting the current admin user
      if (userId === currentUser.id) {
        return res.status(400).json({ error: "Non puoi eliminare il tuo stesso account" });
      }

      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      res.json({ message: "Utente eliminato con successo" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  // Set password directly (Admin only, no invite)
  app.post("/api/users/:userId/set-password", methodFilter(['POST']), strictContentType, authenticateRequest, async (req, res) => {
    try {
      const currentUser = req.session?.user;
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "Accesso negato. Solo amministratori possono impostare password." });
      }

      const schema = z.object({ password: z.string().min(6, "Password minimo 6 caratteri") });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Dati non validi", details: parsed.error.errors });
      }

      const { userId } = req.params;
      const database = getDb();
      const [existing] = await database.select().from(users).where(eq(users.id, userId));
      if (!existing) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      const passwordHash = await bcrypt.hash(parsed.data.password, 12);
      await database.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId)).execute();
      return res.status(200).json({ message: "Password impostata con successo" });
    } catch (error) {
      console.error("Error setting user password:", error);
      res.status(500).json({ error: "Errore interno del server" });

    }
  });

  // Regenerate invite token for a user (Admin only)
  app.post("/api/users/:userId/invite/regenerate", methodFilter(['POST']), strictContentType, authenticateRequest, async (req, res) => {
    try {
      const currentUser = req.session?.user;
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "Accesso negato. Solo amministratori possono rigenerare inviti." });
      }

      const { userId } = req.params;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      const token = await storage.createInviteToken(userId);
      const inviteLink = generateInviteLink({ firstName: user.firstName, lastName: user.lastName, inviteToken: token });
      const inviteMessage = generateInviteMessage({ firstName: user.firstName, lastName: user.lastName, inviteToken: token });

      res.setHeader('Content-Type', 'application/json');
      return res.status(201).json({
        message: "Invito rigenerato con successo",
        inviteLink,
        inviteMessage,
        inviteToken: token,
      });
    } catch (error) {
      console.error("Error regenerating invite:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  // 2FA disabilitata (placeholder)
  app.all("/api/auth/2fa/:any*", (_req, res) => {
    res.status(403).json({ error: "2FA non abilitata" });
  });

  // (altri endpoint 2FA disabilitati)
  
  // Dashboard stats (protette da autenticazione)
  app.get("/api/dashboard/stats", authenticateRequest, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Employee routes (protette da autenticazione)
  app.get("/api/employees", authenticateRequest, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", authenticateRequest, async (req, res) => {
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

  app.post("/api/employees", methodFilter(['POST']), strictContentType, authenticateRequest, validateInput(insertEmployeeSchema), async (req, res) => {
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

  app.put("/api/employees/:id", methodFilter(['PUT']), strictContentType, authenticateRequest, validateInput(insertEmployeeSchema.partial()), async (req, res) => {
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

  app.delete("/api/employees/:id", methodFilter(['DELETE']), authenticateRequest, async (req, res) => {
    try {
      // Remove all assignments and references before deleting employee
      const assets = await storage.getAssets();
      const pcs = await storage.getPcs();
      const assignedAssets = assets.filter(a => a.employeeId === req.params.id);
      const assignedPcs = pcs.filter(p => p.employeeId === req.params.id);
      
      // Unassign all assets
      for (const asset of assignedAssets) {
        await storage.updateAsset(asset.id, {
          employeeId: undefined,
          status: "disponibile"
        });
      }
      
      // Unassign all PCs
      for (const pc of assignedPcs) {
        await storage.updatePc(pc.id, {
          employeeId: undefined,
          status: "disponibile"
        });
      }

      // Remove employee references from PC history (but keep the history records)
      await storage.removeEmployeeFromHistory(req.params.id);

      const deleted = await storage.deleteEmployee(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // PC routes (protette da autenticazione)
  app.get("/api/pcs", authenticateRequest, async (req, res) => {
    try {
      const pcs = await storage.getPcs();
      res.json(pcs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch PCs" });
    }
  });

  app.get("/api/pcs/:id", authenticateRequest, async (req, res) => {
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

  // Endpoint per ricerca PC tramite QR scan - PUBBLICO per utilizzo mobile
  app.get("/api/pcs/qr/:pcId", qrScanLimiter, async (req, res) => {
    try {
      // Validazione strict del pcId per prevenire path traversal
      const pcId = req.params.pcId;
      if (!pcId || pcId.includes('..') || pcId.includes('/') || pcId.includes('\\') || pcId.length > 50) {
        return res.status(400).json({ 
          message: "ID PC non valido",
          error: "Formato ID non consentito"
        });
      }
      
      const pc = await storage.getPcByPcId(pcId);
      if (!pc) {
        return res.status(404).json({ 
          message: "PC non trovato", 
          pcId: pcId 
        });
      }
      
      // Restituisce info PC + dipendente assegnato per QR scan
      const pcs = await storage.getPcs();
      const pcWithEmployee = pcs.find(p => p.id === pc.id);
      
      res.json({
        ...pc,
        employee: pcWithEmployee?.employee || null,
        scanTimestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Errore ricerca QR PC:", error);
      res.status(500).json({ message: "Errore interno server" });
    }
  });

  app.post("/api/pcs", methodFilter(['POST']), strictContentType, authenticateRequest, validateInput(insertPcSchema), async (req, res) => {
    try {
      const validatedData = req.body; // Dati già validati da validateInput
      
      // Genera automaticamente pcId dal serialNumber se non fornito
      const pcId = validatedData.pcId || `PC-${validatedData.serialNumber.slice(-6).toUpperCase()}`;
    
      // Check if PC ID already exists
      const existingPc = await storage.getPcByPcId(pcId);
      if (existingPc) {
        return res.status(400).json({ message: "PC ID già esistente per questo serial number" });
      }

      // Crea PC senza dipendente assegnato (sarà gestito dal workflow)
      const pcData = {
        ...validatedData,
        pcId,
        employeeId: null,
        // Le date sono già convertite da Zod transform
      };

      const pc = await storage.createPc(pcData);
      res.status(201).json(pc);
    } catch (error) {
      console.error("Error creating PC:", error);
      res.status(500).json({ message: "Failed to create PC" });
    }
  });

  app.put("/api/pcs/:id", methodFilter(['PUT']), strictContentType, authenticateRequest, validateInput(insertPcSchema.partial()), async (req, res) => {
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

  app.delete("/api/pcs/:id", methodFilter(['DELETE']), authenticateRequest, async (req, res) => {
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

  // PC History routes
  app.get("/api/pcs/:id/history", authenticateRequest, async (req, res) => {
    try {
      const { id } = req.params;
      const history = await storage.getPcHistory(id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching PC history:", error);
      res.status(500).json({ message: "Failed to fetch PC history" });
    }
  });

  app.get("/api/pc-history/serial/:serialNumber", authenticateRequest, async (req, res) => {
    try {
      const { serialNumber } = req.params;
      const history = await storage.getPcHistoryBySerial(serialNumber);
      res.json(history);
    } catch (error) {
      console.error("Error fetching PC history by serial:", error);
      res.status(500).json({ message: "Failed to fetch PC history" });
    }
  });

  app.get("/api/pc-history", authenticateRequest, async (req, res) => {
    try {
      const history = await storage.getAllPcHistory();
      res.json(history);
    } catch (error) {
      console.error("Error fetching all PC history:", error);
      res.status(500).json({ message: "Failed to fetch PC history" });
    }
  });

  // Asset management routes (unified inventory for all device types)
  
  // Get next available asset code for a given type
  app.get("/api/assets/next-code", authenticateRequest, async (req, res) => {
    try {
      const { type } = req.query;
      
      if (!type || typeof type !== 'string') {
        return res.status(400).json({ error: "Asset type is required" });
      }

      const validTypes = ['pc', 'smartphone', 'sim', 'tastiera', 'monitor', 'altro'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: "Invalid asset type" });
      }

      const nextCode = await storage.getNextAssetCode(type);
      res.json({ code: nextCode });
    } catch (error) {
      console.error("Error generating next asset code:", error);
      res.status(500).json({ error: "Failed to generate asset code" });
    }
  });
  
  // Get all assets with optional type filter
  app.get("/api/assets", authenticateRequest, async (req, res) => {
    try {
      const { type } = req.query;
      const assets = await storage.getAssets(type as string | undefined);
      res.json(assets);
    } catch (error: any) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ error: "Failed to fetch assets", message: error?.message || String(error) });
    }
  });

  // Get single asset by ID
  app.get("/api/assets/:id", authenticateRequest, async (req, res) => {
    try {
      const { id } = req.params;
      const asset = await storage.getAsset(id);
      
      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }

      res.json(asset);
    } catch (error) {
      console.error("Error fetching asset:", error);
      res.status(500).json({ error: "Failed to fetch asset" });
    }
  });

  // Create new asset
  app.post("/api/assets", methodFilter(['POST']), strictContentType, authenticateRequest, async (req, res) => {
    try {
      const { insertAssetSchema } = await import("@shared/schema");
      // Normalizza campi vuoti -> undefined
      const body = req.body || {};
      const normalizeStr = (v: any) => (typeof v === 'string' ? v.trim() : v);
      const normalized = {
        ...body,
        assetType: normalizeStr(body.assetType),
        brand: normalizeStr(body.brand),
        model: normalizeStr(body.model),
        serialNumber: normalizeStr(body.serialNumber),
        purchaseDate: body.purchaseDate === "" ? undefined : normalizeStr(body.purchaseDate),
        warrantyExpiry: body.warrantyExpiry === "" ? undefined : normalizeStr(body.warrantyExpiry),
        employeeId: body.employeeId === "" ? undefined : normalizeStr(body.employeeId),
        notes: body.notes === "" ? undefined : normalizeStr(body.notes),
      };
      const validationResult = insertAssetSchema.safeParse(normalized);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Dati non validi", 
          details: validationResult.error.errors 
        });
      }

      const newAsset = await storage.createAsset(validationResult.data);
      res.status(201).json(newAsset);
    } catch (error) {
      console.error("Error creating asset:", error);
      res.status(500).json({ error: "Failed to create asset" });
    }
  });

  // Update asset
  app.patch("/api/assets/:id", methodFilter(['PATCH']), strictContentType, authenticateRequest, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedAsset = await storage.updateAsset(id, req.body);
      
      if (!updatedAsset) {
        return res.status(404).json({ error: "Asset not found" });
      }

      res.json(updatedAsset);
    } catch (error) {
      console.error("Error updating asset:", error);
      res.status(500).json({ error: "Failed to update asset" });
    }
  });

  // Delete asset
  app.delete("/api/assets/:id", methodFilter(['DELETE']), authenticateRequest, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAsset(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Asset not found" });
      }

      res.json({ success: true, message: "Asset deleted successfully" });
    } catch (error) {
      console.error("Error deleting asset:", error);
      res.status(500).json({ error: "Failed to delete asset" });
    }
  });

  // Document management routes
  const documentsCache: any[] = [];
  
  // Get all documents
  app.get("/api/documents", authenticateRequest, async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      // Fallback: usa una cache in-process per ambienti senza persistenza
      return res.json(documentsCache);
    }
  });

  // Delete document
  app.delete("/api/documents/:id", methodFilter(['DELETE']), authenticateRequest, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteDocument(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Document not found" });
      }

      res.json({ success: true, message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Maintenance routes
  app.get("/api/maintenance", authenticateRequest, async (req, res) => {
    try {
      const maintenanceRecords = await storage.getAllMaintenance();
      res.json(maintenanceRecords);
    } catch (error) {
      console.error("Error fetching maintenance records:", error);
      res.status(500).json({ error: "Failed to fetch maintenance records" });
    }
  });

  app.post("/api/maintenance", methodFilter(['POST']), strictContentType, authenticateRequest, async (req, res) => {
    try {
      const { insertMaintenanceSchema } = await import("@shared/schema");
      const validationResult = insertMaintenanceSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Dati non validi", 
          details: validationResult.error.errors 
        });
      }

      const newRecord = await storage.createMaintenance(validationResult.data);
      res.status(201).json(newRecord);
    } catch (error) {
      console.error("Error creating maintenance record:", error);
      res.status(500).json({ error: "Failed to create maintenance record" });
    }
  });

  app.patch("/api/maintenance/:id", methodFilter(['PATCH']), strictContentType, authenticateRequest, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedRecord = await storage.updateMaintenance(id, req.body);
      
      if (!updatedRecord) {
        return res.status(404).json({ error: "Maintenance record not found" });
      }

      res.json(updatedRecord);
    } catch (error) {
      console.error("Error updating maintenance record:", error);
      res.status(500).json({ error: "Failed to update maintenance record" });
    }
  });

  app.delete("/api/maintenance/:id", methodFilter(['DELETE']), authenticateRequest, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteMaintenance(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Maintenance record not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting maintenance record:", error);
      res.status(500).json({ error: "Failed to delete maintenance record" });
    }
  });

  // Create new document
  app.post("/api/documents", authenticateRequest, async (req, res) => {
    const body = req.body || {};
    const payload = {
      title: body.title || "Documento",
      type: body.type || "manleva",
      description: body.description || null,
      fileName: body.fileName ?? null,
      fileSize: (Number.isFinite(body.fileSize) ? body.fileSize : null),
      pcId: body.pcId || null,
      employeeId: body.employeeId || null,
      tags: body.tags || null,
      uploadedAt: new Date(),
    } as any;

    try {
      const created = await storage.createDocument(payload);
      return res.status(201).json(created);
    } catch (error) {
      console.error("Error creating document:", error);
      // Fallback: salva in cache in-process e ritorna 201
      const cached = { id: undefined, ...payload };
      documentsCache.push(cached);
      return res.status(201).json(cached);
    }
  });
  
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
  app.post("/api/documents/normalize-url", authenticateRequest, validateInput(z.object({
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

  // Routes for user invite system
  
  // Validate invite token (public route)
  app.get("/api/invite/:token", inviteLimiter, async (req, res) => {
    try {
      const { token } = req.params;
      if (!token) {
        return res.status(400).json({ error: "Token mancante" });
      }

      const inviteInfo = await storage.getInviteToken(token);
      if (!inviteInfo) {
        return res.status(404).json({ error: "Token non valido o scaduto" });
      }

      // Get user info for display (without sensitive data)
      const user = await storage.getUser(inviteInfo.userId);
      if (!user) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      res.json({
        valid: true,
        userInfo: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          expiresAt: inviteInfo.expiresAt,
        }
      });
    } catch (error) {
      console.error("Error validating invite token:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  // Set password via invite token (public route)
  app.post("/api/invite/:token/set-password", inviteLimiter, methodFilter(['POST']), strictContentType, async (req, res) => {
    try {
      const { token } = req.params;
      const validationResult = setPasswordSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Dati non validi", 
          details: validationResult.error.errors 
        });
      }

      const { password } = validationResult.data;

      const success = await storage.useInviteToken(token, password);
      if (!success) {
        return res.status(400).json({ error: "Token non valido, scaduto o già utilizzato" });
      }

      // Activate user after password is set
      const inviteInfo = await storage.getInviteToken(token);
      if (inviteInfo) {
        await storage.updateUser(inviteInfo.userId, { isActive: true });
      }

      res.json({ 
        message: "Password impostata con successo. Ora puoi effettuare l'accesso." 
      });
    } catch (error) {
      console.error("Error setting password via invite:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  // Manleva PDF Generation
  app.post("/api/manleva/generate", methodFilter(['POST']), strictContentType, authenticateRequest, async (req, res) => {
    try {
      const { pcId, employeeId } = req.body;

      if (!pcId || !employeeId) {
        return res.status(400).json({ error: "PC ID e Employee ID sono richiesti" });
      }

      // Recupera dati PC o Asset - prima prova con pcId, poi con assetCode, poi con ID interno
      let item: any = await storage.getPcByPcId(pcId);
      let itemType: 'pc' | 'asset' = 'pc';
      
      if (!item) {
        // Se non trovato nei PC, prova negli asset con assetCode
        const assets = await storage.getAssets();
        const foundAsset = assets.find((a: any) => a.assetCode === pcId || a.id === pcId);
        if (foundAsset) {
          item = foundAsset;
          itemType = 'asset';
        }
      }
      
      if (!item) {
        // Ultima possibilità: prova con ID interno nei PC
        item = await storage.getPc(pcId);
      }
      
      if (!item) {
        return res.status(404).json({ error: "PC o Asset non trovato" });
      }

      // Recupera dati dipendente
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Dipendente non trovato" });
      }

      // Genera il PDF della manleva
      const itemModel = itemType === 'pc' 
        ? `${item.brand} ${item.model}`
        : `${(item as any).assetType?.toUpperCase()} - ${item.brand} ${item.model}`;
      
      const itemSerial = item.serialNumber || 'N/A';
      const itemId = itemType === 'pc' ? (item as any).pcId : (item as any).assetCode;
      
      const pdfBuffer = await generateManlevaPDF({
        employeeName: employee.name,
        employeeCompany: employee.company,
        pcModel: itemModel,
        pcSerial: itemSerial,
        assignmentDate: new Date().toLocaleDateString('it-IT'),
        location: 'Siena'
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="manleva_${itemId}_${employee.name.replace(/\s/g, '_')}.pdf"`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error("Error generating manleva PDF:", error);
      res.status(500).json({ error: "Errore nella generazione del PDF della manleva" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
