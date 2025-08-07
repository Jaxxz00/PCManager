import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Monitor, 
  Users, 
  Wrench, 
  FileText, 
  Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Inventario PC", href: "/inventory", icon: Monitor },
  { name: "Dipendenti", href: "/employees", icon: Users },
  { name: "Manutenzione", href: "/maintenance", icon: Wrench },
  { name: "Report", href: "/reports", icon: FileText },
];

const settings = [
  { name: "Configurazione", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    return location === href || (href !== "/" && location.startsWith(href));
  };

  return (
    <aside className="w-64 bg-sidebar shadow-lg flex-shrink-0 border-r border-sidebar-border">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Monitor className="text-primary-foreground text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-medium text-sidebar-foreground">PC Manager</h1>
            <p className="text-sm text-sidebar-foreground/70">Gestionale Aziendale</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        <div className="px-6 py-2">
          <p className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">
            Menu Principale
          </p>
        </div>
        
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                "sidebar-nav-item",
                isActive(item.href) && "active"
              )}>
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </div>
            </Link>
          );
        })}
        
        <div className="px-6 py-2 mt-6">
          <p className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">
            Impostazioni
          </p>
        </div>
        
        {settings.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                "sidebar-nav-item",
                isActive(item.href) && "active"
              )}>
                <Icon className="w-5 h-5 mr-3" />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
