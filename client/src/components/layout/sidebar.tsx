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
  { name: "Manutenzione", href: "/maintenance", icon: Wrench, description: "Gestione interventi" },
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
    <aside className="w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-xl flex-shrink-0 border-r border-slate-700/50 h-screen flex flex-col">
      {/* Professional Header */}
      <div className="p-8 border-b border-slate-700/50 bg-gradient-to-br from-blue-600/20 to-indigo-600/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg p-1">
            <img 
              src="/assets/maori-logo.jpeg" 
              alt="Maori Group Logo" 
              className="h-full w-full object-contain rounded-xl"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">MAORI GROUP</h1>
            <p className="text-sm text-slate-300 font-medium">Sistema IT Aziendale</p>
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
                  "hover:bg-slate-700/50 hover:shadow-sm",
                  active 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg" 
                    : "text-slate-300 hover:text-white"
                )}>
                  <div className="flex items-center gap-4">
                    <Icon className={cn(
                      "w-5 h-5",
                      active ? "text-white" : "text-slate-400 group-hover:text-white"
                    )} />
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className={cn(
                        "text-xs",
                        active ? "text-white/80" : "text-slate-400"
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
                      active ? "text-white transform rotate-90" : "text-slate-400 group-hover:text-white"
                    )} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Settings Section */}
        <div className="pt-6 mt-6 border-t border-slate-700/50">
          <h3 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
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
                    "hover:bg-slate-700/50 hover:shadow-sm",
                    active 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg" 
                      : "text-slate-300 hover:text-white"
                  )}>
                    <div className="flex items-center gap-4">
                      <Icon className={cn(
                        "w-5 h-5",
                        active ? "text-white" : "text-slate-400 group-hover:text-white"
                      )} />
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className={cn(
                          "text-xs",
                          active ? "text-white/80" : "text-slate-400"
                        )}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      active ? "text-white transform rotate-90" : "text-slate-400 group-hover:text-white"
                    )} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-slate-700/50 bg-slate-800/50">
        <div className="text-center">
          <p className="text-xs text-slate-300 font-medium">
            PC Manager v1.0
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Sistema professionale IT
          </p>
        </div>
      </div>
    </aside>
  );
}