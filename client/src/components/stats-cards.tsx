import { useQuery } from "@tanstack/react-query";
import { Monitor, CheckCircle, Wrench, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardStats {
  totalPCs: number;
  activePCs: number;
  maintenancePCs: number;
  retiredPCs: number;
  expiringWarranties: number;
}

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="stats-card">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Totale PC",
      value: stats?.totalPCs || 0,
      icon: Monitor,
      change: "+12",
      changeLabel: "questo mese",
      iconBg: "bg-blue-100 dark:bg-blue-900",
      iconColor: "text-primary",
    },
    {
      title: "PC Attivi",
      value: stats?.activePCs || 0,
      icon: CheckCircle,
      change: `${stats?.totalPCs ? Math.round((stats.activePCs / stats.totalPCs) * 100) : 0}%`,
      changeLabel: "operativi",
      iconBg: "bg-green-100 dark:bg-green-900",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "In Manutenzione",
      value: stats?.maintenancePCs || 0,
      icon: Wrench,
      change: `${stats?.totalPCs ? Math.round((stats.maintenancePCs / stats.totalPCs) * 100) : 0}%`,
      changeLabel: "del totale",
      iconBg: "bg-orange-100 dark:bg-orange-900",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      title: "Garanzie in Scadenza",
      value: stats?.expiringWarranties || 0,
      icon: AlertTriangle,
      change: "30 giorni",
      changeLabel: "rimanenti",
      iconBg: "bg-red-100 dark:bg-red-900",
      iconColor: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-3xl font-bold text-foreground">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${card.iconColor} text-xl`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm font-medium text-foreground">{card.change}</span>
                <span className="text-sm text-muted-foreground ml-1">{card.changeLabel}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
