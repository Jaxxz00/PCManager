import StatsCards from "@/components/stats-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Monitor,
  Users,
  Wrench,
  FileText,
  ArrowRight,
  Activity,
  TrendingUp,
  Calendar,
  Plus
} from "lucide-react";

export default function Dashboard() {
  const { data: pcs = [], isLoading: pcsLoading } = useQuery({
    queryKey: ["/api/pcs"],
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ["/api/employees"],
  });

  // Calcoli in tempo reale
  const activePCs = pcs.filter((pc: any) => pc.status === 'active').length;
  const maintenancePCs = pcs.filter((pc: any) => pc.status === 'maintenance').length;
  const unassignedPCs = pcs.filter((pc: any) => !pc.employeeId).length;
  
  // PC con garanzia in scadenza (prossimi 30 giorni)
  const warrantyExpiring = pcs.filter((pc: any) => {
    if (!pc.warrantyExpiry) return false;
    const today = new Date();
    const warrantyDate = new Date(pc.warrantyExpiry);
    const diffTime = warrantyDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  });

  // PC aggiunti di recente (ultimi 7 giorni)
  const recentPCs = pcs.filter((pc: any) => {
    if (!pc.createdAt) return false;
    const today = new Date();
    const pcDate = new Date(pc.createdAt);
    const diffTime = today.getTime() - pcDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Panoramica generale del sistema PC</p>
        </div>
      </div>

      {/* Stats Cards Principali */}
      <StatsCards />

      {/* Grid Principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonna Sinistra - Alerts */}
        <div className="space-y-4">
          {/* Garanzie in Scadenza */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Garanzie in Scadenza
                </div>
                <Badge variant="secondary">{warrantyExpiring.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {warrantyExpiring.length > 0 ? (
                warrantyExpiring.slice(0, 3).map((pc: any, index: number) => {
                  const daysLeft = Math.ceil((new Date(pc.warrantyExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded-md">
                      <div>
                        <p className="font-medium text-sm">{pc.pcId}</p>
                        <p className="text-xs text-muted-foreground">{daysLeft} giorni</p>
                      </div>
                      <Badge variant={daysLeft <= 7 ? "destructive" : "secondary"} className="text-xs">
                        {new Date(pc.warrantyExpiry).toLocaleDateString('it-IT')}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nessuna garanzia in scadenza</p>
              )}
              {warrantyExpiring.length > 3 && (
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Vedi tutte ({warrantyExpiring.length}) <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>

          {/* PC Non Assegnati */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-blue-500" />
                  PC Non Assegnati
                </div>
                <Badge variant="secondary">{unassignedPCs}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unassignedPCs > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {unassignedPCs} PC disponibili per l'assegnazione
                  </p>
                  <Link href="/inventory">
                    <Button variant="outline" size="sm" className="w-full">
                      Gestisci Assegnazioni <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Tutti i PC sono assegnati</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonna Centrale - Attività Recente */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-green-500" />
                PC Aggiunti di Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPCs.length > 0 ? (
                <div className="space-y-3">
                  {recentPCs.slice(0, 4).map((pc: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                      <div>
                        <p className="font-medium text-sm">{pc.pcId}</p>
                        <p className="text-xs text-muted-foreground">{pc.brand} {pc.model}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {new Date(pc.createdAt).toLocaleDateString('it-IT')}
                      </Badge>
                    </div>
                  ))}
                  {recentPCs.length > 4 && (
                    <Button variant="outline" size="sm" className="w-full">
                      Vedi tutti <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nessun PC aggiunto di recente</p>
              )}
            </CardContent>
          </Card>

          {/* PC in Manutenzione */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-yellow-500" />
                  PC in Manutenzione
                </div>
                <Badge variant="secondary">{maintenancePCs}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {maintenancePCs > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {maintenancePCs} PC richiedono attenzione
                  </p>
                  <Link href="/maintenance">
                    <Button variant="outline" size="sm" className="w-full">
                      Centro Manutenzione <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Tutti i PC sono operativi</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonna Destra - Stato Sistema */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                Statistiche Rapide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Monitor className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">PC Totali</p>
                  <p className="text-lg font-bold text-blue-600">{pcs.length}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Users className="h-6 w-6 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Dipendenti</p>
                  <p className="text-lg font-bold text-green-600">{employees.length}</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">PC Attivi</p>
                  <p className="text-lg font-bold text-orange-600">{activePCs}</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Documenti</p>
                  <p className="text-lg font-bold text-purple-600">15</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Azioni Rapide */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Azioni Rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/inventory">
                <Button className="w-full justify-start h-10" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Nuovo PC
                </Button>
              </Link>
              <Link href="/employees">
                <Button className="w-full justify-start h-10" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Aggiungi Dipendente
                </Button>
              </Link>
              <Link href="/maintenance">
                <Button className="w-full justify-start h-10" variant="outline">
                  <Wrench className="h-4 w-4 mr-2" />
                  Programma Manutenzione
                </Button>
              </Link>
              <Link href="/reports">
                <Button className="w-full justify-start h-10" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Genera Report
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sistema Status Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-muted-foreground">Sistema Online</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Ultimo Backup: Oggi</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">12 Utenti Attivi</span>
              </div>
            </div>
            <Badge variant="outline">v2.1.0</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}