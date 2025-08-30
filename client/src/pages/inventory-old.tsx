import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PcForm from "@/components/pc-form";
import AdvancedFilters, { type FilterState } from "@/components/advanced-filters";
import DataExport from "@/components/data-export";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { PcWithEmployee, Employee } from "@shared/schema";

export default function Inventory() {
  const [showPcForm, setShowPcForm] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    brand: 'all',
    ramMin: '',
    ramMax: '',
    warrantyExpiring: false,
    assignmentStatus: 'all',
    purchaseDateFrom: '',
    purchaseDateTo: ''
  });

  const onFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      // Ricerca generale
      if (filters.search.trim()) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = pc.pcId.toLowerCase().includes(searchLower) ||
                             pc.brand.toLowerCase().includes(searchLower) ||
                             pc.model.toLowerCase().includes(searchLower) ||
                             pc.serialNumber.toLowerCase().includes(searchLower) ||
                             pc.employee?.name?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtro stato
      if (filters.status && filters.status !== 'all' && pc.status !== filters.status) return false;

      // Filtro marca
      if (filters.brand && filters.brand !== 'all' && pc.brand !== filters.brand) return false;

      // Filtro RAM
      if (filters.ramMin && pc.ram < parseInt(filters.ramMin)) return false;
      if (filters.ramMax && pc.ram > parseInt(filters.ramMax)) return false;

      // Filtro assegnazione
      if (filters.assignmentStatus && filters.assignmentStatus !== 'all') {
        if (filters.assignmentStatus === 'assigned' && !pc.employeeId) return false;
        if (filters.assignmentStatus === 'unassigned' && pc.employeeId) return false;
      }

      // Filtro data acquisto
      if (filters.purchaseDateFrom && pc.purchaseDate < filters.purchaseDateFrom) return false;
      if (filters.purchaseDateTo && pc.purchaseDate > filters.purchaseDateTo) return false;

      // Filtro garanzia in scadenza
      if (filters.warrantyExpiring) {
        const now = new Date();
        const warrantyDate = new Date(pc.warrantyExpiry);
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        if (warrantyDate > thirtyDaysFromNow || warrantyDate <= now) return false;
      }

      return true;
    });
  }, [pcs, filters]);

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

  const handleDeletePc = (id: string) => {
    if (window.confirm("Sei sicuro di voler eliminare questo PC?")) {
      deletePcMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-foreground">Inventario PC</h1>
          <p className="text-muted-foreground">Gestisci tutti i computer aziendali</p>
        </div>
        <Button 
          onClick={() => setShowPcForm(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi PC
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Cerca per ID, marca, modello o dipendente..."
                  value={filters.search}
                  onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={filters.status} onValueChange={(value) => onFiltersChange({ ...filters, status: value })}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="active">Attivo</SelectItem>
                  <SelectItem value="maintenance">Manutenzione</SelectItem>
                  <SelectItem value="retired">Dismesso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PC Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Computer ({filteredPcs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium">PC ID</TableHead>
                  <TableHead className="font-medium">Dipendente</TableHead>
                  <TableHead className="font-medium">Marca/Modello</TableHead>
                  <TableHead className="font-medium">CPU</TableHead>
                  <TableHead className="font-medium">RAM</TableHead>
                  <TableHead className="font-medium">Storage</TableHead>
                  <TableHead className="font-medium">OS</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="font-medium">Garanzia</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(10)].map((_, j) => (
                        <TableCell key={j} className="animate-pulse">
                          <div className="h-4 bg-muted rounded w-20"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredPcs.length > 0 ? (
                  filteredPcs.map((pc: PcWithEmployee) => (
                    <TableRow key={pc.id} className="table-row-hover">
                      <TableCell className="font-medium">{pc.pcId}</TableCell>
                      <TableCell>{pc.employee?.name || "Non assegnato"}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{pc.brand}</div>
                          <div className="text-sm text-muted-foreground">{pc.model}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{pc.cpu}</TableCell>
                      <TableCell className="text-sm">{pc.ram} GB</TableCell>
                      <TableCell className="text-sm">{pc.storage}</TableCell>
                      <TableCell className="text-sm">{pc.operatingSystem}</TableCell>
                      <TableCell>
                        <span className={getStatusBadge(pc.status)}>
                          {getStatusText(pc.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(pc.warrantyExpiry).toLocaleDateString('it-IT')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifica
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeletePc(pc.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Elimina
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      {filters.search || filters.status !== "all" 
                        ? "Nessun PC corrisponde ai filtri selezionati" 
                        : "Nessun PC trovato"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PcForm open={showPcForm} onOpenChange={setShowPcForm} />
    </div>
  );
}
