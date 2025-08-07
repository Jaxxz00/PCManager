import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Topbar() {
  const userName = "Mario Rossi";
  const userRole = "IT Administrator";
  const userInitials = "MR";

  return (
    <header className="bg-card shadow-sm border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium text-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Panoramica generale del sistema</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{userRole}</p>
            </div>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium">{userInitials}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
