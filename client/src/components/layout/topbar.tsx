import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import NotificationBell from "@/components/notification-bell";

export default function Topbar() {
  const userName = "Mario Rossi";
  const userRole = "IT Administrator";
  const userInitials = "MR";
  const [location] = useLocation();

  const getPageInfo = () => {
    switch (location) {
      case "/":
        return { title: "Dashboard", subtitle: "Panoramica generale del sistema" };
      case "/inventory":
        return { title: "Inventario PC", subtitle: "Gestione computer aziendali" };
      case "/employees":
        return { title: "Dipendenti", subtitle: "Gestione personale aziendale" };
      case "/labels":
        return { title: "Etichette PC", subtitle: "Genera e stampa etichette di riconoscimento" };
      case "/reports":
        return { title: "Report e Analisi", subtitle: "Analisi dettagliate dell'inventario IT aziendale" };
      default:
        return { title: "PC Manager", subtitle: "Sistema di gestione IT aziendale" };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <header className="bg-card shadow-sm border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium text-foreground">{pageInfo.title}</h2>
          <p className="text-sm text-muted-foreground">{pageInfo.subtitle}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <NotificationBell />
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{userRole}</p>
            </div>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium">{userInitials}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
