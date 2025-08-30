import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Monitor, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import PcForm from "@/components/pc-form";
import AdvancedFilters, { type FilterState } from "@/components/advanced-filters";
import DataExport from "@/components/data-export";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PcWithEmployee, Employee } from "@shared/schema";

export default function Inventory() {
  const [showPcForm, setShowPcForm] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    brand: '',
    ramMin: '',
    ramMax: '',
    warrantyExpiring: false,
    assignmentStatus: '',
    purchaseDateFrom: '',
    purchaseDateTo: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Ottimizzazione: debounce per la ricerca
  const debouncedSearch = useDebounce(filters.search, 300);

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

  const filteredPcs = useMemo(() => {
    return pcs.filter((pc: PcWithEmployee) => {
      // Usa ricerca con debounce per performance
      if (debouncedSearch.trim()) {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch = pc.pcId.toLowerCase().includes(searchLower) ||
                             pc.brand.toLowerCase().includes(searchLower) ||
                             pc.model.toLowerCase().includes(searchLower) ||
                             pc.serialNumber.toLowerCase().includes(searchLower) ||
                             pc.employee?.name?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtro stato
      if (filters.status && pc.status !== filters.status) return false;

      // Filtro marca
      if (filters.brand && pc.brand !== filters.brand) return false;

      // Filtro RAM
      if (filters.ramMin && pc.ram < parseInt(filters.ramMin)) return false;
      if (filters.ramMax && pc.ram > parseInt(filters.ramMax)) return false;

      // Filtro garanzia in scadenza (prossimi 30 giorni)
      if (filters.warrantyExpiring) {
        const today = new Date();
        const warrantyDate = new Date(pc.warrantyExpiry);
        const diffTime = warrantyDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 30 || diffDays < 0) return false;
      }

      // Filtro stato assegnazione
      if (filters.assignmentStatus) {
        if (filters.assignmentStatus === 'assigned' && !pc.employee) return false;
        if (filters.assignmentStatus === 'unassigned' && pc.employee) return false;
      }

      // Filtro data acquisto
      if (filters.purchaseDateFrom) {
        const fromDate = new Date(filters.purchaseDateFrom);
        const purchaseDate = new Date(pc.purchaseDate);
        if (purchaseDate < fromDate) return false;
      }
      if (filters.purchaseDateTo) {
        const toDate = new Date(filters.purchaseDateTo);
        const purchaseDate = new Date(pc.purchaseDate);
        if (purchaseDate > toDate) return false;
      }

      return true;
    });
  }, [pcs, filters, debouncedSearch]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Attivo</Badge>;
      case "maintenance":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Manutenzione</Badge>;
      case "retired":
        return <Badge variant="destructive">Dismesso</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getWarrantyStatus = (warrantyExpiry: string) => {
    const today = new Date();
    const warrantyDate = new Date(warrantyExpiry);
    const diffTime = warrantyDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: "Scaduta", variant: "destructive" as const };
    } else if (diffDays <= 30) {
      return { text: "In scadenza", variant: "secondary" as const };
    } else {
      return { text: "Valida", variant: "default" as const };
    }
  };

  const handleDeletePc = (id: string) => {
    if (window.confirm("Sei sicuro di voler eliminare questo PC?")) {
      deletePcMutation.mutate(id);
    }
  };

  const handleExport = () => {
    // Funzione implementata nel componente DataExport
  };

  return (
    <div className="space-y-6">
      {/* Header Semplificato */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Inventario PC</h1>
          <p className="text-muted-foreground">{pcs.length} computer totali</p>
        </div>
        <Button onClick={() => setShowPcForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Nuovo PC
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-4 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900">Riepilogo Inventario</h2>
          <p className="text-blue-700">
            Risultati filtrati: <span className="font-bold">{filteredPcs.length}</span> di <span className="font-bold">{pcs.length}</span> dispositivi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataExport pcs={pcs} employees={employees} filteredPcs={filteredPcs} />
        </div>
      </div>

      <AdvancedFilters 
        filters={filters}
        onFiltersChange={setFilters}
        onExport={handleExport}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="mr-2 h-5 w-5" />
            Elenco PC ({filteredPcs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Caricamento inventario...</p>
            </div>
          ) : filteredPcs.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">Nessun PC trovato</p>
              <p className="text-sm text-muted-foreground">
                {pcs.length === 0 
                  ? "Inizia aggiungendo il primo PC al sistema"
                  : "Prova a modificare i filtri di ricerca"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">ID PC</TableHead>
                    <TableHead className="min-w-[200px]">Specifiche</TableHead>
                    <TableHead className="min-w-[180px]">Assegnazione</TableHead>
                    <TableHead className="min-w-[120px]">Stato</TableHead>
                    <TableHead className="min-w-[140px]">Garanzia</TableHead>
                    <TableHead className="min-w-[120px]">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPcs.map((pc) => {
                    const warrantyStatus = getWarrantyStatus(pc.warrantyExpiry);
                    return (
                      <TableRow key={pc.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-medium">{pc.pcId}</p>
                            <p className="text-sm text-muted-foreground">{pc.serialNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{pc.brand} {pc.model}</p>
                            <p className="text-sm text-muted-foreground">
                              {pc.cpu} • {pc.ram}GB RAM • {pc.storage}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {pc.employee ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{pc.employee.name}</p>
                                <p className="text-sm text-muted-foreground">{pc.employee.email}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-muted-foreground">Non assegnato</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(pc.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Badge variant={warrantyStatus.variant}>
                                {warrantyStatus.text}
                              </Badge>
                              <p className="text-sm text-muted-foreground mt-1">
                                {new Date(pc.warrantyExpiry).toLocaleDateString('it-IT')}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Azioni
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="dropdown-menu-enhanced">
                              <DropdownMenuItem 
                                onClick={() => {
                                  // TODO: Implementare modifica PC
                                  toast({
                                    title: "Funzione in sviluppo",
                                    description: "La modifica PC sarà disponibile prossimamente.",
                                  });
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Modifica
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeletePc(pc.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Elimina
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <PcForm 
        open={showPcForm} 
        onOpenChange={setShowPcForm}
      />
    </div>
  );
}