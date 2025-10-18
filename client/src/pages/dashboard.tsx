import StatsCards from "@/components/stats-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import type { Asset, Employee } from "@shared/schema";
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
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  
  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Calcoli in tempo reale
  const activeAssets = assets.filter((asset) => asset.status === 'active' || asset.status === 'assegnato').length;
  const maintenanceAssets = assets.filter((asset) => asset.status === 'manutenzione').length;
  const unassignedAssets = assets.filter((asset) => !asset.employeeId && asset.status === 'disponibile').length;
  
  // Asset con garanzia in scadenza (prossimi 30 giorni)
  const warrantyExpiring = assets.filter((asset) => {
    if (!asset.warrantyExpiry) return false;
    const today = new Date();
    const warrantyDate = new Date(asset.warrantyExpiry);
    const diffTime = warrantyDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  });

  // Asset aggiunti di recente (ultimi 7 giorni)
  const recentAssets = assets.filter((asset) => {
    if (!asset.createdAt) return false;
    const today = new Date();
    const assetDate = new Date(asset.createdAt);
    const diffTime = today.getTime() - assetDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Panoramica generale del sistema Asset</p>
        </div>
        <div className="flex items-center gap-3">
          <Popover open={isQuickActionsOpen} onOpenChange={setIsQuickActionsOpen}>
            <PopoverTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600" size="sm">Azioni rapide</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-blue-50 border-blue-200 border shadow-lg" align="end">
              <div className="flex flex-col gap-2">
                <Link href="/inventory">
                  <Button className="w-full justify-start h-9 bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02] transition-all duration-200">
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Nuovo Asset
                  </Button>
                </Link>
                <Link href="/employees">
                  <Button className="w-full justify-start h-9 hover:bg-blue-100 hover:scale-[1.02] transition-all duration-200" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Aggiungi Collaboratore
                  </Button>
                </Link>
                <Link href="/maintenance">
                  <Button className="w-full justify-center h-9 hover:bg-blue-100 hover:scale-[1.02] transition-all duration-200" variant="outline">
                    <Wrench className="h-4 w-4 mr-2" />
                    Programma Manutenzione
                  </Button>
                </Link>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Stats Cards Principali */}
      <StatsCards />


      {/* Grid Principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonna Sinistra - Alerts */}
        <div className="space-y-4">
          {/* Garanzie in Scadenza */}
          <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
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
                warrantyExpiring.slice(0, 3).map((asset, index) => {
                  const daysLeft = Math.ceil((new Date(asset.warrantyExpiry!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded-md">
                      <div>
                        <p className="font-medium text-sm">{asset.assetCode}</p>
                        <p className="text-xs text-muted-foreground">{daysLeft} giorni</p>
                      </div>
                      <Badge variant={daysLeft <= 7 ? "destructive" : "secondary"} className="text-xs">
                        {new Date(asset.warrantyExpiry!).toLocaleDateString('it-IT')}
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

          {/* Asset Non Assegnati */}
          <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-blue-500" />
                  Asset Non Assegnati
                </div>
                <Badge variant="secondary">{unassignedAssets}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unassignedAssets > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {unassignedAssets} asset disponibili per l'assegnazione
                  </p>
                  <Link href="/inventory">
                    <Button variant="outline" size="sm" className="w-full">
                      Gestisci Assegnazioni <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Tutti gli asset sono assegnati</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonna Centrale - Attività Recente */}
        <div className="space-y-4">
          <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-green-500" />
                Asset Aggiunti di Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentAssets.length > 0 ? (
                <div className="space-y-3">
                  {recentAssets.slice(0, 4).map((asset, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                      <div>
                        <p className="font-medium text-sm">{asset.assetCode}</p>
                        <p className="text-xs text-muted-foreground">{asset.brand} {asset.model}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {new Date(asset.createdAt!).toLocaleDateString('it-IT')}
                      </Badge>
                    </div>
                  ))}
                  {recentAssets.length > 4 && (
                    <Button variant="outline" size="sm" className="w-full">
                      Vedi tutti <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nessun asset aggiunto di recente</p>
              )}
            </CardContent>
          </Card>

          {/* Asset in Manutenzione */}
          <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-yellow-500" />
                  Asset in Manutenzione
                </div>
                <Badge variant="secondary">{maintenanceAssets}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {maintenanceAssets > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {maintenanceAssets} asset richiedono attenzione
                  </p>
                  <Link href="/maintenance">
                    <Button variant="outline" size="sm" className="w-full">
                      Centro Manutenzione <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Tutti gli asset sono operativi</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonna Destra - Stato Sistema */}
        <div className="space-y-4">
          <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                Statistiche Rapide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Monitor className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Asset Totali</p>
                  <p className="text-lg font-bold text-blue-600">{assets.length}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Users className="h-6 w-6 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Collaboratori</p>
                  <p className="text-lg font-bold text-green-600">{employees.length}</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Attivi</p>
                  <p className="text-lg font-bold text-orange-600">{activeAssets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Azioni Rapide card rimossa (sostituita dal popover in alto) */}
        </div>
      </div>

      {/* Status bar rimossa */}
    </div>
  );
}
