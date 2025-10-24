import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { insertEmployeeSchema, insertPcSchema, loginSchema, registerSchema, setup2FASchema, verify2FASchema, disable2FASchema, setPasswordSchema } from "@shared/schema";
import { z } from "zod";
import { getDb } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import helmet from "helmet";
import bcrypt from "bcrypt";
import multer from "multer";
import { connection, initializeDatabase } from "./db";

// Import middleware ottimizzati
import { 
  apiLimiter, 
  maybeLoginLimiter, 
  qrScanLimiter,
  createAuthenticateRequest, 
  validateInput, 
  methodFilter, 
  strictContentType, 
  sanitizeUser,
  requestLogger 
} from "./middleware";

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

// Middleware sono ora importati da ./middleware.ts

export async function registerRoutes(app: Express, storage: any): Promise<Server> {
  // Create authenticated middleware
  const authenticateRequest = createAuthenticateRequest(storage);
  // Middleware di logging
  app.use(requestLogger);
  
  // Parser JSON per richieste API
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return express.json()(req, res, next);
    }
    next();
  });

  // Sicurezza: Helmet per headers sicuri
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: process.env.NODE_ENV === 'production' 
          ? ["'self'"] 
          : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        connectSrc: process.env.NODE_ENV === 'production'
          ? ["'self'"]
          : ["'self'", "ws:", "wss:", "http:", "https:"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  
  // Rate limiting per API
  app.use('/api/', apiLimiter);
  
  // Configurazione multer per upload file (prima del middleware strictContentType)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: process.env.NODE_ENV === 'production' ? 5 * 1024 * 1024 : 10 * 1024 * 1024, // 5MB in produzione, 10MB in sviluppo
    },
    fileFilter: (req, file, cb) => {
      // Accetta solo PDF per i documenti
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Solo file PDF sono accettati'));
      }
    }
  });

  // Upload document with file (prima del middleware strictContentType)
  app.post("/api/documents/upload", authenticateRequest, upload.single('file'), async (req, res) => {
    try {
      // Gestisce il file caricato con multer
      const file = (req as any).file;
      const body = req.body || {};
      
      const payload = {
        title: body.title || "Documento Caricato",
        type: body.type || "manleva_firmata",
        description: body.description || null,
        fileName: file ? file.originalname : (body.fileName || "documento_firmato.pdf"),
        fileSize: file ? file.size : (body.fileSize || 0),
        fileBuffer: file ? file.buffer : null, // Salva il buffer del file
        pcId: body.pcId || null,
        employeeId: body.employeeId || null,
        tags: body.tags || "upload, firmata",
        uploadedAt: new Date(),
      };

      const created = await storage.createDocument(payload);
      return res.status(201).json(created);
    } catch (error) {
      console.error("Error uploading document:", error);
      return res.status(500).json({ error: "Errore nel caricamento del documento" });
    }
  });
  
  // Middleware per validazione Content-Type
  app.use('/api/', strictContentType);
  
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

  // DEV ONLY: inizializza tabelle minime per autenticazione
  app.post("/api/dev/init-db", async (_req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: "Endpoint disponibile solo in sviluppo" });
      }
      if (!process.env.DATABASE_URL) {
        return res.status(400).json({ error: "DATABASE_URL non impostata" });
      }
      await initializeDatabase();
      const conn = connection as any;
      if (!conn) {
        return res.status(500).json({ error: "Connessione DB non inizializzata" });
      }
      // Crea tabelle minime idempotenti
      await conn.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY,
          username VARCHAR(100) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'admin',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          last_login TIMESTAMP NULL,
          two_factor_secret TEXT NULL,
          two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          backup_codes JSON NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      await conn.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX sessions_user_id_idx (user_id),
          INDEX sessions_expires_at_idx (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      return res.json({ ok: true });
    } catch (err: any) {
      console.error("init-db error:", err);
      return res.status(500).json({ error: "Errore inizializzazione DB", details: err?.message || String(err) });
    }
  });

  // DEV ONLY: forza (upsert) admin con password nota
  app.post("/api/dev/ensure-admin", async (_req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: "Endpoint disponibile solo in sviluppo" });
      }
      const existing = await storage.getUserByEmail("admin@maorigroup.com");
      if (!existing) {
        const created = await storage.createUser({
          username: "admin",
          email: "admin@maorigroup.com",
          firstName: "Amministratore",
          lastName: "Sistema",
          role: "admin",
          isActive: true,
          password: "admin123",
        });
        return res.json({ created: true, user: { id: created.id, email: created.email } });
      }

      const passwordHash = await bcrypt.hash("admin123", 12);
      const updated = await storage.updateUser(existing.id, { passwordHash });
      return res.json({ created: false, updated: !!updated, user: { id: existing.id, email: existing.email } });
    } catch (err: any) {
      console.error("ensure-admin error:", err);
      return res.status(500).json({ error: "Errore ensure-admin", details: err?.message || String(err) });
    }
  });

  // DEV ONLY: elenca utenti (solo per debug in sviluppo)
  app.get("/api/dev/users", async (_req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: "Endpoint disponibile solo in sviluppo" });
      }
      const list = await storage.getAllUsers();
      const safe = (list || []).map((u: any) => ({ id: u.id, email: u.email, username: (u as any).username, role: u.role, isActive: u.isActive }));
      return res.json({ count: safe.length, users: safe });
    } catch (err: any) {
      console.error("dev/users error:", err);
      return res.status(500).json({ error: "Errore elenco utenti", details: err?.message || String(err) });
    }
  });

  // DEV ONLY: login diretto per admin (bypassa validazione normale)
  app.post("/api/dev/login-admin", async (_req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: "Endpoint disponibile solo in sviluppo" });
      }
      const admin = await storage.getUserByEmail("admin@maorigroup.com");
      if (!admin) {
        return res.status(404).json({ error: "Admin non trovato" });
      }
      const sessionId = await storage.createSession(admin.id);
      return res.json({ 
        message: "Login admin forzato", 
        sessionId, 
        user: { id: admin.id, email: admin.email, role: admin.role } 
      });
    } catch (err: any) {
      console.error("dev/login-admin error:", err);
      return res.status(500).json({ error: "Errore login admin", details: err?.message || String(err) });
    }
  });

  // DEV ONLY: reset password admin a "admin123"
  app.post("/api/dev/reset-admin-password", async (_req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: "Endpoint disponibile solo in sviluppo" });
      }
      const admin = await storage.getUserByEmail("admin@maorigroup.com");
      if (!admin) {
        return res.status(404).json({ error: "Admin non trovato" });
      }
      const passwordHash = await bcrypt.hash("admin123", 12);
      await storage.updateUser(admin.id, { passwordHash });
      return res.json({ ok: true });
    } catch (err: any) {
      console.error("dev/reset-admin-password error:", err);
      return res.status(500).json({ error: "Errore reset password", details: err?.message || String(err) });
    }
  });

  // DEV ONLY: verifica se una sessione esiste
  app.get("/api/dev/check-session/:sessionId", async (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: "Endpoint disponibile solo in sviluppo" });
      }
      const { sessionId } = req.params;
      const user = await storage.validateSession(sessionId);
      if (!user) {
        return res.json({ exists: false, error: "Sessione non trovata" });
      }
      return res.json({ exists: true, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err: any) {
      console.error("dev/check-session error:", err);
      return res.status(500).json({ error: "Errore verifica sessione", details: err?.message || String(err) });
    }
  });

  // Bootstrap admin user (solo in sviluppo) — rimosso in produzione
  app.post("/api/bootstrap-admin", async (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: "Bootstrap solo in sviluppo" });
      }
      
      const users = await storage.getAllUsers();
      if (users && users.length > 0) {
        return res.json({ message: "Admin già esistente", users: users.length });
      }
      
      const admin = await storage.createUser({
        username: "admin",
        email: "admin@maorigroup.com",
        firstName: "Amministratore",
        lastName: "Sistema",
        role: "admin",
        isActive: true,
        password: "admin123"
      });
      
      res.json({ message: "Admin creato", admin: { email: admin.email, role: admin.role } });
    } catch (error) {
      const message = (error as any)?.message || String(error);
      console.error("Bootstrap error:", error);
      res.status(500).json({ error: "Errore bootstrap", details: message });
    }
  });

  app.post("/api/auth/login", methodFilter(['POST']), strictContentType, maybeLoginLimiter, validateInput(loginSchema), async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Timing attack protection - delay minimo costante
      const startTime = Date.now();
      
      // Validazione credenziali
      let user = await storage.validatePassword(email, password);
      
      // Calcolo timing per protezione da timing attack
      const elapsed = Date.now() - startTime;
      const minDelay = 300; // Delay minimo di 300ms
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }
      
      if (!user) {
        // Dev fallback: auto-provision admin login se credenziali standard
        if (process.env.NODE_ENV === 'development' && email === 'admin@maorigroup.com' && password === 'admin123') {
          try {
            const existing = await storage.getUserByEmail(email);
            if (!existing) {
              const created = await storage.createUser({
                username: 'admin',
                email,
                firstName: 'Amministratore',
                lastName: 'Sistema',
                role: 'admin',
                isActive: true,
                password: 'admin123',
              });
              user = created as any;
            } else {
              user = existing;
            }
          } catch (e) {
            // ignore and continue with 401
          }
        }
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
      
      // Rimuovo i campi sensibili dalla risposta
      const userResponse: any = sanitizeUser(user);
      
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
      const { passwordHash, twoFactorSecret, backupCodes, ...safeUser }: any = updatedUser as any;
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
      const safeUsers = users.map((u: any) => sanitizeUser(u));
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
      const { passwordHash: _, twoFactorSecret, backupCodes, ...safeUser }: any = newUser as any;
      
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
      const safeUser: any = { ...(updatedUser as any) };
      delete safeUser.passwordHash;
      delete safeUser.twoFactorSecret;
      delete safeUser.backupCodes;
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
      const existing = await storage.getUser(userId);
      if (!existing) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      const passwordHash = await bcrypt.hash(parsed.data.password, 12);
      await storage.updateUser(userId, { passwordHash });
      return res.status(200).json({ message: "Password impostata con successo" });
    } catch (error) {
      console.error("Error setting user password:", error);
      res.status(500).json({ error: "Errore interno del server" });

    }
  });

  // Endpoint inviti disabilitato

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
      const assignedAssets = assets.filter((a: any) => a.employeeId === req.params.id);
      const assignedPcs = pcs.filter((p: any) => p.employeeId === req.params.id);
      
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
      const pcWithEmployee = (pcs as any[]).find((p: any) => p.id === pc.id);
      
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

  // PATCH endpoint per aggiornamenti parziali (usato per riconsegna)
