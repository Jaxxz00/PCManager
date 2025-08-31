import { Search, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/App";
import { useLocation } from "wouter";
import NotificationBell from "@/components/notification-bell";
import { useGlobalSearch } from "@/contexts/GlobalSearchContext";

export default function Topbar() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { globalSearchTerm, setGlobalSearchTerm } = useGlobalSearch();

  const handleSearchClick = () => {
    // Disabilitato dropdown di ricerca
  };

  const handleSearchChange = (value: string) => {
    setGlobalSearchTerm(value);
    // Dropdown suggerimenti disabilitato
  };



  return (
    <>
      <header className="bg-background border-b border-border h-24 flex items-center justify-between px-8 shadow-sm">
        {/* Search Globale - ora apre dropdown */}
        <div className="flex-1 mr-4 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
            <Input
              placeholder="Ricerca globale: PC, dipendenti..."
              value={globalSearchTerm}
              onClick={handleSearchClick}
              onFocus={handleSearchClick}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-muted/30 border-0 focus:bg-background"
              data-testid="input-global-search"
            />
          </div>

        </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <NotificationBell />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-3">
              <div className="p-1 bg-blue-100 rounded-full">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium">{user?.username || 'Utente'}</p>
                <p className="text-xs text-muted-foreground">{user?.role || 'Admin'}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-gradient-to-br from-white via-blue-50 to-blue-100 border shadow-lg backdrop-blur-sm">
            <div className="px-3 py-2 border-b border-blue-200/30">
              <p className="font-medium text-slate-800">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-slate-600">{user?.email}</p>
            </div>
            <DropdownMenuItem 
              className="cursor-pointer hover:bg-blue-100/50 text-slate-800"
              onClick={() => setLocation("/profile")}
            >
              <User className="mr-2 h-4 w-4 text-blue-600" />
              Profilo
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer hover:bg-blue-100/50 text-slate-800"
              onClick={() => setLocation("/settings")}
            >
              <Settings className="mr-2 h-4 w-4 text-blue-600" />
              Impostazioni
            </DropdownMenuItem>
            <DropdownMenuSeparator className="border-blue-200/30" />
            <DropdownMenuItem 
              className="cursor-pointer text-red-600 hover:bg-red-50 focus:text-red-600"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  </>
  );
}