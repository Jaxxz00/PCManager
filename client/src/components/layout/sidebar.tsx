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
    <aside className="w-80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-2xl flex-shrink-0 border-r border-slate-800/50 h-screen flex flex-col backdrop-blur-xl">
      {/* Professional Header */}
      <div className="p-8 border-b border-slate-800/50 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-indigo-900/30">
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
            <p className="text-sm text-slate-300 font-medium bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Sistema IT Aziendale</p>
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
                  "hover:bg-slate-800/80 hover:shadow-lg hover:scale-[1.02] hover:border-slate-700/30 hover:border transition-all duration-300",
                  active 
                    ? "bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-xl border border-blue-500/30" 
                    : "text-slate-300 hover:text-white"
                )}>
                  <div className="flex items-center gap-4">
                    <Icon className={cn(
                      "w-5 h-5",
                      active ? "text-white drop-shadow-sm" : "text-slate-400 group-hover:text-blue-300 transition-colors duration-300"
                    )} />
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className={cn(
                        "text-xs",
                        active ? "text-white/90 drop-shadow-sm" : "text-slate-400 group-hover:text-slate-200 transition-colors duration-300"
                      )}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30">
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-all duration-300",
                      active ? "text-white transform rotate-90 drop-shadow-sm" : "text-slate-400 group-hover:text-blue-300 group-hover:rotate-90"
                    )} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Settings Section */}
        <div className="pt-6 mt-6 border-t border-slate-800/50">
          <h3 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Configurazione
          </h3>
          <div className="space-y-1">
            {settings.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              
              return (
                <Link key={item.name} href={item.href}>
                  <div className={cn(
                    "group flex items-center justify-between p-4 rounded-xl text-sm font-medium transition-all duration-300",
                    "hover:bg-slate-800/80 hover:shadow-lg hover:scale-[1.02] hover:border-slate-700/30 hover:border",
                    active 
                      ? "bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-xl border border-blue-500/30" 
                      : "text-slate-300 hover:text-white"
                  )}>
                    <div className="flex items-center gap-4">
                      <Icon className={cn(
                        "w-5 h-5",
                        active ? "text-white drop-shadow-sm" : "text-slate-400 group-hover:text-blue-300 transition-colors duration-300"
                      )} />
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className={cn(
                          "text-xs",
                          active ? "text-white/90 drop-shadow-sm" : "text-slate-400 group-hover:text-slate-200 transition-colors duration-300"
                        )}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-all duration-300",
                      active ? "text-white transform rotate-90 drop-shadow-sm" : "text-slate-400 group-hover:text-blue-300 group-hover:rotate-90"
                    )} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-slate-800/50 bg-gradient-to-br from-slate-900/50 via-blue-950/20 to-purple-950/20">
        <div className="text-center">
          <p className="text-xs text-slate-300 font-medium">
            PC Manager v1.0
          </p>
          <p className="text-xs text-slate-400 mt-1 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Sistema professionale IT
          </p>
        </div>
      </div>
    </aside>
  );
}