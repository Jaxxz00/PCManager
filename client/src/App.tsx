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

export const useAuth = () => useContext(AuthContext);

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
        // Redirigi al login se non autenticato
        <Route component={() => { window.location.href = '/login'; return null; }} />
      )}
      </Switch>
    </Suspense>
  );
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
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
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </GlobalSearchProvider>
    </QueryClientProvider>
  );
}

export default App;
