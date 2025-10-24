import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";

// Lazy load delle pagine per ottimizzare bundle size
const NotFound = lazy(() => import("@/pages/not-found"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Employees = lazy(() => import("@/pages/employees"));
const Documents = lazy(() => import("@/pages/documents"));
const Settings = lazy(() => import("@/pages/settings"));
const Profile = lazy(() => import("@/pages/profile"));
const Maintenance = lazy(() => import("@/pages/maintenance"));
const Workflow = lazy(() => import("@/pages/workflow"));
const Assets = lazy(() => import("@/pages/assets"));
const AssignedDevices = lazy(() => import("@/pages/assigned-devices"));
const Labels = lazy(() => import("@/pages/labels"));
const ReturnWorkflow = lazy(() => import("@/pages/return-workflow"));

import LoginPage from "@/pages/login";
import SetPasswordPage from "@/pages/set-password";
// RegisterPage rimossa - registrazione disabilitata per sicurezza
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { createContext, useContext, useEffect, useState } from "react";
import { GlobalSearchProvider } from "@/contexts/GlobalSearchContext";

// Context per l'autenticazione
const AuthContext = createContext<{
  user: any | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}>({
  user: null,
  sessionId: null,
  isAuthenticated: false,
  isLoading: true,
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// Componente per proteggere le route solo per admin
function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Accesso Negato</h1>
          <p className="text-muted-foreground">
            Questa sezione è riservata agli amministratori.
          </p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(
    localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId')
  );

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      if (!sessionId) return null;

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${sessionId}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Sessione scaduta o non valida
          localStorage.removeItem('sessionId');
          sessionStorage.removeItem('sessionId');
          setSessionId(null);
          return null;
        }
        throw new Error('Failed to fetch user');
      }

      return response.json();
    },
    retry: false,
    enabled: !!sessionId,
  });

  // Prefetch delle query comuni quando l'utente è autenticato
  useEffect(() => {
    if (user && sessionId) {
      import('@/lib/queryClient').then(({ prefetchCommonQueries }) => {
        prefetchCommonQueries();
      });
    }
  }, [user, sessionId]);

  const logout = async () => {
    try {
      if (sessionId) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionId}`,
          },
        });
      }
    } catch (error) {
      // Silent logout on error
    } finally {
      localStorage.removeItem('sessionId');
      sessionStorage.removeItem('sessionId');
      localStorage.removeItem('rememberLogin');
      setSessionId(null);
      window.location.href = '/login';
    }
  };

  // Gestisco i cambiamenti del sessionId nel localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const newSessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId');
      if (newSessionId !== sessionId) {
        setSessionId(newSessionId);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [sessionId]);

  const value = {
    user,
    sessionId,
    isAuthenticated: !!user && !!sessionId,
    isLoading: isLoading && !!sessionId,
    logout,
  };



  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();


  // Mostra loader durante il controllo autenticazione
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    }>
      <Switch>
      {/* Route pubbliche */}
      <Route path="/login" component={LoginPage} />
      <Route path="/invite/:token" component={SetPasswordPage} />
      
      {/* Route protette */}
      {isAuthenticated ? (
        <>
          <Route path="/">
            {() => (
              <AuthenticatedLayout>
                <Dashboard />
              </AuthenticatedLayout>
            )}
          </Route>
          <Route path="/inventory">
            {() => (
              <AuthenticatedLayout>
                <Assets />
              </AuthenticatedLayout>
            )}
          </Route>
          
          <Route path="/employees">
            {() => (
              <AuthenticatedLayout>
                <Employees />
              </AuthenticatedLayout>
            )}
          </Route>
          <Route path="/documents">
            {() => (
              <AuthenticatedLayout>
                <Documents />
              </AuthenticatedLayout>
            )}
          </Route>
          <Route path="/maintenance">
            {() => (
              <AuthenticatedLayout>
                <Maintenance />
              </AuthenticatedLayout>
            )}
          </Route>
          <Route path="/assets">
            {() => (
              <AuthenticatedLayout>
                <Assets />
              </AuthenticatedLayout>
            )}
          </Route>
          <Route path="/workflow">
            {() => (
              <AuthenticatedLayout>
                <Workflow />
              </AuthenticatedLayout>
            )}
          </Route>
          <Route path="/return-workflow">
            {() => (
              <AuthenticatedLayout>
                <ReturnWorkflow />
              </AuthenticatedLayout>
            )}
          </Route>
          <Route path="/assigned-devices">
            {() => (
              <AuthenticatedLayout>
                <AssignedDevices />
              </AuthenticatedLayout>
            )}
          </Route>
          <Route path="/labels">
            {() => (
              <AuthenticatedLayout>
                <Labels />
              </AuthenticatedLayout>
            )}
          </Route>

          <Route path="/settings">
            {() => (
              <AuthenticatedLayout>
                <Settings />
              </AuthenticatedLayout>
            )}
          </Route>
          <Route path="/profile">
            {() => (
              <AuthenticatedLayout>
                <Profile />
              </AuthenticatedLayout>
            )}
          </Route>
          <Route>
            {() => (
              <AuthenticatedLayout>
                <NotFound />
              </AuthenticatedLayout>
            )}
          </Route>
        </>
      ) : (
        // Mostra la pagina di login se non autenticato
        <Route path="*" component={LoginPage} />
      )}
      </Switch>
    </Suspense>
  );
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar separata */}
      <div className="flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Separatore visivo */}
      <div className="w-px bg-gray-300 flex-shrink-0"></div>
      
      {/* Contenuto principale con margine ridotto */}
      <div className="flex-1 flex flex-col overflow-hidden ml-1">
        {/* Topbar separata */}
        <div className="bg-white border-b border-gray-200 shadow-sm mt-2">
          <Topbar />
        </div>
        <main className="flex-1 overflow-auto p-8 bg-background">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalSearchProvider>
        <AuthProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <Router />
            </ErrorBoundary>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </GlobalSearchProvider>
    </QueryClientProvider>
  );
}

// Error Boundary per catturare errori di rendering
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Errore di Rendering</h1>
            <p className="text-red-800 mb-4">Si è verificato un errore nell'applicazione.</p>
            <pre className="text-sm text-red-600 bg-red-100 p-4 rounded overflow-auto">
              {this.state.error?.stack}
            </pre>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Ricarica Pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default App;
