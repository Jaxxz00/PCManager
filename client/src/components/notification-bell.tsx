import { useState, useEffect } from "react";
import { Bell, AlertTriangle, Wrench, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import type { PcWithEmployee } from "@shared/schema";

interface Notification {
  id: string;
  type: 'warranty' | 'maintenance' | 'assignment';
  title: string;
  message: string;
  pcId?: string;
  priority: 'high' | 'medium' | 'low';
  date: Date;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);

  // Carica notifiche dismissate dal localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dismissed-notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDismissedNotifications(parsed);
      } catch (error) {
        // Invalid JSON in localStorage, reset to empty array
        setDismissedNotifications([]);
      }
    }
  }, []);

  // Salva notifiche dismissate nel localStorage
  const saveDismissedNotifications = (newDismissed: string[]) => {
    setDismissedNotifications(newDismissed);
    localStorage.setItem('dismissed-notifications', JSON.stringify(newDismissed));
  };

  const { data: pcs = [] } = useQuery<PcWithEmployee[]>({
    queryKey: ["/api/pcs"],
  });

  const generateNotifications = (): Notification[] => {
    const notifications: Notification[] = [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    pcs.forEach(pc => {
      // Notifiche garanzia in scadenza
      if (pc.warrantyExpiry) {
        const warrantyDate = new Date(pc.warrantyExpiry);
        if (warrantyDate <= thirtyDaysFromNow && warrantyDate > now) {
          const notificationId = `warranty-${pc.id}-${warrantyDate.toISOString().split('T')[0]}`;
          notifications.push({
            id: notificationId,
            type: 'warranty',
            title: 'Garanzia in Scadenza',
            message: `La garanzia del PC ${pc.pcId} scade il ${warrantyDate.toLocaleDateString('it-IT')}`,
            pcId: pc.pcId,
            priority: warrantyDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) ? 'high' : 'medium',
            date: warrantyDate
          });
        }
      }

      // Notifiche manutenzione
      if (pc.status === 'maintenance') {
        const notificationId = `maintenance-${pc.id}`;
        notifications.push({
          id: notificationId,
          type: 'maintenance',
          title: 'PC in Manutenzione',
          message: `Il PC ${pc.pcId} è attualmente in manutenzione`,
          pcId: pc.pcId,
          priority: 'medium',
          date: pc.updatedAt ? new Date(pc.updatedAt) : new Date()
        });
      }

      // Notifiche PC non assegnati (solo se il PC è stato creato da più di 1 giorno)
      if (!pc.employeeId && pc.createdAt) {
        const createdDate = new Date(pc.createdAt);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (createdDate < oneDayAgo) {
          const notificationId = `unassigned-${pc.id}`;
          notifications.push({
            id: notificationId,
            type: 'assignment',
            title: 'PC Non Assegnato',
            message: `Il PC ${pc.pcId} non è assegnato a nessun dipendente`,
            pcId: pc.pcId,
            priority: 'low',
            date: createdDate
          });
        }
      }
    });

    return notifications.filter(n => !dismissedNotifications.includes(n.id));
  };

  const notifications = generateNotifications();
  const notificationCount = notifications.length;

  const dismissNotification = (notificationId: string) => {
    const newDismissed = [...dismissedNotifications, notificationId];
    saveDismissedNotifications(newDismissed);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warranty': return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'maintenance': return <Wrench className="h-4 w-4 text-blue-500" />;
      case 'assignment': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-200 text-blue-800';
      default: return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={`h-5 w-5 ${notificationCount > 0 ? 'text-yellow-500' : ''}`} />
          {notificationCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-white border border-gray-200 shadow-xl" align="end" style={{ zIndex: 9999 }}>
        <Card className="border-0 shadow-none bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Notifiche
              {notificationCount > 0 && (
                <Badge variant="secondary">{notificationCount}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessuna notifica</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div className={`p-3 hover:bg-muted/50 transition-colors ${getPriorityColor(notification.priority)} border-l-4`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {getIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.date.toLocaleDateString('it-IT')}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-70 hover:opacity-100"
                          onClick={() => dismissNotification(notification.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {index < notifications.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
            {notifications.length > 0 && (
              <>
                <Separator />
                <div className="p-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => saveDismissedNotifications([...dismissedNotifications, ...notifications.map(n => n.id)])}
                  >
                    Segna Tutte Come Lette
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}