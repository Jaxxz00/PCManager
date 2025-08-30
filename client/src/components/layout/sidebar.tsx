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
  Shield,
  GitBranch
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Inventario PC", href: "/inventory", icon: Monitor },
  { name: "Dipendenti", href: "/employees", icon: Users },
  { name: "Workflow", href: "/workflow", icon: GitBranch },
  { name: "Documenti", href: "/documents", icon: Shield },
  { name: "Etichette", href: "/labels", icon: Tags },
  { name: "Report", href: "/reports", icon: FileText },
  { name: "Manutenzione", href: "/maintenance", icon: Wrench },
];

const settings = [
  { name: "Impostazioni", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    return location === href || (href !== "/" && location.startsWith(href));
  };

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">PC Manager</h1>
            <p className="text-xs text-muted-foreground">Maori Group</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}>
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Settings Section */}
        <div className="pt-4 mt-4 border-t border-border">
          {settings.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}>
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}