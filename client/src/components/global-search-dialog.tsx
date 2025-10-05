import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Monitor, User, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import type { PcWithEmployee, Employee } from "@shared/schema";

interface GlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialSearchTerm?: string;
}

export function GlobalSearchDialog({ isOpen, onClose, initialSearchTerm = "" }: GlobalSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [, setLocation] = useLocation();

  const { data: pcs = [], isLoading: pcsLoading, isError: pcsError } = useQuery<PcWithEmployee[]>({
    queryKey: ["/api/pcs"],
    enabled: isOpen,
  });

  const { data: employees = [], isLoading: employeesLoading, isError: employeesError } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: isOpen,
  });

  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  // Filtra PC - ottimizzato con useMemo
  const filteredPcs = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const searchLower = searchTerm.toLowerCase();
    return pcs.filter(pc => (
      (pc.pcId || '').toLowerCase().includes(searchLower) ||
      (pc.brand || '').toLowerCase().includes(searchLower) ||
      (pc.model || '').toLowerCase().includes(searchLower) ||
      (pc.serialNumber || '').toLowerCase().includes(searchLower) ||
      (pc.employee?.name || '').toLowerCase().includes(searchLower)
    ));
  }, [pcs, searchTerm]);

  // Filtra Dipendenti - ottimizzato con useMemo
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const searchLower = searchTerm.toLowerCase();
    return employees.filter(employee => (
      (employee.name || '').toLowerCase().includes(searchLower) ||
      (employee.email || '').toLowerCase().includes(searchLower) ||
      (employee.department || '').toLowerCase().includes(searchLower) ||
      (employee.company || '').toLowerCase().includes(searchLower)
    ));
  }, [employees, searchTerm]);

  const handlePcClick = (pcId: string) => {
    setLocation("/inventory");
    onClose();
  };

  const handleEmployeeClick = (employeeId: string) => {
    setLocation("/employees");
    onClose();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">Attivo</Badge>;
      case "maintenance":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">Manutenzione</Badge>;
      case "retired":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 text-xs">Dismesso</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <div className="flex flex-col">
          {/* Header con search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca PC, dipendenti, tutto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-base"
                autoFocus
              />
              <button
                onClick={onClose}
                className="absolute right-3 top-3 h-4 w-4 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Risultati */}
          <div className="overflow-y-auto max-h-96 p-4 space-y-4">
            {(pcsLoading || employeesLoading) && searchTerm.trim() ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Caricamento risultati...</p>
              </div>
            ) : (pcsError || employeesError) && searchTerm.trim() ? (
              <div className="text-center py-8 text-red-600">
                <p>Errore nel caricamento dei dati</p>
                <p className="text-sm mt-2">Riprova più tardi</p>
              </div>
            ) : !searchTerm.trim() ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Digita per iniziare la ricerca</p>
                <p className="text-sm mt-2">Cerca PC, dipendenti, componenti...</p>
              </div>
            ) : (
              <>
                {/* Sezione PC */}
                {filteredPcs.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold text-sm text-muted-foreground mb-3">
                      <Monitor className="h-4 w-4" />
                      PC ({filteredPcs.length})
                    </h3>
                    <div className="space-y-2">
                      {filteredPcs.slice(0, 5).map((pc) => (
                        <div
                          key={pc.id}
                          onClick={() => handlePcClick(pc.id)}
                          className="p-3 rounded-lg border cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{pc.pcId}</p>
                              <p className="text-sm text-muted-foreground">{pc.brand} {pc.model}</p>
                              {pc.employee && (
                                <p className="text-xs text-blue-600">Assegnato a: {pc.employee.name}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(pc.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredPcs.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          +{filteredPcs.length - 5} altri PC...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Sezione Dipendenti */}
                {filteredEmployees.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold text-sm text-muted-foreground mb-3">
                      <User className="h-4 w-4" />
                      Dipendenti ({filteredEmployees.length})
                    </h3>
                    <div className="space-y-2">
                      {filteredEmployees.slice(0, 5).map((employee) => (
                        <div
                          key={employee.id}
                          onClick={() => handleEmployeeClick(employee.id)}
                          className="p-3 rounded-lg border cursor-pointer"
                        >
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-sm text-muted-foreground">{employee.email}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {employee.department}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                {employee.company}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredEmployees.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          +{filteredEmployees.length - 5} altri dipendenti...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Nessun risultato */}
                {filteredPcs.length === 0 && filteredEmployees.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nessun risultato trovato per "{searchTerm}"</p>
                    <p className="text-sm mt-2">Prova con "Dell", "Luca", "IT", "OptiPlex"...</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}