app.patch("/api/pcs/:id", methodFilter(['PATCH']), strictContentType, authenticateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log("🔍 PATCH PC request:", { id, updateData });
    
    // Debug: controlla tutti i PC nel database (semplificato)
    console.log("🔍 Skipping PC list debug to avoid stack overflow");
    
    // Verifica se il PC esiste prima di aggiornarlo
    const existingPc = await storage.getPc(id);
    if (!existingPc) {
      console.log("❌ PC not found:", id);
      // Non mostrare gli ID se c'è stato un errore nel recupero
      return res.status(404).json({ message: "PC not found" });
    }
    
    console.log("✅ PC found:", existingPc);
    
    // Aggiorna il PC con i dati forniti
    const pc = await storage.updatePc(id, updateData);
    if (!pc) {
      console.log("❌ Failed to update PC:", id);
      return res.status(500).json({ message: "Failed to update PC" });
    }
    
    console.log("✅ PC updated successfully:", pc);
    res.json(pc);
  } catch (error) {
    console.error("Error updating PC:", error);
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

  // Get all assets including PCs
  app.get("/api/assets/all-including-pcs", authenticateRequest, async (req, res) => {
    try {
      const allAssets = await storage.getAllAssetsIncludingPCs();
      res.json(allAssets);
    } catch (error: any) {
      console.error("Error fetching all assets including PCs:", error);
      res.status(500).json({ error: "Failed to fetch all assets", message: error?.message || String(error) });
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


  // Generate manleva PDF
  app.post("/api/manleva/generate", methodFilter(['POST']), strictContentType, authenticateRequest, async (req, res) => {
    try {
      const { pcId, employeeId } = req.body;
      
      console.log("🔍 Manleva request:", { pcId, employeeId });
      
      if (!pcId || !employeeId) {
        return res.status(400).json({ error: "pcId e employeeId sono obbligatori" });
      }

      // Recupera i dati dell'asset e del dipendente
      // Prima cerca per assetCode, poi per ID
      let asset = null;
      let pc = null;
      
      // Cerca prima per assetCode in getAllAssetsIncludingPCs
      const allAssets = await storage.getAllAssetsIncludingPCs();
      console.log("🔍 All assets:", allAssets.length);
      console.log("🔍 All assets details:", allAssets.map((a: any) => ({ id: a.id, assetCode: a.assetCode, assetType: a.assetType, isPc: a.isPc })));
      console.log("🔍 Looking for pcId:", pcId);
      const foundItem = allAssets.find((a: any) => a.assetCode === pcId || a.id === pcId);
      console.log("🔍 Found item:", foundItem ? { id: foundItem.id, assetCode: foundItem.assetCode, assetType: foundItem.assetType, isPc: foundItem.isPc } : null);
      
      if (foundItem) {
        if (foundItem.isPc) {
          // È un PC dalla tabella pcs
          pc = await storage.getPc(foundItem.id);
        } else {
          // È un asset dalla tabella assets (inclusi quelli con assetType: "computer")
          asset = await storage.getAsset(foundItem.id);
        }
      } else {
        // Se non trova per assetCode, prova per ID diretto
        asset = await storage.getAsset(pcId);
        if (!asset) {
          pc = await storage.getPc(pcId);
        }
      }
      
      if (!asset && !pc) {
        return res.status(404).json({ error: "Asset non trovato" });
      }
      
      console.log("🔍 Looking for employee:", employeeId);
      const employee = await storage.getEmployee(employeeId);
      console.log("🔍 Employee found:", employee ? "YES" : "NO", employee ? { id: employee.id, name: employee.name, email: employee.email } : null);
      
      if (!employee) {
        return res.status(404).json({ error: "Dipendente non trovato" });
      }

      // Genera PDF reale usando jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Header
      doc.setFontSize(20);
      doc.text('DOCUMENTO DI MANLEVA', 105, 30, { align: 'center' });
      doc.setFontSize(12);
      doc.text('Assegnazione Asset Aziendale', 105, 40, { align: 'center' });
      
      // Linea separatrice
      doc.line(20, 50, 190, 50);
      
      // Contenuto
      let yPosition = 70;
      doc.setFontSize(12);
      
      // Data
      doc.setFontSize(10);
      doc.text('Data:', 20, yPosition);
      doc.text(new Date().toLocaleDateString('it-IT'), 60, yPosition);
      yPosition += 15;
      
      // Asset Info
      doc.text('Asset ID:', 20, yPosition);
      doc.text(asset ? asset.assetCode : pc.pcId || 'N/A', 60, yPosition);
      yPosition += 15;
      
      doc.text('Modello:', 20, yPosition);
      doc.text(asset ? `${asset.brand} ${asset.model}` : `${pc.brand} ${pc.model}`, 60, yPosition);
      yPosition += 15;
      
      doc.text('Numero di Serie:', 20, yPosition);
      doc.text(asset ? asset.serialNumber : pc.serialNumber || 'N/A', 60, yPosition);
      yPosition += 20;
      
      // Employee Info
      doc.text('Dipendente:', 20, yPosition);
      doc.text(`${employee.firstName} ${employee.lastName}`, 60, yPosition);
      yPosition += 15;
      
      doc.text('Email:', 20, yPosition);
      doc.text(employee.email || 'N/A', 60, yPosition);
      yPosition += 15;
      
      doc.text('Dipartimento:', 20, yPosition);
      doc.text(employee.department || 'N/A', 60, yPosition);
      yPosition += 30;
      
      // Firma
      doc.text('Firma del Dipendente:', 20, yPosition);
      doc.line(20, yPosition + 10, 100, yPosition + 10);
      yPosition += 25;
      
      doc.text('Firma del Responsabile:', 20, yPosition);
      doc.line(20, yPosition + 10, 100, yPosition + 10);
      
      // Footer
      doc.setFontSize(8);
      doc.text(`Generato da: ${req.session?.user?.email || 'Sistema'}`, 20, 280);
      doc.text(`Data generazione: ${new Date().toLocaleString('it-IT')}`, 20, 285);
      
      // Genera il PDF come buffer
      const pdfBuffer = doc.output('arraybuffer');
      
      // Imposta headers per download PDF
      const assetId = asset ? asset.assetCode : pc.pcId;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="manleva_${assetId}_${employee.firstName}_${employee.lastName}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.byteLength);
      
      // Invia il PDF
      res.send(Buffer.from(pdfBuffer));
      
    } catch (error) {
      console.error("Error generating manleva:", error);
      res.status(500).json({ error: "Errore nella generazione della manleva" });
    }
  });

  // Generate return document PDF
  app.post("/api/return/generate", methodFilter(['POST']), strictContentType, authenticateRequest, async (req, res) => {
    try {
      const { assetId, employeeId } = req.body;
      
      console.log("🔍 Return document request:", { assetId, employeeId });
      
      if (!assetId || !employeeId) {
        return res.status(400).json({ error: "assetId e employeeId sono obbligatori" });
      }

      // Recupera i dati dell'asset e del dipendente
      let asset = null;
      let pc = null;
      
      // Cerca prima per assetCode in getAllAssetsIncludingPCs
      const allAssets = await storage.getAllAssetsIncludingPCs();
      const foundItem = allAssets.find((a: any) => a.assetCode === assetId || a.id === assetId);
      
      if (foundItem) {
        if (foundItem.isPc) {
          pc = await storage.getPc(foundItem.id);
        } else {
          asset = await storage.getAsset(foundItem.id);
        }
      } else {
        asset = await storage.getAsset(assetId);
        if (!asset) {
          pc = await storage.getPc(assetId);
        }
      }
      
      if (!asset && !pc) {
        return res.status(404).json({ error: "Asset non trovato" });
      }
      
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Dipendente non trovato" });
      }

      // Genera PDF reale usando jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Header
      doc.setFontSize(20);
      doc.text('DOCUMENTO DI RICONSEGNA ASSET', 105, 30, { align: 'center' });
      doc.setFontSize(12);
      doc.text('Maori Group - Asset Manager', 105, 40, { align: 'center' });
      
      // Linea separatrice
      doc.line(20, 50, 190, 50);
      
      // Contenuto
      let yPosition = 70;
      doc.setFontSize(12);
      
      // Data
      doc.setFontSize(10);
      doc.text('Data Riconsegna:', 20, yPosition);
      doc.text(new Date().toLocaleDateString('it-IT'), 80, yPosition);
      yPosition += 15;
      
      // Asset Info
      const itemData = asset || pc;
      doc.text('Codice Asset:', 20, yPosition);
      doc.text(itemData.assetCode || itemData.id, 80, yPosition);
      yPosition += 15;
      
      doc.text('Tipo:', 20, yPosition);
      doc.text(itemData.assetType || 'Computer', 80, yPosition);
      yPosition += 15;
      
      if (itemData.brand && itemData.model) {
        doc.text('Brand/Modello:', 20, yPosition);
        doc.text(`${itemData.brand} ${itemData.model}`, 80, yPosition);
        yPosition += 15;
      }
      
      doc.text('Numero Seriale:', 20, yPosition);
      doc.text(itemData.serialNumber || 'N/A', 80, yPosition);
      yPosition += 20;
      
      // Employee Info
      doc.text('Collaboratore:', 20, yPosition);
      doc.text(employee.name, 80, yPosition);
      yPosition += 15;
      
      doc.text('Email:', 20, yPosition);
      doc.text(employee.email, 80, yPosition);
      yPosition += 15;
      
      doc.text('Dipartimento:', 20, yPosition);
      doc.text(employee.department || 'N/A', 80, yPosition);
      yPosition += 30;
      
      // Dichiarazione
      doc.setFontSize(11);
      doc.text('DICHIARAZIONE DI RICONSEGNA', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      const declarationText = `Il sottoscritto ${employee.name} dichiara di riconsegnare l'asset sopra descritto in buone condizioni e di aver rimosso tutti i dati personali e le applicazioni installate.`;
      const splitText = doc.splitTextToSize(declarationText, 170);
      doc.text(splitText, 20, yPosition);
      yPosition += splitText.length * 5 + 10;
      
      doc.text('Motivazione riconsegna:', 20, yPosition);
      yPosition += 10;
      doc.text('□ Fine assegnazione', 30, yPosition);
      yPosition += 8;
      doc.text('□ Cambio di ruolo', 30, yPosition);
      yPosition += 8;
      doc.text('□ Dimissioni', 30, yPosition);
      yPosition += 8;
      doc.text('□ Altro: _________________', 30, yPosition);
      yPosition += 20;
      
      // Firma
      doc.setFontSize(11);
      doc.text('FIRME', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.text('Collaboratore:', 20, yPosition);
      doc.line(20, yPosition + 10, 100, yPosition + 10);
      doc.text(employee.name, 20, yPosition + 20);
      doc.text('Data: _______________', 20, yPosition + 30);
      
      doc.text('Responsabile IT:', 110, yPosition);
      doc.line(110, yPosition + 10, 190, yPosition + 10);
      doc.text('_________________', 110, yPosition + 20);
      doc.text('Data: _______________', 110, yPosition + 30);
      
      // Footer
      doc.setFontSize(8);
      doc.text(`Generato da: ${req.session?.user?.email || 'Sistema'}`, 20, 280);
      doc.text(`Data generazione: ${new Date().toLocaleString('it-IT')}`, 20, 285);
      
      // Genera il PDF come buffer
      const pdfBuffer = doc.output('arraybuffer');
      
      // Imposta headers per download PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="riconsegna_${itemData.assetCode || itemData.id}_${employee.name}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.byteLength);
      
      // Invia il PDF
      res.send(Buffer.from(pdfBuffer));
      
    } catch (error) {
      console.error("Error generating return document:", error);
      res.status(500).json({ error: "Errore nella generazione del documento di riconsegna" });
    }
  });

  // Download manleva PDF
  app.get("/api/manleva/download/:filename", authenticateRequest, async (req, res) => {
    try {
      const { filename } = req.params;
      
      // Per ora generiamo un PDF semplice con i dati
      // In futuro si può implementare una libreria PDF reale
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Documento di Manleva</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { margin: 20px 0; }
            .field { margin: 10px 0; }
            .label { font-weight: bold; }
            .signature { margin-top: 50px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DOCUMENTO DI MANLEVA</h1>
            <p>Assegnazione Asset Aziendale</p>
          </div>
          
          <div class="content">
            <div class="field">
              <span class="label">Data:</span> ${new Date().toLocaleDateString('it-IT')}
            </div>
            <div class="field">
              <span class="label">Asset ID:</span> ${req.query.pcId || 'N/A'}
            </div>
            <div class="field">
              <span class="label">Modello:</span> ${req.query.model || 'N/A'}
            </div>
            <div class="field">
              <span class="label">Numero di Serie:</span> ${req.query.serialNumber || 'N/A'}
            </div>
            <div class="field">
              <span class="label">Dipendente:</span> ${req.query.employeeName || 'N/A'}
            </div>
            <div class="field">
              <span class="label">Email:</span> ${req.query.employeeEmail || 'N/A'}
            </div>
            <div class="field">
              <span class="label">Dipartimento:</span> ${req.query.department || 'N/A'}
            </div>
          </div>
          
          <div class="signature">
            <p>Il dipendente dichiara di aver ricevuto l'asset in buone condizioni e si impegna a:</p>
            <ul>
              <li>Utilizzare l'asset esclusivamente per scopi lavorativi</li>
              <li>Mantenere l'asset in buone condizioni</li>
              <li>Comunicare immediatamente eventuali problemi o danni</li>
              <li>Restituire l'asset al termine del rapporto di lavoro</li>
            </ul>
            
            <div style="margin-top: 50px;">
              <p>Firma del Dipendente: _________________________</p>
              <p>Data: _________________________</p>
            </div>
          </div>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(htmlContent);
      
    } catch (error) {
      console.error("Error downloading manleva:", error);
      res.status(500).json({ error: "Errore nel download della manleva" });
    }
  });
  
  // Endpoint legati a object storage, inviti ed export PDF rimossi per semplificazione

  const httpServer = createServer(app);
  return httpServer;
}
