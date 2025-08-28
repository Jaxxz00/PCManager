# PC Manager - Gestionale PC Aziendali per Maori Group

## Overview

Sistema di gestione completo per computer e dipendenti aziendali di Maori Group. L'applicazione fornisce una dashboard centralizzata per il monitoraggio dell'inventario PC, assegnazioni dipendenti, gestione documenti e statistiche del sistema. Include interfaccia React moderna, backend Node.js/Express e **database PostgreSQL completamente integrato** per persistenza dati con cloud storage per documenti.

## Recent Changes (28/08/2025)
- ✅ **DESIGN LOGIN COMPLETATO**: Layout ultra-minimale realizzato perfettamente
- ✅ **LOGO INTEGRATO**: Sfondo bianco rimosso con mix-blend-mode multiply, integrazione seamless  
- ✅ **LAYOUT SINGLE-PAGE**: Trasformato da split-screen a layout centrato con logo in alto
- ✅ **AUTENTICAZIONE FIXATA**: Risolto problema sessionId e redirect post-login
- ✅ **UI PULITA**: Rimossi tutti elementi decorativi, scudetti, ombre e effetti non necessari
- ✅ **PENETRATION TESTING COMPLETATO**: Sistema sottoposto a test di resistenza approfonditi
- ✅ **VULNERABILITÀ RISOLTE**: Rate limiting login, timing attack protection, endpoint hardening  
- ✅ **SICUREZZA ENTERPRISE**: Protezione multi-layer con autenticazione 2FA + Google Authenticator
- ✅ **RATE LIMITING AVANZATO**: Max 5 tentativi login per 15 minuti, API protection generale
- ✅ **TIMING ATTACK PROTECTION**: Delay costante 300ms, differenza ridotta da 442ms a 8ms
- ✅ **ENDPOINT PROTECTION**: Middleware authenticateRequest su tutti gli endpoint critici
- ✅ **SESSION SECURITY**: Bearer token validation, PostgreSQL persistent sessions
- ✅ **SQL INJECTION PREVENTION**: Zod schemas validation, Drizzle ORM prepared statements
- ✅ **WORKFLOW GUIDATO COMPLETO**: Processo guidato da selezione PC a consegna con manleva firmata (6 passaggi)
- ✅ **INTERFACCIA VISUAL RICCA**: Trasformazione da design minimal a interfaccia ricca con gradienti, icone colorate, animazioni
- ✅ **ETICHETTE OTTIMIZZATE**: Formato finale 5cm x 3cm con layout bilanciato e contenimento garantito
- ✅ **MIGRAZIONE POSTGRESQL COMPLETATA**: Sistema ora usa DatabaseStorage con PostgreSQL per persistenza completa
- ✅ **AUTO-INIZIALIZZAZIONE**: Dati test automaticamente creati al primo avvio
- ✅ **SICUREZZA RINFORZATA**: CSP configurato per sviluppo, autenticazione e rate limiting attivi
- ✅ **PERFORMANCE OTTIMIZZATE**: Query JOIN per dati correlati PC-Dipendenti
- ✅ **ETICHETTE PRIVACY-COMPLIANT**: Sistema stampa etichette senza dati personali, solo QR per lookup database
- ✅ **FRONTEND UX MIGLIORATO**: Check usabilità completato, errori TypeScript risolti, interfaccia professionalizzata
- ✅ **PAGINA MANUTENZIONE COMPLETA**: Centro manutenzione PC con gestione interventi, priorità, costi e tracking tecnici
- ✅ **DROPDOWN VISIBILITY RISOLTO**: Sostituiti componenti Radix UI Select con elementi HTML nativi per eliminare conflitti z-index nei dialog

## User Preferences

