import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Monitor, User, Calendar, Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import PcForm from "@/components/pc-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PcWithEmployee, Employee } from "@shared/schema";

export default function Inventory() {
  const [showPcForm, setShowPcForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: pcs = [], isLoading } = useQuery<PcWithEmployee[]>({
    queryKey: ["/api/pcs"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const deletePcMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/pcs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pcs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "PC eliminato",
        description: "Il PC è stato rimosso dal sistema.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare il PC.",
        variant: "destructive",
      });
    },
  });

  // Filtri e ricerca
  const filteredPcs = useMemo(() => {
    if (!pcs || pcs.length === 0) return [];
    
    return pcs.filter((pc: PcWithEmployee) => {
      // Filtro ricerca testuale
      if (debouncedSearch.trim()) {
        const searchLower = debouncedSearch.toLowerCase();
        const searchFields = [
          pc.pcId || '',
          pc.brand || '',
          pc.model || '',
          pc.serialNumber || '',
          pc.employee?.name || ''
        ];
        
        const matchesSearch = searchFields.some(field => 
          field.toLowerCase().includes(searchLower)
        );
        
        if (!matchesSearch) return false;
      }

      // Filtro stato
      if (statusFilter && pc.status !== statusFilter) return false;
      
      // Filtro marca
      if (brandFilter && pc.brand !== brandFilter) return false;

      return true;
    });
  }, [pcs, debouncedSearch, statusFilter, brandFilter]);

  // Statistiche per le cards
  const totalPCs = pcs.length;
  const activePCs = pcs.filter(pc => pc.status === 'active').length;
  const unassignedPCs = pcs.filter(pc => !pc.employeeId).length;
  const maintenancePCs = pcs.filter(pc => pc.status === 'maintenance').length;

  // Brand unici per filtro
  const uniqueBrands = Array.from(new Set(pcs.map(pc => pc.brand))).filter(Boolean);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Attivo</Badge>;
      case "maintenance":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Manutenzione</Badge>;
      case "retired":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Dismesso</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAssignmentBadge = (employee: any) => {
    if (!employee) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Non Assegnato</Badge>;
    }
    return <Badge variant="default" className="bg-blue-50 text-blue-700 border-blue-200">{employee.name}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventario PC</h1>
          <p className="text-muted-foreground">Gestione completa del parco computer aziendale</p>
        </div>
        <Button 
          onClick={() => setShowPcForm(true)} 
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuovo PC
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Monitor className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">PC Totali</p>
                <p className="text-2xl font-bold">{totalPCs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Monitor className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">PC Attivi</p>
                <p className="text-2xl font-bold">{activePCs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <User className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Non Assegnati</p>
                <p className="text-2xl font-bold">{unassignedPCs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Monitor className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Manutenzione</p>
                <p className="text-2xl font-bold">{maintenancePCs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtri e Ricerca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtri e Ricerca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca PC, modello, serial, dipendente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-pc"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Tutti gli stati</option>
              <option value="active">Attivo</option>
              <option value="maintenance">Manutenzione</option>
              <option value="retired">Dismesso</option>
            </select>

            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Tutte le marche</option>
              {uniqueBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>

            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Esporta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabella PC */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Elenco PC ({filteredPcs.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-muted-foreground mt-2">Caricamento...</p>
            </div>
          ) : filteredPcs.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nessun PC trovato</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID PC</TableHead>
                    <TableHead>Marca/Modello</TableHead>
                    <TableHead>Specifiche</TableHead>
                    <TableHead>Assegnazione</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Garanzia</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPcs.map((pc) => {
                    const warrantyDate = pc.warrantyExpiry ? new Date(pc.warrantyExpiry) : null;
                    const isWarrantyExpiring = warrantyDate && 
                      warrantyDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
                      warrantyDate > new Date();

                    return (
                      <TableRow key={pc.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{pc.pcId}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{pc.brand} {pc.model}</p>
                            <p className="text-xs text-muted-foreground">S/N: {pc.serialNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{pc.cpu}</p>
                            <p className="text-muted-foreground">RAM: {pc.ram}GB • {pc.storage}</p>
                            <p className="text-muted-foreground">{pc.operatingSystem}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getAssignmentBadge(pc.employee)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(pc.status)}
                        </TableCell>
                        <TableCell>
                          {warrantyDate ? (
                            <div className={`text-sm ${isWarrantyExpiring ? 'text-orange-600 font-medium' : ''}`}>
                              {warrantyDate.toLocaleDateString('it-IT')}
                              {isWarrantyExpiring && (
                                <p className="text-xs text-orange-600">In scadenza</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => deletePcMutation.mutate(pc.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PcForm open={showPcForm} onOpenChange={setShowPcForm} />
    </div>
  );
}