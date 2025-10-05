import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Calendar, Monitor, Users, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataExport from "@/components/data-export";
import type { Asset, Employee } from "@shared/schema";

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });
  
  // Filter only PC assets for reports compatibility
  const pcs = assets.filter(asset => asset.assetType === 'pc');

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Calcoli statistiche avanzate
  const generateAdvancedStats = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Statistiche per brand
    const brandStats = pcs.reduce((acc: Record<string, number>, pc) => {
      const brand = pc.brand || 'Sconosciuto';
      acc[brand] = (acc[brand] || 0) + 1;
      return acc;
    }, {});

    // Statistiche per dipartimento
    const departmentStats = employees.reduce((acc: Record<string, number>, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    }, {});

    // PC per stato
    const statusStats = pcs.reduce((acc: Record<string, number>, pc) => {
      acc[pc.status] = (acc[pc.status] || 0) + 1;
      return acc;
    }, {});

    // Garanzie in scadenza
    const warrantyAnalysis = pcs.map(pc => {
      const warrantyDate = pc.warrantyExpiry ? new Date(pc.warrantyExpiry) : new Date();
      const daysUntilExpiry = Math.ceil((warrantyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { ...pc, daysUntilExpiry };
    });

    const expiringWarranties = warrantyAnalysis.filter(pc => pc.daysUntilExpiry <= 90 && pc.daysUntilExpiry > 0);
    const expiredWarranties = warrantyAnalysis.filter(pc => pc.daysUntilExpiry <= 0);

    // Analisi età hardware
    const hardwareAge = pcs.map(pc => {
      const purchaseDate = pc.purchaseDate ? new Date(pc.purchaseDate) : new Date();
      const ageInDays = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      const ageInMonths = Math.floor(ageInDays / 30);
      return { ...pc, ageInMonths };
    });

    const oldHardware = hardwareAge.filter(pc => pc.ageInMonths >= 36); // Più di 3 anni
    const newHardware = hardwareAge.filter(pc => pc.ageInMonths <= 12); // Meno di 1 anno

    // Utilizzo per dipendente
    const assignmentStats = {
      assigned: pcs.filter(pc => pc.employeeId).length,
      unassigned: pcs.filter(pc => !pc.employeeId).length
    };

    // Costi (simulati basati su range medi)
    const estimatedCosts = pcs.reduce((total, pc) => {
      let estimatedPrice = 0;
      const brand = pc.brand || '';
      if (brand === 'Apple') estimatedPrice = 1500;
      else if (brand === 'Dell' || brand === 'HP') estimatedPrice = 800;
      else estimatedPrice = 600;
      
      return total + estimatedPrice;
    }, 0);

    return {
      brandStats,
      departmentStats,
      statusStats,
      expiringWarranties,
      expiredWarranties,
      oldHardware,
      newHardware,
      assignmentStats,
      estimatedCosts,
      averageAge: hardwareAge.reduce((sum, pc) => sum + pc.ageInMonths, 0) / hardwareAge.length || 0
    };
  };

  const stats = generateAdvancedStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'retired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Semplificato */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Report</h1>
          <p className="text-muted-foreground">Analisi e statistiche sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i periodi</SelectItem>
              <SelectItem value="1m">Ultimo mese</SelectItem>
              <SelectItem value="3m">Ultimi 3 mesi</SelectItem>
              <SelectItem value="6m">Ultimi 6 mesi</SelectItem>
              <SelectItem value="1y">Ultimo anno</SelectItem>
            </SelectContent>
          </Select>
          <DataExport pcs={pcs} employees={employees} />
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="hardware">Hardware</TabsTrigger>
          <TabsTrigger value="warranty">Garanzie</TabsTrigger>
          <TabsTrigger value="costs">Costi</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">PC Totali</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pcs.length}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.assignmentStats.assigned} assegnati, {stats.assignmentStats.unassigned} liberi
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dipendenti</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employees.length}</div>
                <p className="text-xs text-muted-foreground">
                  {Object.keys(stats.departmentStats).length} dipartimenti
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Età Media</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(stats.averageAge)} mesi</div>
                <p className="text-xs text-muted-foreground">
                  {stats.oldHardware.length} PC oltre 3 anni
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valore Stimato</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{stats.estimatedCosts.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Costo totale stimato
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuzione per Stato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(stats.statusStats).map(([status, count]) => {
                  const percentage = (count / pcs.length) * 100;
                  return (
                    <div key={status} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="capitalize">
                          {status === 'active' ? 'Attivo' : 
                           status === 'maintenance' ? 'Manutenzione' : 
                           status === 'retired' ? 'Dismesso' : status}
                        </span>
                        <span className="text-sm text-muted-foreground">{count} PC</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuzione per Brand</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(stats.brandStats)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([brand, count]) => {
                    const percentage = (count / pcs.length) * 100;
                    return (
                      <div key={brand} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>{brand}</span>
                          <span className="text-sm text-muted-foreground">{count} PC</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hardware" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Analisi Età Hardware</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Hardware Nuovo (&lt; 1 anno)</span>
                    <Badge variant="default">{stats.newHardware.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Hardware Standard (1-3 anni)</span>
                    <Badge variant="secondary">
                      {pcs.length - stats.newHardware.length - stats.oldHardware.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Hardware Datato (&gt; 3 anni)</span>
                    <Badge variant="destructive">{stats.oldHardware.length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuzione RAM</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[4, 8, 16, 32].map(ramSize => {
                    const count = pcs.filter(pc => (pc.specs as any)?.ram === ramSize).length;
                    const percentage = count > 0 ? (count / pcs.length) * 100 : 0;
                    return (
                      <div key={ramSize} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>{ramSize}GB RAM</span>
                          <span className="text-sm text-muted-foreground">{count} PC</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="warranty" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                  Garanzie in Scadenza
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.expiringWarranties.length === 0 ? (
                  <p className="text-muted-foreground">Nessuna garanzia in scadenza nei prossimi 90 giorni</p>
                ) : (
                  <div className="space-y-3">
                    {stats.expiringWarranties.slice(0, 5).map(pc => (
                      <div key={pc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{pc.assetCode}</p>
                          <p className="text-sm text-muted-foreground">{pc.brand || 'N/A'} {pc.model || 'N/A'}</p>
                        </div>
                        <Badge variant="destructive">
                          {pc.daysUntilExpiry} giorni
                        </Badge>
                      </div>
                    ))}
                    {stats.expiringWarranties.length > 5 && (
                      <p className="text-sm text-muted-foreground">
                        +{stats.expiringWarranties.length - 5} altri PC
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                  Garanzie Scadute
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.expiredWarranties.length === 0 ? (
                  <p className="text-muted-foreground">Nessuna garanzia scaduta</p>
                ) : (
                  <div className="space-y-3">
                    {stats.expiredWarranties.slice(0, 5).map(pc => (
                      <div key={pc.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                        <div>
                          <p className="font-medium">{pc.assetCode}</p>
                          <p className="text-sm text-muted-foreground">{pc.brand || 'N/A'} {pc.model || 'N/A'}</p>
                        </div>
                        <Badge variant="destructive">
                          Scaduta
                        </Badge>
                      </div>
                    ))}
                    {stats.expiredWarranties.length > 5 && (
                      <p className="text-sm text-muted-foreground">
                        +{stats.expiredWarranties.length - 5} altri PC
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Analisi Costi per Brand</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(stats.brandStats).map(([brand, count]) => {
                  let avgPrice = 600;
                  if (brand === 'Apple') avgPrice = 1500;
                  else if (brand === 'Dell' || brand === 'HP') avgPrice = 800;
                  
                  const totalValue = count * avgPrice;
                  
                  return (
                    <div key={brand} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{brand}</p>
                        <p className="text-sm text-muted-foreground">{count} PC</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">€{totalValue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">€{avgPrice}/PC</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Raccomandazioni di Rinnovamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg bg-yellow-50">
                    <p className="font-medium text-yellow-800">Hardware da Rinnovare</p>
                    <p className="text-sm text-yellow-600">
                      {stats.oldHardware.length} PC hanno più di 3 anni
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-lg bg-red-50">
                    <p className="font-medium text-red-800">Garanzie da Rinnovare</p>
                    <p className="text-sm text-red-600">
                      {stats.expiredWarranties.length} PC con garanzia scaduta
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-lg bg-blue-50">
                    <p className="font-medium text-blue-800">Costo Stimato Rinnovamento</p>
                    <p className="text-sm text-blue-600">
                      €{(stats.oldHardware.length * 800).toLocaleString()} per sostituire hardware datato
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}