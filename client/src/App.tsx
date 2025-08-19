import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
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
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/employees" component={Employees} />
      <Route path="/labels" component={Labels} />
      <Route path="/reports" component={Reports} />
      <Route path="/documents" component={Documents} />
      <Route path="/maintenance" component={Maintenance} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50/30 to-green-50/20">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Topbar />
            <main className="flex-1 overflow-auto p-8 bg-transparent">
              <div className="max-w-7xl mx-auto">
                <Router />
              </div>
            </main>
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
