import { type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";

// Rate limiting ottimizzato
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // Max 100 richieste per IP ogni 15 minuti
  message: { error: "Troppe richieste. Riprova più tardi." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting per health checks
    return req.path === '/api/health';
  }
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // Max 5 tentativi di login per IP ogni 15 minuti
  message: { error: "Troppi tentativi di accesso. Riprova tra 15 minuti." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Non conta i login riusciti
});

// Rate limiter condizionale per sviluppo
export const maybeLoginLimiter = process.env.NODE_ENV === 'development'
  ? (_req: Request, _res: Response, next: NextFunction) => next()
  : loginLimiter;

// Middleware di autenticazione ottimizzato
export const createAuthenticateRequest = (storage: any) => 
  async (req: Request, res: Response, next: NextFunction) => {
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

// Middleware per validazione input ottimizzato
export const validateInput = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.body);
      req.body = result; // Sostituisce con i dati validati
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          error: "Dati di input non validi",
          details: errorMessages
        });
      }
      
      res.status(400).json({ error: "Errore di validazione" });
    }
  };
};

// Middleware per filtrare metodi HTTP
export const methodFilter = (allowedMethods: string[]) => {
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

// Middleware per validazione Content-Type
export const strictContentType = (req: Request, res: Response, next: NextFunction) => {
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

// Middleware per sanitizzazione utente
export const sanitizeUser = (u: any) => {
  if (!u) return u;
  const sanitized = { ...u };
  delete sanitized.passwordHash;
  delete sanitized.twoFactorSecret;
  delete sanitized.backupCodes;
  return sanitized;
};

// Middleware per logging delle richieste
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
    
    console.log(`${statusColor} ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });
  
  next();
};
