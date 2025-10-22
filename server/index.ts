import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from "express";
import helmet from "helmet";
import fs from "fs";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Trust proxy per corretto funzionamento dietro reverse proxy
app.set('trust proxy', 1);

// Sicurezza avanzata con Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Limite dimensione payload ottimizzato
app.use(express.json({ 
  limit: process.env.NODE_ENV === 'production' ? '1mb' : '10mb',
  verify: (req, res, buf) => {
    // Verifica integrità JSON
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      throw new Error('Invalid JSON payload');
    }
  }
}));
app.use(express.urlencoded({ 
  extended: false, 
  limit: process.env.NODE_ENV === 'production' ? '1mb' : '10mb' 
}));

// Middleware di logging ottimizzato
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  // Solo per API routes
  if (!path.startsWith("/api")) {
    return next();
  }

  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  const originalResJson = res.json;
  
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
    
    let logLine = `${statusColor} ${req.method} ${path} ${res.statusCode} in ${duration}ms`;
    
    if (capturedJsonResponse && process.env.NODE_ENV === 'development') {
      const responseStr = JSON.stringify(capturedJsonResponse);
      if (responseStr.length > 100) {
        logLine += ` :: ${responseStr.slice(0, 97)}...`;
      } else {
        logLine += ` :: ${responseStr}`;
      }
    }

    log(logLine);
  });

  next();
});

(async () => {
  // Inizializzazione storage ottimizzata
  let storage;
  
  try {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
      console.log("Using database storage with MariaDB");
      const { DatabaseStorage } = await import("./databaseStorage");
      storage = new DatabaseStorage();
      
      // Test connessione database
      await (storage as any).getDb();
      console.log("Database connection established");
    } else {
      console.log("Using in-memory storage for development");
      // Fallback per sviluppo senza database
      storage = {
        getAllUsers: async () => [],
        createUser: async (user: any) => user,
        validateSession: async () => null,
        getUser: async () => null,
        updateUser: async () => null,
        deleteUser: async () => null,
        createSession: async () => null,
        deleteSession: async () => null,
        getEmployees: async () => [],
        getEmployee: async () => null,
        createEmployee: async (emp: any) => emp,
        updateEmployee: async () => null,
        deleteEmployee: async () => null,
        getPcs: async () => [],
        getPc: async () => null,
        createPc: async (pc: any) => pc,
        updatePc: async () => null,
        deletePc: async () => null,
        getAssets: async () => [],
        getAsset: async () => null,
        createAsset: async (asset: any) => asset,
        updateAsset: async () => null,
        deleteAsset: async () => null,
        getAllAssetsIncludingPCs: async () => [],
        getMaintenanceRecords: async () => [],
        createMaintenanceRecord: async (record: any) => record,
        updateMaintenanceRecord: async () => null,
        deleteMaintenanceRecord: async () => null,
      };
    }
  } catch (error) {
    console.error("Failed to initialize storage:", error);
    process.exit(1);
  }
  
  // Bootstrap admin solo in sviluppo
  if (process.env.NODE_ENV === 'development' && typeof (storage as any).getAllUsers === 'function') {
    try {
      const users = await (storage as any).getAllUsers();
      if (!users || users.length === 0) {
        if (typeof (storage as any).createUser === 'function') {
          await (storage as any).createUser({
            username: "admin",
            email: "admin@maorigroup.com",
            firstName: "Amministratore",
            lastName: "Sistema",
            role: "admin",
            isActive: true,
            password: "admin123",
          });
          log("✅ Created default admin user admin@maorigroup.com / admin123");
        }
      }
    } catch (e) {
      console.warn("⚠️ Could not bootstrap default admin:", e);
    }
  }
  
  // Registrazione routes
  const server = await registerRoutes(app, storage);

  // Error handler ottimizzato
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? "Internal Server Error" 
      : err.message || "Internal Server Error";

    // Log error solo in sviluppo
    if (process.env.NODE_ENV === 'development') {
      console.error('Server Error:', err);
    }

    // Log dell'errore per debugging
    console.error(`[ERROR] ${status}: ${message}`, {
      stack: err.stack,
      path: _req.path,
      method: _req.method
    });

    // Risposta al client
    res.status(status).json({ message });
  });

  // Setup Vite solo in sviluppo
  if (process.env.NODE_ENV === 'development') {
    await setupVite(app, server);
  } else {
    // Solo in produzione usa serveStatic
    const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
    if (fs.existsSync(distPath)) {
      serveStatic(app);
    } else {
      console.log("⚠️ Build directory not found, running in development mode");
      await setupVite(app, server);
    }
  }

  // Configurazione porta ottimizzata
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = '0.0.0.0'; // Ascolta su tutte le interfacce
  
  // Avvio server con gestione errori
  try {
    server.listen(port, host, () => {
      log(`🚀 Server running on http://localhost:${port}`);
      log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();
