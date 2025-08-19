import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Download, Edit, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatsCards from "@/components/stats-cards";
import PcForm from "@/components/pc-form";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { PcWithEmployee } from "@shared/schema";

export default function Dashboard() {
  const [showPcForm, setShowPcForm] = useState(false);

  const { data: pcs = [], isLoading } = useQuery<PcWithEmployee[]>({
    queryKey: ["/api/pcs"],
  });

  const recentPcs = pcs.slice(0, 5);

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
    <div className="space-y-6">
      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent PC Inventory */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">Inventario PC Recente</CardTitle>
                <Link href="/inventory">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                    Vedi Tutto
                    <ExternalLink className="ml-1 h-4 w-4" />
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
                      recentPcs.map((pc: PcWithEmployee) => (
                        <TableRow key={pc.id} className="table-row-hover">
                          <TableCell className="font-medium">{pc.pcId}</TableCell>
                          <TableCell>{pc.employee?.name || "Non assegnato"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {pc.brand} {pc.model}
                          </TableCell>
                          <TableCell>
                            <span className={getStatusBadge(pc.status)}>
                              {getStatusText(pc.status)}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {pc.updatedAt ? new Date(pc.updatedAt).toLocaleDateString('it-IT') : 
                             pc.createdAt ? new Date(pc.createdAt).toLocaleDateString('it-IT') : 'N/A'}
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
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Azioni Rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => setShowPcForm(true)}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi Nuovo PC
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                size="default"
                onClick={() => {
                  // TODO: Implementare esportazione
                  alert("Funzione esportazione in sviluppo");
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Esporta Report
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                size="default"
                onClick={() => {
                  // TODO: Implementare aggiornamento multiplo
                  alert("Funzione aggiornamento multiplo in sviluppo");
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Aggiornamento Multiplo
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
