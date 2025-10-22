import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import logger from "./logger";

const app = express();

// Trust proxy per corretto funzionamento dietro reverse proxy
app.set('trust proxy', 1);

// Sicurezza: Limite dimensione payload per prevenire DoS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Headers di sicurezza aggiuntivi
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      logger.info(`${req.method} ${path} ${res.statusCode}`, {
        duration: `${duration}ms`,
        response: capturedJsonResponse ? JSON.stringify(capturedJsonResponse).slice(0, 200) : undefined
      });
    }
  });

  next();
});

(async () => {
  // Always use JsonStorage for development
  const { JsonStorage } = await import("./jsonStorage");
  const storage = new JsonStorage();
  
  // Initialize with test data on first run - DISABLED
  // if (storage.initializeWithTestData) {
  //   await storage.initializeWithTestData();
  // }
  
  const server = await registerRoutes(app, storage);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log dell'errore per debugging
    logger.error(`${status}: ${message}`, {
      stack: err.stack,
      path: _req.path,
      method: _req.method
    });

    // Risposta al client
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Windows compatibility: use localhost instead of 0.0.0.0 and remove reusePort
  const isWindows = process.platform === 'win32';
  const host = isWindows ? 'localhost' : '0.0.0.0';
  
  if (isWindows) {
    server.listen(port, host, () => {
      logger.info(`Server started`, { url: `http://${host}:${port}` });
    });
  } else {
    server.listen({
      port,
      host,
      reusePort: true,
    }, () => {
      logger.info(`Server started`, { port, host });
    });
  }
})();
