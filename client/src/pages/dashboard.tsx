import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Download, Edit, ExternalLink, Monitor, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatsCards from "@/components/stats-cards";
import PcForm from "@/components/pc-form";
import { cn } from "@/lib/utils";
import type { PcWithEmployee } from "@shared/schema";

export default function Dashboard() {
  const [showPcForm, setShowPcForm] = useState(false);

  const { data: pcs = [], isLoading } = useQuery<PcWithEmployee[]>({
    queryKey: ["/api/pcs"],
  });

  // Ottimizzazione: memoizza i PC recenti
  const recentPcs = useMemo(() => pcs.slice(0, 5), [pcs]);

  const getStatusBadge = (status: string) => {
    const baseClasses = "status-badge";
    switch (status) {
      case "active":
        return cn(baseClasses, "status-active");
      case "maintenance":
        return cn(baseClasses, "status-maintenance");
      case "retired":
        return cn(baseClasses, "status-retired");
      default:
        return baseClasses;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Attivo";
      case "maintenance":
        return "Manutenzione";
      case "retired":
        return "Dismesso";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.RelativeTimeFormat('it', { numeric: 'auto' }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-900 rounded-xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
            <Monitor className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Dashboard Gestionale PC</h1>
            <p className="text-blue-100 text-lg">Panoramica completa dell'inventario e statistiche Maori Group</p>
          </div>
        </div>
      </div>
      
      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent PC Inventory */}
        <div className="lg:col-span-2">
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl font-bold">Inventario PC Recente</CardTitle>
                </div>
                <Link href="/inventory">
                  <Button variant="ghost" size="sm" className="bg-white/20 text-white hover:bg-white/30 border-white/20">
                    Vedi Tutto
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-medium">PC ID</TableHead>
                      <TableHead className="font-medium">Dipendente</TableHead>
                      <TableHead className="font-medium">Modello</TableHead>
                      <TableHead className="font-medium">Status</TableHead>
                      <TableHead className="font-medium">Ultimo Aggiornamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell className="animate-pulse">
                            <div className="h-4 bg-muted rounded w-16"></div>
                          </TableCell>
                          <TableCell className="animate-pulse">
                            <div className="h-4 bg-muted rounded w-24"></div>
                          </TableCell>
                          <TableCell className="animate-pulse">
                            <div className="h-4 bg-muted rounded w-32"></div>
                          </TableCell>
                          <TableCell className="animate-pulse">
                            <div className="h-6 bg-muted rounded w-20"></div>
                          </TableCell>
                          <TableCell className="animate-pulse">
                            <div className="h-4 bg-muted rounded w-20"></div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : recentPcs.length > 0 ? (
                      recentPcs.map((pc: PcWithEmployee, index) => (
                        <TableRow key={pc.id} className={`transition-all duration-300 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 ${
                          index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'
                        }`}>
                          <TableCell className="font-bold text-emerald-700">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                              {pc.pcId}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-blue-100 rounded-full">
                                <User className="w-3 h-3 text-blue-600" />
                              </div>
                              <span className={pc.employee ? "font-medium text-gray-900" : "text-gray-500 italic"}>
                                {pc.employee?.name || "Non assegnato"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-800">
                              {pc.brand} {pc.model}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                              pc.status === 'active' 
                                ? 'bg-green-100 text-green-800 border border-green-200' :
                                pc.status === 'maintenance' 
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                  'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {getStatusText(pc.status)}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {pc.updatedAt ? new Date(pc.updatedAt).toLocaleDateString('it-IT') : 
                               pc.createdAt ? new Date(pc.createdAt).toLocaleDateString('it-IT') : 'N/A'}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nessun PC trovato
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions and System Health */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Plus className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-bold">Azioni Rapide</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <Button 
                onClick={() => setShowPcForm(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-white/20 rounded">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">Aggiungi Nuovo PC</span>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 transition-all duration-300" 
                size="lg"
                onClick={() => {
                  alert("Funzione esportazione in sviluppo");
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-orange-100 rounded">
                    <Download className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="font-semibold">Esporta Report</span>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-300"
                size="lg"
                onClick={() => {
                  alert("Funzione aggiornamento multiplo in sviluppo");
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-green-100 rounded">
                    <Edit className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="font-semibold">Aggiornamento Multiplo</span>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Stato Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Performance Server</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">Ottimo</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">Normale</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Backup Ultimo</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-orange-600 dark:text-orange-400">2 giorni fa</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Spazio Disco</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">78% utilizzato</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <PcForm open={showPcForm} onOpenChange={setShowPcForm} />
    </div>
  );
}
