import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, User, Wrench, AlertTriangle } from "lucide-react";

interface DashboardStats {
 totalPCs: number;
 activePCs: number;
 maintenancePCs: number;
 retiredPCs: number;
 totalEmployees: number;
 assignedPCs: number;
 availablePCs: number;
}

export default function StatsCards() {
 const { data: stats, isLoading, error } = useQuery<DashboardStats>({
  queryKey: ["/api/dashboard/stats"],
 });

 if (isLoading) {
  return (
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: 4 }).map((_, i) => (
     <Card key={i} className="animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
       <div className="h-4 bg-gray-200 rounded w-20"></div>
       <div className="h-4 w-4 bg-gray-200 rounded"></div>
      </CardHeader>
      <CardContent>
       <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
       <div className="h-3 bg-gray-200 rounded w-24"></div>
      </CardContent>
     </Card>
    ))}
   </div>
  );
 }

 if (error) {
  return (
   <Card className="border-red-200 bg-red-50">
    <CardContent className="p-6">
     <div className="flex items-center gap-2 text-red-600">
      <AlertTriangle className="h-5 w-5" />
      <span>Errore nel caricamento delle statistiche</span>
     </div>
    </CardContent>
   </Card>
  );
 }

 const statsData = [
  {
   title: "PC Totali",
   value: stats?.totalPCs || 0,
   icon: Monitor,
   description: "Computer nel sistema",
   color: "text-blue-600",
   bgColor: "bg-blue-100",
  },
  {
   title: "PC Attivi",
   value: stats?.activePCs || 0,
   icon: Monitor,
   description: "Operativi",
   color: "text-green-600",
   bgColor: "bg-green-100",
  },
  {
   title: "Dipendenti",
   value: stats?.totalEmployees || 0,
   icon: User,
   description: "Totale registrati",
   color: "text-purple-600",
   bgColor: "bg-purple-100",
  },
  {
   title: "Manutenzione",
   value: stats?.maintenancePCs || 0,
   icon: Wrench,
   description: "PC in riparazione",
   color: "text-orange-600",
   bgColor: "bg-orange-100",
  },
 ];

 return (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
   {statsData.map((stat) => {
    const Icon = stat.icon;
    return (
     <Card key={stat.title} className="">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
       <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {stat.title}
       </CardTitle>
       <div className={`p-2 rounded-full ${stat.bgColor}`}>
        <Icon className={`h-4 w-4 ${stat.color}`} />
       </div>
      </CardHeader>
      <CardContent>
       <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {stat.value}
       </div>
       <p className="text-xs text-gray-600 dark:text-gray-400">
        {stat.description}
       </p>
      </CardContent>
     </Card>
    );
   })}
  </div>
 );
}