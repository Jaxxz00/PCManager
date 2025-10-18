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

  // Filtra Collaboratori - ottimizzato con useMemo
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
      <DialogContent className="max-w-lg max-h-[72vh] p-0">
        <div className="flex flex-col">
          {/* Header con search */}
          <div className="p-1 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Cerca PC, collaboratori, tutto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs"
                autoFocus
              />
              <button
                onClick={onClose}
                className="absolute right-2.5 top-2 h-3 w-3 text-muted-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Risultati */}
          <div className="overflow-y-auto max-h-72 p-1 space-y-1">
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
                <p className="text-sm mt-2">Cerca PC, collaboratori, componenti...</p>
              </div>
            ) : (
              <>
                {/* Sezione PC */}
                {filteredPcs.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold text-[11px] text-muted-foreground mb-2.5">
                      <Monitor className="h-4 w-4" />
                      PC ({filteredPcs.length})
                    </h3>
                    <div className="space-y-2">
                      {filteredPcs.slice(0, 5).map((pc) => (
                        <div
                          key={pc.id}
                          onClick={() => handlePcClick(pc.id)}
                          className="p-1 rounded-lg border cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{pc.pcId}</p>
                              <p className="text-xs text-muted-foreground">{pc.brand} {pc.model}</p>
                              {pc.employee && (
                                <p className="text-xs"><span className="text-blue-600 font-semibold">{pc.employee.name}</span></p>
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

                {/* Sezione Collaboratori */}
                {filteredEmployees.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold text-sm text-muted-foreground mb-3">
                      <User className="h-4 w-4" />
                      Collaboratori ({filteredEmployees.length})
                    </h3>
                    <div className="space-y-2">
                      {filteredEmployees.slice(0, 5).map((employee) => (
                        <div
                          key={employee.id}
                          onClick={() => handleEmployeeClick(employee.id)}
                          className="p-1 rounded-lg border cursor-pointer"
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
                          +{filteredEmployees.length - 5} altri collaboratori...
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