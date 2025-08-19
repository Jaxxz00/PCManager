# PC Manager - Gestionale PC Aziendali per Maori Group

## Overview

Sistema di gestione completo per computer e dipendenti aziendali di Maori Group. L'applicazione fornisce una dashboard centralizzata per il monitoraggio dell'inventario PC, assegnazioni dipendenti, gestione documenti e statistiche del sistema. Include interfaccia React moderna, backend Node.js/Express e database PostgreSQL con cloud storage per documenti.

## User Preferences

Preferred communication style: Simple, everyday language.
Language: Italian throughout the entire application interface
Company: Maori Group - integrated corporate branding with official logo
Logo: Uses official Maori Group logo image (IMG_4622_1755594689547.jpeg)
Professional Features: Document management for manleva/waivers, QR code labels

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
- **Database**: PostgreSQL as the primary database
- **ORM**: Drizzle ORM for type-safe database operations
- **Migrations**: Drizzle Kit for schema migrations and database management
- **Connection**: Neon Database serverless PostgreSQL connection
- **Schema Validation**: Zod schemas generated from Drizzle tables for runtime validation

### Database Schema
- **Employees Table**: Stores employee information (name, email, department, position)
- **PCs Table**: Comprehensive PC inventory with specifications, assignments, warranty tracking, and status management
- **Relationships**: Foreign key relationship linking PCs to employees for assignment tracking

### Authentication and Authorization
- Currently implemented with basic session-based approach
- Uses connect-pg-simple for PostgreSQL session storage
- Ready for expansion to more sophisticated auth mechanisms

### Development and Deployment
- **Development**: Hot module replacement with Vite dev server
- **Production Build**: Optimized static assets with Express static serving
- **Environment Management**: Environment-specific configurations
- **Code Quality**: TypeScript strict mode with comprehensive type checking

### Key Design Patterns
- **Repository Pattern**: Storage abstraction layer for easy testing and database switching
- **Form Validation**: Schema-first approach using Zod for both frontend and backend validation
- **Component Composition**: Modular UI components with consistent design system
- **Error Boundaries**: Graceful error handling in both frontend and backend
- **Responsive Design**: Mobile-first approach with adaptive layouts

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

### Additional Utilities
- **date-fns**: Modern date manipulation library
- **clsx**: Conditional className utility
- **wouter**: Lightweight routing library for React
- **cmdk**: Command palette component for enhanced UX