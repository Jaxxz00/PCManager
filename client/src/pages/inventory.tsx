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

  const { data: pcs = [], isLoading, error } = useQuery<PcWithEmployee[]>({
    queryKey: ["/api/pcs"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Debug temporaneo
  console.log('Inventory Debug:', {
    pcs,
    pcsLength: pcs?.length,
    isLoading,
    error: error?.message,
    searchTerm,
    debouncedSearch,
    statusFilter,
    brandFilter
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

  // Filtri e ricerca - SEMPLIFICATO
  const filteredPcs = useMemo(() => {
    console.log('=== FILTER DEBUG START ===');
    console.log('Raw PCs data:', pcs);
    console.log('PCs length:', pcs?.length);
    console.log('Search term:', debouncedSearch);
    console.log('Status filter:', statusFilter);
    console.log('Brand filter:', brandFilter);
    
    if (!pcs || pcs.length === 0) {
      console.log('NO PCS AVAILABLE - returning empty array');
      return [];
    }
    
    // Se non ci sono filtri attivi, mostra tutto
    if (!debouncedSearch.trim() && !statusFilter && !brandFilter) {
      console.log('NO FILTERS ACTIVE - returning all PCs:', pcs.length);
      return pcs;
    }
    
    // Applica filtri solo se necessario
    const result = pcs.filter((pc: PcWithEmployee) => {
      console.log('Checking PC:', pc.pcId, pc.brand, pc.model);
      
      // Ricerca globale - cerca in TUTTI i campi
      if (debouncedSearch.trim()) {
        const searchTerms = debouncedSearch.toLowerCase().split(' ').filter(term => term.length > 0);
        
        // Crea un testo combinato con tutti i dati del PC per la ricerca
        const searchableText = [
          pc.pcId,
          pc.brand,
          pc.model,
          pc.serialNumber,
          pc.cpu,
          pc.ram ? `${pc.ram}gb` : '',
          pc.ram ? `${pc.ram} gb` : '',
          pc.storage,
          pc.operatingSystem,
          pc.status,
          pc.notes,
          pc.employee?.name,
          pc.employee?.email,
          pc.purchaseDate,
          pc.warrantyExpiry,
          `${pc.brand} ${pc.model}`,
          // Aggiungi anche le traduzioni dello status
          pc.status === 'active' ? 'attivo' : '',
          pc.status === 'maintenance' ? 'manutenzione' : '',
          pc.status === 'retired' ? 'dismesso' : '',
          // Altri sinonimi utili
          pc.brand?.toLowerCase() === 'dell' ? 'dell computer' : '',
          pc.brand?.toLowerCase() === 'hp' ? 'hewlett packard' : ''
        ].filter(Boolean).join(' ').toLowerCase();
        
        // Verifica che tutti i termini di ricerca siano presenti
        const allTermsMatch = searchTerms.every(term => 
          searchableText.includes(term)
        );
        
        console.log('Global Search DEBUG for', pc.pcId);
        console.log('Search terms:', searchTerms);
        console.log('Searchable text:', searchableText.substring(0, 200) + '...');
        console.log('All terms match:', allTermsMatch);
        
        if (!allTermsMatch) return false;
      }
      
      // Filtro stato
      if (statusFilter && pc.status !== statusFilter) {
        console.log('Status filter reject:', pc.pcId);
        return false;
      }
      
      // Filtro marca  
      if (brandFilter && pc.brand !== brandFilter) {
        console.log('Brand filter reject:', pc.pcId);
        return false;
      }
      
      console.log('PC ACCEPTED:', pc.pcId);
      return true;
    });
    
    console.log('=== FILTER RESULT ===');
    console.log('Filtered PCs:', result.length, 'out of', pcs.length);
    console.log('Filtered data:', result);
    console.log('=== FILTER DEBUG END ===');
    
    return result;
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
                placeholder="Ricerca globale: ID, marca, modello, dipendente, stato..."
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
          ) : error ? (
            <div className="text-center py-8">
              <Monitor className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">Errore nel caricamento</p>
              <p className="text-sm text-muted-foreground mt-2">
                {error.message.includes('401') || error.message.includes('Unauthorized') 
                  ? 'Sessione scaduta. Effettua nuovamente il login.' 
                  : error.message}
              </p>
              {(error.message.includes('401') || error.message.includes('Unauthorized')) && (
                <Button 
                  variant="outline" 
                  className="mt-3"
                  onClick={() => window.location.href = '/login'}
                >
                  Vai al Login
                </Button>
              )}
            </div>
          ) : !pcs || pcs.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nessun PC nel sistema</p>
              <p className="text-xs text-muted-foreground mt-2">
                Debug: isLoading={String(isLoading)}, pcs={pcs?.length || 'undefined'}
              </p>
            </div>
          ) : filteredPcs.length === 0 ? (
            <div className="text-center py-12">
              <Monitor className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                Nessun risultato trovato
              </h3>
              <p className="text-muted-foreground mb-4">
                {debouncedSearch ? 
                  `Nessun PC corrisponde alla ricerca "${debouncedSearch}"` :
                  "Nessun PC corrisponde ai filtri selezionati"
                }
              </p>
              
              {debouncedSearch && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 max-w-md mx-auto">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Suggerimenti per la ricerca:</strong>
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Prova "Dell" o "HP" per la marca</li>
                    <li>• Cerca "PC-001" o "PC-002" per l'ID</li>
                    <li>• Inserisci "Luca" o "Sara" per il dipendente</li>
                    <li>• Usa "OptiPlex" o "EliteDesk" per il modello</li>
                  </ul>
                </div>
              )}
              
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("");
                    setBrandFilter("");
                  }}
                >
                  Rimuovi Tutti i Filtri
                </Button>
                {debouncedSearch && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSearchTerm("")}
                  >
                    Cancella Ricerca
                  </Button>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mt-4">
                PC disponibili nel sistema: {pcs.length}
              </p>
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