import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { 
  Plus, 
  Search, 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Calendar,
  User,
  Monitor,
  Euro,
  Filter,
  Eye,
  Edit,
  Trash2,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { PcWithEmployee } from "@shared/schema";
import { z } from "zod";

// Schema per gli interventi di manutenzione
const maintenanceSchema = z.object({
  pcId: z.string().min(1, "Seleziona un PC"),
  type: z.string().min(1, "Il tipo di intervento è obbligatorio"),
  priority: z.string().min(1, "La priorità è obbligatoria"),
  description: z.string().min(1, "La descrizione è obbligatoria"),
  technician: z.string().min(1, "Il tecnico è obbligatorio"),
  estimatedCost: z.string().optional(),
  notes: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface MaintenanceRecord {
  id: string;
  pcId: string;
  type: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  description: string;
  technician: string;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
  createdAt: string;
  scheduledDate?: string;
  completedDate?: string;
  pc?: {
    pcId: string;
    brand: string;
    model: string;
    employee?: {
      name: string;
      email: string;
    };
  };
}

export default function Maintenance() {
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Mock data - sostituire con API reali
  const { data: maintenanceRecords = [], isLoading } = useQuery<MaintenanceRecord[]>({
    queryKey: ["/api/maintenance"],
    queryFn: async () => {
      return [
        {
          id: "1",
          pcId: "49a472d5-0d12-47c4-954b-6c0a811696e3",
          type: "Sostituzione RAM",
          priority: "high",
          status: "in_progress",
          description: "Aggiornamento RAM da 8GB a 16GB per migliorare le prestazioni",
          technician: "Marco Bianchi",
          estimatedCost: 120,
          actualCost: 115,
          notes: "RAM Kingston DDR4-3200 16GB",
          createdAt: "2025-08-25T09:00:00Z",
          scheduledDate: "2025-08-30T14:00:00Z",
          pc: {
            pcId: "PC-001",
            brand: "Dell",
            model: "OptiPlex 7090",
            employee: { name: "Luca Rossi", email: "luca.rossi@maorigroup.com" }
          }
        },
        {
          id: "2",
          pcId: "pc-002",
          type: "Pulizia Sistema",
          priority: "medium",
          status: "completed",
          description: "Pulizia completa sistema operativo e rimozione malware",
          technician: "Sara Verdi",
          estimatedCost: 50,
          actualCost: 45,
          createdAt: "2025-08-20T10:30:00Z",
          scheduledDate: "2025-08-22T09:00:00Z",
          completedDate: "2025-08-22T11:30:00Z",
          pc: {
            pcId: "PC-002",
            brand: "HP",
            model: "EliteDesk 800"
          }
        },
        {
          id: "3",
          pcId: "49a472d5-0d12-47c4-954b-6c0a811696e3",
          type: "Sostituzione SSD",
          priority: "urgent",
          status: "pending",
          description: "SSD principale danneggiato, necessaria sostituzione immediata",
          technician: "Andrea Neri",
          estimatedCost: 200,
          createdAt: "2025-08-28T16:00:00Z",
          scheduledDate: "2025-08-31T08:00:00Z",
          pc: {
            pcId: "PC-001",
            brand: "Dell",
            model: "OptiPlex 7090",
            employee: { name: "Luca Rossi", email: "luca.rossi@maorigroup.com" }
          }
        }
      ];
    }
  });

  const { data: pcs = [] } = useQuery<PcWithEmployee[]>({
    queryKey: ["/api/pcs"]
  });

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      pcId: "",
      type: "",
      priority: "",
      description: "",
      technician: "",
      estimatedCost: "",
      notes: ""
    }
  });

  // Filtri interventi
  const filteredRecords = useMemo(() => {
    return maintenanceRecords.filter((record) => {
      // Filtro ricerca
      if (debouncedSearch.trim()) {
        const searchLower = debouncedSearch.toLowerCase();
        const matches = (
          (record.type || '').toLowerCase().includes(searchLower) ||
          (record.description || '').toLowerCase().includes(searchLower) ||
          (record.technician || '').toLowerCase().includes(searchLower) ||
          (record.pc?.pcId || '').toLowerCase().includes(searchLower) ||
          (record.pc?.employee?.name || '').toLowerCase().includes(searchLower)
        );
        if (!matches) return false;
      }

      // Filtro stato
      if (statusFilter && record.status !== statusFilter) {
        return false;
      }

      // Filtro priorità
      if (priorityFilter && record.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [maintenanceRecords, debouncedSearch, statusFilter, priorityFilter]);

  // Statistiche
  const totalRecords = maintenanceRecords.length;
  const pendingRecords = maintenanceRecords.filter(r => r.status === 'pending').length;
  const inProgressRecords = maintenanceRecords.filter(r => r.status === 'in_progress').length;
  const completedRecords = maintenanceRecords.filter(r => r.status === 'completed').length;
  const totalCost = maintenanceRecords
    .filter(r => r.actualCost || r.estimatedCost)
    .reduce((sum, r) => sum + (r.actualCost || r.estimatedCost || 0), 0);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive" className="text-xs">Urgente</Badge>;
      case "high":
        return <Badge variant="default" className="bg-orange-100 text-orange-800 text-xs">Alta</Badge>;
      case "medium":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">Media</Badge>;
      case "low":
        return <Badge variant="outline" className="text-xs">Bassa</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">In Attesa</Badge>;
      case "in_progress":
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 text-xs">In Corso</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">Completato</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="text-xs">Annullato</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const onSubmit = (data: MaintenanceFormData) => {
    console.log("Intervento da creare:", data);
    toast({
      title: "Intervento programmato",
      description: "L'intervento di manutenzione è stato aggiunto al sistema."
    });
    setShowMaintenanceForm(false);
    form.reset();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Centro Manutenzione</h1>
          <p className="text-muted-foreground">Gestione interventi e manutenzione PC - {totalRecords} interventi totali</p>
        </div>
        <Dialog open={showMaintenanceForm} onOpenChange={setShowMaintenanceForm}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Nuovo Intervento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Programma Nuovo Intervento</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pcId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PC</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Seleziona PC</option>
                            {pcs.map(pc => (
                              <option key={pc.id} value={pc.id}>
                                {pc.pcId} - {pc.brand} {pc.model}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo Intervento</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Seleziona tipo</option>
                            <option value="Sostituzione Hardware">Sostituzione Hardware</option>
                            <option value="Aggiornamento Software">Aggiornamento Software</option>
                            <option value="Pulizia Sistema">Pulizia Sistema</option>
                            <option value="Riparazione">Riparazione</option>
                            <option value="Installazione">Installazione</option>
                            <option value="Diagnosi">Diagnosi</option>
                            <option value="Manutenzione Preventiva">Manutenzione Preventiva</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priorità</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Seleziona priorità</option>
                            <option value="low">Bassa</option>
                            <option value="medium">Media</option>
                            <option value="high">Alta</option>
                            <option value="urgent">Urgente</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="technician"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tecnico Assegnato</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome del tecnico" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrizione Intervento</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descrivi dettagliatamente l'intervento da eseguire" 
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="estimatedCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costo Stimato (€)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-end">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Note Aggiuntive</FormLabel>
                          <FormControl>
                            <Input placeholder="Note opzionali" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMaintenanceForm(false)}
                  >
                    Annulla
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90">
                    Programma Intervento
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Totali</p>
                <p className="text-2xl font-bold">{totalRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Attesa</p>
                <p className="text-2xl font-bold">{pendingRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Wrench className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Corso</p>
                <p className="text-2xl font-bold">{inProgressRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completati</p>
                <p className="text-2xl font-bold">{completedRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Euro className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Costi Totali</p>
                <p className="text-2xl font-bold">€{totalCost}</p>
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
                placeholder="Cerca interventi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Tutti gli stati</option>
              <option value="pending">In Attesa</option>
              <option value="in_progress">In Corso</option>
              <option value="completed">Completato</option>
              <option value="cancelled">Annullato</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Tutte le priorità</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Bassa</option>
            </select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setPriorityFilter("");
              }}
              className="flex items-center gap-2"
            >
              Reset Filtri
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabella Interventi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Interventi di Manutenzione ({filteredRecords.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium min-w-[150px]">PC</TableHead>
                  <TableHead className="font-medium min-w-[120px]">Tipo</TableHead>
                  <TableHead className="font-medium min-w-[100px]">Priorità</TableHead>
                  <TableHead className="font-medium min-w-[100px]">Stato</TableHead>
                  <TableHead className="font-medium min-w-[120px]">Tecnico</TableHead>
                  <TableHead className="font-medium min-w-[100px]">Costo</TableHead>
                  <TableHead className="font-medium min-w-[120px]">Data</TableHead>
                  <TableHead className="min-w-[120px]">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(8)].map((_, j) => (
                        <TableCell key={j} className="animate-pulse">
                          <div className="h-4 bg-muted rounded w-20"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{record.pc?.pcId}</p>
                          <p className="text-sm text-muted-foreground">
                            {record.pc?.brand} {record.pc?.model}
                          </p>
                          {record.pc?.employee && (
                            <p className="text-xs text-blue-600">
                              {record.pc.employee.name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{record.type}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {record.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(record.priority)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.technician}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          {record.actualCost && (
                            <p className="font-medium">€{record.actualCost}</p>
                          )}
                          {record.estimatedCost && (
                            <p className="text-muted-foreground text-xs">
                              Est. €{record.estimatedCost}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          {record.scheduledDate && (
                            <p className="font-medium">
                              {format(new Date(record.scheduledDate), "dd/MM/yyyy", { locale: it })}
                            </p>
                          )}
                          {record.completedDate && (
                            <p className="text-xs text-green-600">
                              Completato: {format(new Date(record.completedDate), "dd/MM", { locale: it })}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Visualizza"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Modifica"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            title="Elimina"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Wrench className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          {searchTerm || statusFilter || priorityFilter 
                            ? "Nessun intervento trovato con i filtri applicati" 
                            : "Nessun intervento di manutenzione presente"
                          }
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}