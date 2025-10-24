import { Link, useLocation } from "wouter";
import { useState } from "react";
import { 
  BarChart3, 
  Monitor, 
  Users, 
  Wrench, 
  Settings,
  Shield,
  GitBranch,
  RotateCcw,
  Package,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";


const settings = [
  { name: "Impostazioni", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [isAssetManagementOpen, setIsAssetManagementOpen] = useState(
    location === "/workflow" || location === "/return-workflow"
  );

  const isActive = (href: string) => {
    return location === href || (href !== "/" && location.startsWith(href));
  };

  // Navigation statica
  const navigation = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Inventario Asset", href: "/inventory", icon: Monitor },
    { name: "Collaboratori", href: "/employees", icon: Users },
    { 
      name: "Gestione Asset", 
      icon: Package, 
      hasSubmenu: true,
      submenu: [
        { name: "Assegnazione", href: "/workflow", icon: GitBranch },
        { name: "Riconsegna", href: "/return-workflow", icon: RotateCcw },
      ]
    },
    { name: "Documenti", href: "/documents", icon: Shield },
    { name: "Manutenzione", href: "/maintenance", icon: Wrench },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col shadow-lg">
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
            <h1 className="font-semibold text-gray-900 text-[19px]">Asset Manager</h1>
            <p className="text-xs text-gray-500">Maori Group</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const active = item.href ? isActive(item.href) : false;
            const Icon = item.icon;
            
            // Se ha sottomenu
            if (item.hasSubmenu) {
              return (
                <li key={item.name}>
                  <div>
                    <div 
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsAssetManagementOpen(!isAssetManagementOpen)}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{item.name}</span>
                      {isAssetManagementOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                    
                    {isAssetManagementOpen && (
                      <ul className="ml-4 mt-1 space-y-1">
                        {item.submenu?.map((subItem) => {
                          const subActive = isActive(subItem.href);
                          const SubIcon = subItem.icon;
                          
                          return (
                            <li key={subItem.name}>
                              <Link href={subItem.href}>
                                <div className={cn(
                                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                                  subActive 
                                    ? "bg-blue-600 text-white" 
                                    : "text-gray-600 hover:bg-gray-50"
                                )}>
                                  <SubIcon className="h-4 w-4" />
                                  <span>{subItem.name}</span>
                                </div>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </li>
              );
            }
            
            // Menu normale
            return (
              <li key={item.name}>
                {item.href ? (
                  <Link href={item.href}>
                    <div className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                      active 
                        ? "bg-blue-600 text-white" 
                        : "text-gray-700"
                    )}>
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                ) : (
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                    active 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-700"
                  )}>
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                )}
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
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                      active 
                        ? "bg-blue-600 text-white" 
                        : "text-gray-700"
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