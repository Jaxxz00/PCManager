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
  { name: "Assegnazione PC", href: "/workflow", icon: GitBranch },
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
    <aside className="w-64 bg-gray-50 border-r border-gray-200 h-screen flex flex-col">
      {/* Header Semplice */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <img 
              src="/src/assets/IMG_4622_1755594689547.jpeg" 
              alt="Maori Group Logo" 
              className="h-8 w-8 object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">PC Manager</h1>
            <p className="text-xs text-gray-500">Maori Group</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    active 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}>
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Settings */}
        <div className="mt-6 pt-3 border-t border-gray-200">
          <ul className="space-y-1">
            {settings.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <div className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      active 
                        ? "bg-blue-600 text-white" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}>
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </aside>
  );
}