import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Monitor, User, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import type { PcWithEmployee, Employee } from "@shared/schema";

interface GlobalSearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function GlobalSearchDropdown({ isOpen, onClose, searchTerm, onSearchChange }: GlobalSearchDropdownProps) {
  const [, setLocation] = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: pcs = [] } = useQuery<PcWithEmployee[]>({
    queryKey: ["/api/pcs"],
    enabled: isOpen,
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: isOpen,
  });

  // Chiudi dropdown quando clicchi fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Filtra PC
  const filteredPcs = pcs.filter(pc => {
    if (!searchTerm.trim()) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      (pc.pcId || '').toLowerCase().includes(searchLower) ||
      (pc.brand || '').toLowerCase().includes(searchLower) ||
      (pc.model || '').toLowerCase().includes(searchLower) ||
      (pc.serialNumber || '').toLowerCase().includes(searchLower) ||
      (pc.employee?.name || '').toLowerCase().includes(searchLower)
    );
  });

  // Filtra Dipendenti
  const filteredEmployees = employees.filter(employee => {
    if (!searchTerm.trim()) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      (employee.name || '').toLowerCase().includes(searchLower) ||
      (employee.email || '').toLowerCase().includes(searchLower) ||
      (employee.department || '').toLowerCase().includes(searchLower) ||
      (employee.position || '').toLowerCase().includes(searchLower)
    );
  });

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

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className="relative">
      {/* Dropdown Content */}
      <div className="absolute top-0 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto min-w-full">
        <div className="p-4">
          {!searchTerm.trim() ? (
            <div className="text-center py-6 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>Inizia a digitare per cercare</p>
              <p className="text-sm mt-1">PC, dipendenti, componenti...</p>
            </div>
          ) : (
            <>
              {/* Sezione PC */}
              {filteredPcs.length > 0 && (
                <div className="mb-4">
                  <h3 className="flex items-center gap-2 font-semibold text-sm text-muted-foreground mb-3 border-b pb-2">
                    <Monitor className="h-4 w-4" />
                    PC ({filteredPcs.length})
                  </h3>
                  <div className="space-y-2">
                    {filteredPcs.slice(0, 4).map((pc) => (
                      <div
                        key={pc.id}
                        onClick={() => handlePcClick(pc.id)}
                        className="p-3 rounded-md hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{pc.pcId}</p>
                            <p className="text-xs text-muted-foreground truncate">{pc.brand} {pc.model} • S/N: {pc.serialNumber}</p>
                            {pc.employee && (
                              <p className="text-xs text-blue-600 truncate">→ {pc.employee.name} ({pc.employee.email})</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            {getStatusBadge(pc.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredPcs.length > 4 && (
                      <p className="text-xs text-muted-foreground text-center py-2 bg-gray-50 rounded">
                        +{filteredPcs.length - 4} altri PC... (vai all'inventario)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Sezione Dipendenti */}
              {filteredEmployees.length > 0 && (
                <div className="mb-4">
                  <h3 className="flex items-center gap-2 font-semibold text-sm text-muted-foreground mb-3 border-b pb-2">
                    <User className="h-4 w-4" />
                    Dipendenti ({filteredEmployees.length})
                  </h3>
                  <div className="space-y-2">
                    {filteredEmployees.slice(0, 4).map((employee) => (
                      <div
                        key={employee.id}
                        onClick={() => handleEmployeeClick(employee.id)}
                        className="p-3 rounded-md hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{employee.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded whitespace-nowrap">
                                {employee.department}
                              </span>
                              <span className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded whitespace-nowrap">
                                {employee.position}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredEmployees.length > 4 && (
                      <p className="text-xs text-muted-foreground text-center py-2 bg-gray-50 rounded">
                        +{filteredEmployees.length - 4} altri dipendenti... (vai ai dipendenti)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Nessun risultato */}
              {filteredPcs.length === 0 && filteredEmployees.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p>Nessun risultato per "{searchTerm}"</p>
                  <p className="text-sm mt-1">Prova con "Dell", "Luca", "IT"...</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}