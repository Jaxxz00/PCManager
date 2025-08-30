import StatsCards from "@/components/stats-cards";
import NotificationBell from "@/components/notification-bell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Monitor,
  Users,
  Wrench,
  FileText,
  ArrowRight,
  PieChart,
  BarChart3
} from "lucide-react";
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface DashboardData {
  pcsByStatus: Array<{ name: string; value: number; color: string }>;
  pcsByBrand: Array<{ name: string; value: number }>;
  warrantyExpiring: Array<{ pcId: string; warrantyExpiry: string; daysLeft: number }>;
  maintenanceScheduled: Array<{ pcId: string; scheduledDate: string; type: string }>;
  recentAssignments: Array<{ pcId: string; employeeName: string; assignedDate: string }>;
  systemHealth: {
    uptime: string;
    lastBackup: string;
    activeUsers: number;
    totalDocuments: number;
  };
}

export default function Dashboard() {
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard/data"],
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Caricamento dati...</p>
          </div>
          <NotificationBell />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Avanzato */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Operativa</h1>
          <p className="text-muted-foreground">Monitoraggio completo del sistema IT aziendale</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Sistema Operativo
          </Badge>
          <NotificationBell />
        </div>
      </div>

      {/* Stats Cards Principali */}
      <StatsCards />

      {/* Grafici e Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuzione PC per Stato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuzione PC per Stato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={dashboardData?.pcsByStatus || [
                      { name: 'Attivi', value: 12, color: '#10b981' },
                      { name: 'Manutenzione', value: 3, color: '#f59e0b' },
                      { name: 'Dismessi', value: 2, color: '#ef4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(dashboardData?.pcsByStatus || [
                      { name: 'Attivi', value: 12, color: '#10b981' },
                      { name: 'Manutenzione', value: 3, color: '#f59e0b' },
                      { name: 'Dismessi', value: 2, color: '#ef4444' }
                    ]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* PC per Brand */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Inventario per Brand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={dashboardData?.pcsByBrand || [
                  { name: 'Dell', value: 8 },
                  { name: 'HP', value: 5 },
                  { name: 'Lenovo', value: 4 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sezioni Informative */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Garanzie in Scadenza */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Garanzie in Scadenza
            </CardTitle>
            <Badge variant="secondary">2</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium">PC-001</p>
                  <p className="text-sm text-muted-foreground">15 giorni rimasti</p>
                </div>
                <Badge variant="secondary">
                  15/09/2025
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium">PC-003</p>
                  <p className="text-sm text-muted-foreground">5 giorni rimasti</p>
                </div>
                <Badge variant="destructive">
                  05/09/2025
                </Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Vedi tutte <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Manutenzioni Programmate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-500" />
              Manutenzioni Programmate
            </CardTitle>
            <Badge variant="secondary">3</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">PC-005</p>
                  <p className="text-sm text-muted-foreground">Pulizia sistema</p>
                </div>
                <Badge variant="outline">
                  02/09/2025
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">PC-007</p>
                  <p className="text-sm text-muted-foreground">Aggiornamento RAM</p>
                </div>
                <Badge variant="outline">
                  05/09/2025
                </Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Vedi tutte <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assegnazioni Recenti */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              Assegnazioni Recenti
            </CardTitle>
            <Badge variant="secondary">4</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium">PC-009</p>
                  <p className="text-sm text-muted-foreground">Mario Rossi</p>
                </div>
                <Badge variant="outline">
                  Oggi
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium">PC-011</p>
                  <p className="text-sm text-muted-foreground">Laura Bianchi</p>
                </div>
                <Badge variant="outline">
                  Ieri
                </Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Vedi tutte <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stato Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Stato del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground">Uptime Sistema</p>
              <p className="text-lg font-semibold">99.9%</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm text-muted-foreground">Ultimo Backup</p>
              <p className="text-lg font-semibold">Oggi</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-sm text-muted-foreground">Utenti Attivi</p>
              <p className="text-lg font-semibold">12</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-sm text-muted-foreground">Documenti Totali</p>
              <p className="text-lg font-semibold">247</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Azioni Rapide */}
      <Card>
        <CardHeader>
          <CardTitle>Azioni Rapide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button className="h-16 flex-col gap-2" variant="outline">
              <Monitor className="h-6 w-6" />
              <span>Nuovo PC</span>
            </Button>
            <Button className="h-16 flex-col gap-2" variant="outline">
              <Users className="h-6 w-6" />
              <span>Nuovo Dipendente</span>
            </Button>
            <Button className="h-16 flex-col gap-2" variant="outline">
              <Wrench className="h-6 w-6" />
              <span>Programma Manutenzione</span>
            </Button>
            <Button className="h-16 flex-col gap-2" variant="outline">
              <FileText className="h-6 w-6" />
              <span>Genera Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log - Rimosso temporaneamente */}
    </div>
  );
}