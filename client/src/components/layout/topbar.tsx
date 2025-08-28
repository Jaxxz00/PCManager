import { Bell, Search, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/App";

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-background border-b border-border h-16 flex items-center justify-between px-8 shadow-sm">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cerca PC, dipendente..."
            className="pl-10 bg-muted/30 border-0 focus:bg-background"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-gradient-to-br from-white via-blue-50 to-blue-100 border shadow-lg backdrop-blur-sm">
            <div className="px-3 py-2 border-b border-blue-200/30">
              <p className="font-semibold text-slate-800">Notifiche (3)</p>
            </div>
            <DropdownMenuItem className="px-3 py-3 cursor-pointer hover:bg-blue-100/50">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-slate-800">Garanzia in Scadenza</p>
                <p className="text-xs text-slate-600">PC-001 scade tra 15 giorni</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="px-3 py-3 cursor-pointer hover:bg-blue-100/50">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-slate-800">Nuovo PC Aggiunto</p>
                <p className="text-xs text-slate-600">PC-003 registrato da Admin</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="px-3 py-3 cursor-pointer hover:bg-blue-100/50">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-slate-800">Backup Completato</p>
                <p className="text-xs text-slate-600">Database salvato correttamente</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="border-blue-200/30" />
            <DropdownMenuItem className="px-3 py-2 text-center text-blue-600 hover:bg-blue-100/50 cursor-pointer font-medium">
              Vedi tutte le notifiche
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
            <DropdownMenuItem className="cursor-pointer hover:bg-blue-100/50 text-slate-800">
              <User className="mr-2 h-4 w-4 text-blue-600" />
              Profilo
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-blue-100/50 text-slate-800">
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
  );
}