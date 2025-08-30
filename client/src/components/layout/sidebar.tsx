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
    <aside className="w-72 bg-gradient-to-b from-card to-card/50 border-r border-border/30 h-screen flex flex-col shadow-lg">
      {/* Header con Logo */}
      <div className="p-6 border-b border-border/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center p-1">
            <img 
              src="/src/assets/IMG_4622_1755594689547.jpeg" 
              alt="Maori Group Logo" 
              className="h-full w-full object-contain rounded-lg"
              style={{ mixBlendMode: 'multiply' }}
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">MAORI GROUP</h1>
            <p className="text-sm text-muted-foreground font-medium">PC Management System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-5 space-y-2">
        <div className="space-y-2">
          {navigation.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "group flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  "hover:shadow-sm hover:scale-105 transform",
                  active 
                    ? "bg-primary text-primary-foreground shadow-lg border border-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/80 hover:border hover:border-border/50"
                )}>
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    active 
                      ? "bg-white/20" 
                      : "bg-muted group-hover:bg-primary/10"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold">{item.name}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Settings Section */}
        <div className="pt-6 mt-6 border-t border-border/30">
          <h3 className="px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Sistema
          </h3>
          {settings.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "group flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  "hover:shadow-sm hover:scale-105 transform",
                  active 
                    ? "bg-primary text-primary-foreground shadow-lg border border-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/80 hover:border hover:border-border/50"
                )}>
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    active 
                      ? "bg-white/20" 
                      : "bg-muted group-hover:bg-primary/10"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold">{item.name}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}