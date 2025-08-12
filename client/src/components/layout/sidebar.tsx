import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Monitor, 
  Users, 
  Wrench, 
  FileText, 
  Settings,
  Tags,
  Building2,
  ChevronRight,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3, description: "Panoramica generale" },
  { name: "Inventario PC", href: "/inventory", icon: Monitor, description: "Gestione computer" },
  { name: "Dipendenti", href: "/employees", icon: Users, description: "Personale aziendale" },
  { name: "Documenti", href: "/documents", icon: Shield, description: "Manleva e contratti" },
  { name: "Etichette", href: "/labels", icon: Tags, description: "Stampa etichette" },
  { name: "Report", href: "/reports", icon: FileText, description: "Analisi e statistiche" },
  { name: "Manutenzione", href: "/maintenance", icon: Wrench, description: "Prossimamente", badge: "Presto" },
];

const settings = [
  { name: "Configurazione", href: "/settings", icon: Settings, description: "Impostazioni sistema" },
];

export default function Sidebar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    return location === href || (href !== "/" && location.startsWith(href));
  };

  return (
    <aside className="w-80 bg-card shadow-xl flex-shrink-0 border-r border-border/50 h-screen flex flex-col">
      {/* Professional Header */}
      <div className="p-8 border-b border-border/50 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-bold">M</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">MAORI GROUP</h1>
            <p className="text-sm text-muted-foreground font-medium">Sistema IT Aziendale</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "group flex items-center justify-between p-4 rounded-xl text-sm font-medium transition-all duration-200",
                  "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
                  active 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-foreground/80 hover:text-foreground"
                )}>
                  <div className="flex items-center gap-4">
                    <Icon className={cn(
                      "w-5 h-5",
                      active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className={cn(
                        "text-xs",
                        active ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      active ? "text-primary-foreground transform rotate-90" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Settings Section */}
        <div className="pt-6 mt-6 border-t border-border/50">
          <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Configurazione
          </h3>
          <div className="space-y-1">
            {settings.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              
              return (
                <Link key={item.name} href={item.href}>
                  <div className={cn(
                    "group flex items-center justify-between p-4 rounded-xl text-sm font-medium transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
                    active 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "text-foreground/80 hover:text-foreground"
                  )}>
                    <div className="flex items-center gap-4">
                      <Icon className={cn(
                        "w-5 h-5",
                        active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className={cn(
                          "text-xs",
                          active ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      active ? "text-primary-foreground transform rotate-90" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-border/50 bg-muted/30">
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-medium">
            PC Manager v1.0
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Sistema professionale IT
          </p>
        </div>
      </div>
    </aside>
  );
}