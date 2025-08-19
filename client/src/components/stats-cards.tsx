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
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="border-slate-700/50 shadow-xl bg-slate-900/60 backdrop-blur-md hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl hover:border-slate-600/50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-slate-700/40 border border-slate-600/30">
                  <Icon className="h-6 w-6 text-slate-300" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">
                    {card.value}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">
                  {card.title}
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-slate-300">
                    {card.change}
                  </span>
                  <span className="text-slate-400">
                    {card.changeLabel}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