Preferred communication style: Simple, everyday language.
Language: Italian throughout the entire application interface
Company: Maori Group - integrated corporate branding with official logo
Logo: Uses official Maori Group logo image (IMG_4622_1755594689547.jpeg)
Professional Features: Document management for manleva/waivers, QR code labels
UI Design Preference: Rich visual interface with gradients and detailed elements (not minimal)
Color Scheme: Dark blue color scheme (blu scuro) - no purple/violet combinations

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **Request Logging**: Custom middleware for API request/response logging
- **Storage Layer**: Abstracted storage interface supporting both in-memory (development) and database implementations

### Data Storage Solutions
- **Database**: PostgreSQL with complete persistent storage (MIGRATED ✅)
- **ORM**: Drizzle ORM for type-safe database operations
- **Storage Layer**: DatabaseStorage class replacing in-memory MemStorage
- **Migrations**: Drizzle Kit for schema migrations and database management
- **Connection**: Neon Database serverless PostgreSQL connection with WebSocket support
- **Schema Validation**: Zod schemas generated from Drizzle tables for runtime validation
- **Auto-Initialization**: Test data automatically seeded on first application start

### Database Schema (PostgreSQL Tables)
- **users**: User accounts with 2FA support (twoFactorSecret, twoFactorEnabled, backupCodes)
- **sessions**: Secure session storage with automatic expiration
- **employees**: Employee information with UUID primary keys, unique email constraints
- **pcs**: Comprehensive PC inventory with foreign key references to employees
- **Relationships**: Enforced foreign key constraints with LEFT JOIN queries for PC-Employee data
- **Timestamps**: Automatic created_at/updated_at tracking with PostgreSQL functions

### Authentication and Authorization
- **Two-Factor Authentication (2FA)**: Complete Google Authenticator integration with QR code setup
- **Session Management**: Bearer token authentication with PostgreSQL session storage
- **Security Features**: Rate limiting, password hashing (bcrypt), secure session validation
- **Backup Codes**: 10-digit backup codes for account recovery
- **Multi-step Login**: Conditional 2FA verification in login flow

### Development and Deployment
- **Development**: Hot module replacement with Vite dev server
- **Database**: Auto-migration with `npm run db:push` and automatic test data seeding
- **Production Build**: Optimized static assets with Express static serving
- **Environment Management**: Environment-specific configurations with DATABASE_URL
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Security**: Production-ready with authentication, rate limiting, and security headers

### Key Design Patterns
- **Repository Pattern**: IStorage interface implemented by DatabaseStorage for PostgreSQL persistence
- **Database Relations**: Type-safe Drizzle ORM with automatic JOIN queries for related data
- **Form Validation**: Schema-first approach using Zod for both frontend and backend validation
- **Component Composition**: Modular UI components with consistent design system
- **Error Boundaries**: Graceful error handling in both frontend and backend with PostgreSQL error handling
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Security Architecture**: Multi-layer security with authentication, validation, and rate limiting

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless database connection
- **drizzle-orm**: Type-safe ORM with PostgreSQL support
- **drizzle-kit**: Database migration and schema management tools
- **express**: Node.js web framework for API server
- **react**: Frontend UI library with hooks and modern patterns
- **@tanstack/react-query**: Server state management and caching

### UI and Styling
- **@radix-ui**: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant management for components
- **lucide-react**: Modern icon library with consistent design

### Form and Validation
- **react-hook-form**: Performant forms with minimal re-renders
- **@hookform/resolvers**: Integration layer for validation libraries
- **zod**: TypeScript-first schema validation library
- **drizzle-zod**: Automatic Zod schema generation from Drizzle tables

### Development Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution engine for Node.js
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Replit-specific development enhancements

### Security and Authentication
- **speakeasy**: TOTP generation for Google Authenticator 2FA
- **qrcode**: QR code generation for 2FA setup
- **bcrypt**: Secure password hashing
- **express-rate-limit**: API rate limiting protection
- **helmet**: HTTP security headers

### Additional Utilities
- **date-fns**: Modern date manipulation library
- **clsx**: Conditional className utility
- **wouter**: Lightweight routing library for React
- **cmdk**: Command palette component for enhanced UX