import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Wrench, FileText, User, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Asset, Employee } from "@shared/schema";

interface MaintenanceRecord {
  id: string;
  assetId: string;
  type: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  description: string;
  technician: string;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: string;
  completedDate?: string;
  createdAt: string;
  asset?: {
    assetCode: string;
    assetType: string;
    brand: string;
    model: string;
  };
}

interface Document {
  id: string;
  title: string;
  type: string;
  description?: string;
  fileName?: string;
  employeeId?: string;
  pcId?: string;
  uploadedAt: string;
}

// Helper function per ottenere il nome dell'employee
const getEmployeeName = (employee: Employee): string => {
  return employee.name || 'Nome non disponibile';
};

export default function AssignedDevices() {
  const [location] = useLocation();
  const search = typeof window !== 'undefined' ? window.location.search : (location.includes('?') ? location.slice(location.indexOf('?')) : '');
  const params = new URLSearchParams(search);
  const selectedEmployeeId = params.get('employeeId') || (typeof window !== 'undefined' ? sessionStorage.getItem('selectedEmployeeId') : null);

  const { data: allAssets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets/all-including-pcs"]
  });
  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"]
  });
  const { data: allMaintenance = [], isLoading: maintenanceLoading } = useQuery<MaintenanceRecord[]>({
    queryKey: ["/api/maintenance"],
    enabled: !!selectedEmployeeId
  });
  const { data: allDocuments = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    enabled: !!selectedEmployeeId
  });

  const employeeMap = new Map(employees.map(e => [e.id, e]));

  // Filtra solo asset assegnati al collaboratore selezionato
  const assignedAssets = allAssets.filter((asset) =>
    asset.employeeId && (!selectedEmployeeId || asset.employeeId === selectedEmployeeId)
  );

  // Separare Computer e altri asset
  const assignedComputers = assignedAssets.filter(asset => asset.assetType === 'computer');
  const assignedOtherAssets = assignedAssets.filter(asset => asset.assetType !== 'computer');

  // Filtra manutenzione per asset del collaboratore
  const assignedAssetIds = new Set(assignedAssets.map(a => a.id));
  const employeeMaintenance = allMaintenance.filter(m => assignedAssetIds.has(m.assetId));

  // Filtra documenti per il collaboratore o per i suoi asset
  const employeeDocuments = allDocuments.filter(doc =>
    doc.employeeId === selectedEmployeeId ||
    (doc.pcId && assignedAssets.some(a => a.assetCode === doc.pcId))
  );

  const currentEmployee = selectedEmployeeId ? employeeMap.get(selectedEmployeeId) : undefined;

  // Calcola statistiche
  const stats = {
    totalAssets: assignedAssets.length,
    computers: assignedComputers.length,
    otherAssets: assignedOtherAssets.length,
    maintenanceOpen: employeeMaintenance.filter(m => m.status === 'pending' || m.status === 'in_progress').length,
    maintenanceCompleted: employeeMaintenance.filter(m => m.status === 'completed').length,
    documents: employeeDocuments.length,
    totalCost: employeeMaintenance.reduce((sum, m) => sum + (m.actualCost || m.estimatedCost || 0), 0) / 100
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive" className="text-xs">Urgente</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800 text-xs">Alta</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Media</Badge>;
      case "low":
        return <Badge variant="outline" className="text-xs">Bassa</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800 text-xs">In Attesa</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">In Corso</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 text-xs">Completato</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="text-xs">Annullato</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profilo Collaboratore</h1>
          {currentEmployee ? (
            <p className="text-muted-foreground">
              <User className="inline h-4 w-4 mr-1" />
              <span className="font-semibold">{getEmployeeName(currentEmployee)}</span> • {currentEmployee.email} • {currentEmployee.company || 'Maori Group'}
            </p>
          ) : (
            <p className="text-muted-foreground">Visualizza tutte le informazioni associate ai collaboratori</p>
          )}
        </div>
        <Link href="/employees" className="text-sm text-blue-600 hover:underline">← Torna ai Collaboratori</Link>
      </div>

      {selectedEmployeeId && !currentEmployee && (
        <div className="text-sm text-red-600">Collaboratore non trovato.</div>
      )}

      {assetsLoading || employeesLoading ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Caricamento dati...</div>
        </div>
      ) : selectedEmployeeId && currentEmployee ? (
        <>
          {/* Statistiche */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Monitor className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Asset Totali</p>
                    <p className="text-2xl font-bold">{stats.totalAssets}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Wrench className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Manutenzione Attiva</p>
                    <p className="text-2xl font-bold">{stats.maintenanceOpen}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Documenti</p>
                    <p className="text-2xl font-bold">{stats.documents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Costi Manutenzione</p>
                    <p className="text-2xl font-bold">€{stats.totalCost.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs per organizzare le informazioni */}
          <Tabs defaultValue="assets" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="assets" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Asset ({stats.totalAssets})
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Manutenzione ({employeeMaintenance.length})
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documenti ({stats.documents})
              </TabsTrigger>
            </TabsList>

            {/* Tab Asset */}
            <TabsContent value="assets" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Computer Assegnati <Badge variant="secondary" className="ml-2">{assignedComputers.length}</Badge></CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Codice</TableHead>
                            <TableHead>Modello</TableHead>
                            <TableHead>Serial</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assignedComputers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground">Nessun computer assegnato</TableCell>
                            </TableRow>
                          ) : assignedComputers.map((computer) => (
                            <TableRow key={computer.id}>
                              <TableCell className="font-medium">{computer.assetCode}</TableCell>
                              <TableCell>{computer.brand} {computer.model}</TableCell>
                              <TableCell className="text-xs">{computer.serialNumber}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Altri Asset Assegnati <Badge variant="secondary" className="ml-2">{assignedOtherAssets.length}</Badge></CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Codice</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Modello</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assignedOtherAssets.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground">Nessun asset assegnato</TableCell>
                            </TableRow>
                          ) : assignedOtherAssets.map((asset) => (
                            <TableRow key={asset.id}>
                              <TableCell className="font-medium">{asset.assetCode}</TableCell>
                              <TableCell><Badge variant="outline">{asset.assetType}</Badge></TableCell>
                              <TableCell>{asset.brand} {asset.model}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab Manutenzione */}
            <TabsContent value="maintenance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Interventi di Manutenzione <Badge variant="secondary" className="ml-2">{employeeMaintenance.length}</Badge></CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Priorità</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>Tecnico</TableHead>
                          <TableHead>Costo</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeeMaintenance.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              Nessun intervento di manutenzione per questo collaboratore
                            </TableCell>
                          </TableRow>
                        ) : employeeMaintenance.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              <div className="font-medium text-sm">{record.asset?.assetCode || 'N/A'}</div>
                              <div className="text-xs text-muted-foreground">{record.asset?.brand} {record.asset?.model}</div>
                            </TableCell>
                            <TableCell className="text-sm">{record.type}</TableCell>
                            <TableCell>{getPriorityBadge(record.priority)}</TableCell>
                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                            <TableCell className="text-sm">{record.technician}</TableCell>
                            <TableCell className="text-sm">
                              {record.actualCost ? (
                                <span className="font-medium text-green-600">€{(record.actualCost / 100).toFixed(2)}</span>
                              ) : record.estimatedCost ? (
                                <span className="text-muted-foreground">Est. €{(record.estimatedCost / 100).toFixed(2)}</span>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-xs">
                              {record.scheduledDate && format(new Date(record.scheduledDate), "dd/MM/yy", { locale: it })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Documenti */}
            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Documenti Associati <Badge variant="secondary" className="ml-2">{employeeDocuments.length}</Badge></CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titolo</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Nome File</TableHead>
                          <TableHead>Data Upload</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeeDocuments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              Nessun documento associato a questo collaboratore
                            </TableCell>
                          </TableRow>
                        ) : employeeDocuments.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{doc.fileName || '-'}</TableCell>
                            <TableCell className="text-xs">
                              {doc.uploadedAt && format(new Date(doc.uploadedAt), "dd/MM/yyyy HH:mm", { locale: it })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Nessun collaboratore selezionato</p>
          <Link href="/employees">
            <span className="text-blue-600 hover:underline">Vai all'elenco collaboratori</span>
          </Link>
        </div>
      )}
    </div>
  );
}
