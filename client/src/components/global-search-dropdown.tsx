import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Monitor, User, X, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Asset, Employee } from "@shared/schema";

interface MaintenanceRecord {
  id: string;
  pcId: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  description: string;
  technician: string;
  scheduledDate?: string;
  completedDate?: string;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
  pc?: Asset;
}

interface GlobalSearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function GlobalSearchDropdown({ isOpen, onClose, searchTerm, onSearchChange }: GlobalSearchDropdownProps) {
  const [, setLocation] = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: assets = [], isLoading: assetsLoading, isError: assetsError } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
    enabled: isOpen,
  });

  const { data: employees = [], isLoading: employeesLoading, isError: employeesError } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: isOpen,
  });

  const { data: maintenanceRecords = [], isLoading: maintenanceLoading, isError: maintenanceError } = useQuery<MaintenanceRecord[]>({
    queryKey: ["/api/maintenance"],
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

  // Funzione per generare codice intervento
  const generateInterventoId = (recordId: string) => {
    const currentDate = new Date();
    const timestamp = format(currentDate, "yyyyMMddHHmm");
    return `RIC-${timestamp.slice(2)}`;
  };

  // Filtra Asset - ottimizzato con useMemo
  const filteredAssets = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const searchLower = searchTerm.toLowerCase();
    return assets.filter(asset => (
      (asset.assetCode || '').toLowerCase().includes(searchLower) ||
      (asset.brand || '').toLowerCase().includes(searchLower) ||
      (asset.model || '').toLowerCase().includes(searchLower) ||
      (asset.serialNumber || '').toLowerCase().includes(searchLower) ||
      (asset.assetType || '').toLowerCase().includes(searchLower)
    ));
  }, [assets, searchTerm]);

  // Filtra record di manutenzione per codici a barre - ottimizzato con useMemo
  const filteredMaintenance = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const searchUpper = searchTerm.toUpperCase();
    
    return maintenanceRecords.filter(record => {
      // Cerca per codice RIC- (formato barcode)
      if (searchUpper.startsWith('RIC-')) {
        return true; // Mostra tutti i record di manutenzione se cerca un codice RIC-
      }
      
      // Cerca per altri campi
      return (
        (record.pc?.assetCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.technician || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [maintenanceRecords, searchTerm]);

  // Filtra Dipendenti - ottimizzato con useMemo (rimosso position non esistente)
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const searchLower = searchTerm.toLowerCase();
    return employees.filter(employee => (
      (employee.name || '').toLowerCase().includes(searchLower) ||
      (employee.email || '').toLowerCase().includes(searchLower) ||
      (employee.department || '').toLowerCase().includes(searchLower)
    ));
  }, [employees, searchTerm]);

  const handleAssetClick = (assetId: string) => {
    setLocation("/inventory");
    onClose();
  };

  const handleEmployeeClick = (employeeId: string) => {
    setLocation("/employees");
    onClose();
  };

  const handleMaintenanceClick = (recordId: string) => {
    setLocation("/maintenance");
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
          {(assetsLoading || employeesLoading || maintenanceLoading) && searchTerm.trim() ? (
            <div className="text-center py-6 text-muted-foreground">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
              <p>Caricamento...</p>
            </div>
          ) : (assetsError || employeesError || maintenanceError) && searchTerm.trim() ? (
            <div className="text-center py-6 text-red-600">
              <p className="text-sm">Errore caricamento dati</p>
              <p className="text-xs mt-1">Riprova più tardi</p>
            </div>
          ) : !searchTerm.trim() ? (
            <div className="text-center py-6 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>Inizia a digitare per cercare</p>
            </div>
          ) : (
            <>
              {/* Sezione Asset */}
              {filteredAssets.length > 0 && (
                <div className="mb-4">
                  <h3 className="flex items-center gap-2 font-semibold text-sm text-muted-foreground mb-3 border-b pb-2">
                    <Monitor className="h-4 w-4" />
                    Asset ({filteredAssets.length})
                  </h3>
                  <div className="space-y-2">
                    {filteredAssets.slice(0, 4).map((asset) => (
                      <div
                        key={asset.id}
                        onClick={() => handleAssetClick(asset.id)}
                        className="p-3 rounded-md cursor-pointer border border-transparent"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{asset.assetCode}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {asset.brand} {asset.model} • {asset.assetType.toUpperCase()}
                              {asset.serialNumber && ` • S/N: ${asset.serialNumber}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            {getStatusBadge(asset.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredAssets.length > 4 && (
                      <p className="text-xs text-muted-foreground text-center py-2 bg-gray-50 rounded">
                        +{filteredAssets.length - 4} altri asset... (vai all'inventario)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Sezione Manutenzione */}
              {filteredMaintenance.length > 0 && (
                <div className="mb-4">
                  <h3 className="flex items-center gap-2 font-semibold text-sm text-muted-foreground mb-3 border-b pb-2">
                    <Wrench className="h-4 w-4" />
                    Manutenzione ({filteredMaintenance.length})
                  </h3>
                  <div className="space-y-2">
                    {filteredMaintenance.slice(0, 3).map((record) => {
                      const interventoId = generateInterventoId(record.id);
                      return (
                        <div
                          key={record.id}
                          onClick={() => handleMaintenanceClick(record.id)}
                          className="p-3 rounded-md cursor-pointer border border-transparent"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                <span className="font-mono text-orange-600">{interventoId}</span> • {record.type}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                Asset: {record.pc?.assetCode} • Tecnico: {record.technician}
                              </p>
                              <p className="text-xs text-blue-600 truncate">{record.description}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <Badge 
                                variant={record.status === 'in_progress' ? 'default' : 'secondary'} 
                                className={`text-xs ${
                                  record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  record.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  record.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {record.status === 'pending' ? 'In Attesa' :
                                 record.status === 'in_progress' ? 'In Corso' :
                                 record.status === 'completed' ? 'Completato' : 'Annullato'}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  record.priority === 'urgent' ? 'border-red-200 text-red-700' :
                                  record.priority === 'high' ? 'border-orange-200 text-orange-700' :
                                  record.priority === 'medium' ? 'border-yellow-200 text-yellow-700' :
                                  'border-green-200 text-green-700'
                                }`}
                              >
                                {record.priority === 'urgent' ? 'Urgente' :
                                 record.priority === 'high' ? 'Alta' :
                                 record.priority === 'medium' ? 'Media' : 'Bassa'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {filteredMaintenance.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center py-2 bg-gray-50 rounded">
                        +{filteredMaintenance.length - 3} altri interventi... (vai alla manutenzione)
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
                        className="p-3 rounded-md cursor-pointer border border-transparent"
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
                                {employee.company}
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
              {filteredAssets.length === 0 && filteredEmployees.length === 0 && filteredMaintenance.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p>Nessun risultato per "{searchTerm}"</p>
                  <p className="text-sm mt-1">Prova con "Dell", "Luca", "IT", "smartphone" o "RIC-"...</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}