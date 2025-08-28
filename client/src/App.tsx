import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Employees from "@/pages/employees";
import Labels from "@/pages/labels";
import Reports from "@/pages/reports";
import Documents from "@/pages/documents";
import Settings from "@/pages/settings";
import Maintenance from "@/pages/maintenance";
import Workflow from "@/pages/workflow";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { createContext, useContext, useEffect, useState } from "react";

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
    localStorage.getItem('sessionId')
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
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('sessionId');
      setSessionId(null);
      window.location.href = '/login';
    }
  };

  // Gestisco i cambiamenti del sessionId nel localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const newSessionId = localStorage.getItem('sessionId');
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
    <Switch>
      {/* Route pubbliche */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      
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
                <Inventory />
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
          <Route path="/labels">
            {() => (
              <AuthenticatedLayout>
                <Labels />
              </AuthenticatedLayout>
            )}
          </Route>
          <Route path="/reports">
            {() => (
              <AuthenticatedLayout>
                <Reports />
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
          <Route path="/workflow">
            {() => (
              <AuthenticatedLayout>
                <Workflow />
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
  );
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-8 bg-muted/10">
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
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
