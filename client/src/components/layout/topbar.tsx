import { Bell, Search, User } from "lucide-react";
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

export default function Topbar() {
  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/50 h-16 flex items-center justify-between px-8 shadow-xl">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Cerca PC, dipendente..."
            className="pl-10 bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-400 focus:bg-slate-800 focus:border-blue-500/50 transition-all duration-300"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-300">
              <Bell className="h-5 w-5" />
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white border-0"
              >
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-3 py-2 border-b">
              <p className="font-semibold">Notifiche (3)</p>
            </div>
            <DropdownMenuItem className="px-3 py-3 cursor-pointer">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Garanzia in Scadenza</p>
                <p className="text-xs text-muted-foreground">PC-001 scade tra 15 giorni</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="px-3 py-3 cursor-pointer">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Nuovo PC Aggiunto</p>
                <p className="text-xs text-muted-foreground">PC-003 registrato da Admin</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="px-3 py-3 cursor-pointer">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Backup Completato</p>
                <p className="text-xs text-muted-foreground">Database salvato correttamente</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="px-3 py-2 text-center text-primary cursor-pointer">
              Vedi tutte le notifiche
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 px-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium">Admin</p>
                <p className="text-xs text-muted-foreground">Sistema IT</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              Profilo
            </DropdownMenuItem>
            <DropdownMenuItem>
              Impostazioni
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Disconnetti
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}