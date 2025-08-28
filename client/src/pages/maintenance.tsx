import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Wrench, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Monitor,
  User,
  Filter,
  Search,
  Download,
  Sparkles,
  Zap,
  Heart,
  Star,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { PcWithEmployee } from "@shared/schema";

// Schema per intervento manutenzione
const maintenanceSchema = z.object({
  pcId: z.string().min(1, "Seleziona un PC"),
  type: z.enum(['preventive', 'corrective', 'upgrade', 'cleaning']),
  description: z.string().min(10, "Descrizione minima 10 caratteri"),
  scheduledDate: z.string().min(1, "Data richiesta"),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  estimatedDuration: z.number().min(1, "Durata minima 1 ora"),
  technician: z.string().min(1, "Nome tecnico richiesto"),
  cost: z.number().min(0, "Costo deve essere positivo").optional(),
  notes: z.string().optional()
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface MaintenanceRecord {
  id: string;
  pcId: string;
  pc?: { pcId: string; brand: string; model: string; employee?: { name: string } };
  type: 'preventive' | 'corrective' | 'upgrade' | 'cleaning';
  description: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  completedDate?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number;
  actualDuration?: number;
  technician: string;
  cost?: number;
  notes?: string;
  createdAt: string;
}

export default function Maintenance() {
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pcs = [], isLoading: pcsLoading } = useQuery<PcWithEmployee[]>({
    queryKey: ["/api/pcs"],
  });

  // Mock data per ora - in futuro collegare al database
  const mockMaintenanceRecords: MaintenanceRecord[] = [
    {
      id: "1",
      pcId: "PC-001",
      pc: { pcId: "PC-001", brand: "Dell", model: "OptiPlex 7090", employee: { name: "Mario Rossi" } },
      type: "preventive",
      description: "Manutenzione preventiva trimestrale - pulizia interna e aggiornamento software",
      status: "scheduled",
      scheduledDate: "2025-08-25",
      priority: "medium",
      estimatedDuration: 2,
      technician: "Luca Bianchi",
      cost: 50,
      notes: "Controllare anche ventole CPU",
      createdAt: "2025-08-19"
    },
    {
      id: "2", 
      pcId: "PC-002",
      pc: { pcId: "PC-002", brand: "HP", model: "EliteDesk 800", employee: { name: "Anna Verdi" } },
      type: "corrective",
      description: "Sostituzione disco rigido danneggiato",
      status: "in_progress",
      scheduledDate: "2025-08-20",
      priority: "high",
      estimatedDuration: 3,
      actualDuration: 2,
      technician: "Marco Ferrari",
      cost: 120,
      createdAt: "2025-08-18"
    },
    {
      id: "3",
      pcId: "PC-001",
      pc: { pcId: "PC-001", brand: "Dell", model: "OptiPlex 7090", employee: { name: "Mario Rossi" } },
      type: "upgrade",
      description: "Upgrade RAM da 8GB a 16GB",
      status: "completed",
      scheduledDate: "2025-08-15",
      completedDate: "2025-08-15",
      priority: "low",
      estimatedDuration: 1,
      actualDuration: 1,
      technician: "Luca Bianchi",
      cost: 80,
      createdAt: "2025-08-10"
    }
  ];

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      pcId: "",
      type: "preventive",
      description: "",
      scheduledDate: "",
      priority: "medium",
      estimatedDuration: 2,
      technician: "",
      cost: 0,
      notes: ""
    },
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: async (data: MaintenanceFormData) => {
      // TODO: Implementare API endpoint per manutenzione
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simula API call
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Intervento programmato",
        description: "L'intervento di manutenzione è stato aggiunto con successo.",
      });
      form.reset();
      setShowMaintenanceForm(false);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile programmare l'intervento.",
        variant: "destructive",
      });
    },
  });

  const filteredRecords = useMemo(() => {
    return mockMaintenanceRecords.filter((record) => {
      const matchesSearch = searchTerm === "" || 
        record.pc?.pcId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.technician.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || record.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || record.priority === priorityFilter;
      const matchesType = typeFilter === "all" || record.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    });
  }, [searchTerm, statusFilter, priorityFilter, typeFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Programmato</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">In Corso</Badge>;
      case "completed":
        return <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Completato</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Annullato</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return <Badge variant="secondary">Bassa</Badge>;
      case "medium":
        return <Badge variant="outline" className="border-blue-200 text-blue-700">Media</Badge>;
      case "high":
        return <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">Alta</Badge>;
      case "critical":
        return <Badge variant="destructive">Critica</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "preventive": return "Preventiva";
      case "corrective": return "Correttiva";
      case "upgrade": return "Upgrade";
      case "cleaning": return "Pulizia";
      default: return type;
    }
  };

  const onSubmit = (data: MaintenanceFormData) => {
    createMaintenanceMutation.mutate(data);
  };

  // Statistiche manutenzione
  const maintenanceStats = {
    total: mockMaintenanceRecords.length,
    scheduled: mockMaintenanceRecords.filter(r => r.status === 'scheduled').length,
    inProgress: mockMaintenanceRecords.filter(r => r.status === 'in_progress').length,
    completed: mockMaintenanceRecords.filter(r => r.status === 'completed').length,
    highPriority: mockMaintenanceRecords.filter(r => r.priority === 'high' || r.priority === 'critical').length
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-900 rounded-xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
            <Wrench className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Centro Manutenzione Avanzato</h1>
            <p className="text-blue-100 text-lg">Gestione completa interventi hardware e software Maori Group</p>
            <div className="flex items-center gap-6 mt-2 text-sm text-blue-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Manutenzione preventiva</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Riparazioni rapide</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span>Upgrade hardware</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900">Gestione Interventi</h2>
          <p className="text-blue-700">Pianifica e monitora tutte le attività di manutenzione</p>
        </div>
        <Dialog open={showMaintenanceForm} onOpenChange={setShowMaintenanceForm}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Nuovo Intervento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Programma Nuovo Intervento</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pcId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PC da Mantenere</FormLabel>
                        <div className="space-y-2">
                          <select
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm cursor-pointer appearance-none pr-10"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                              backgroundPosition: 'right 8px center',
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: '16px'
                            }}
                          >
                            <option value="" disabled>Seleziona PC...</option>
                            {pcs.map((pc) => (
                              <option key={pc.id} value={pc.id}>
                                {pc.pcId} - {pc.brand} {pc.model}
                                {pc.employee?.name && ` (${pc.employee.name})`}
                              </option>
                            ))}
                          </select>
                        </div>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleziona tipo intervento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent 
                            className="z-[100] bg-white border border-gray-200 shadow-lg rounded-md"
                            position="popper"
                            sideOffset={4}
                          >
                            <SelectItem value="preventive" className="cursor-pointer hover:bg-gray-100">
                              Manutenzione Preventiva
                            </SelectItem>
                            <SelectItem value="corrective" className="cursor-pointer hover:bg-gray-100">
                              Manutenzione Correttiva
                            </SelectItem>
                            <SelectItem value="upgrade" className="cursor-pointer hover:bg-gray-100">
                              Upgrade Hardware
                            </SelectItem>
                            <SelectItem value="cleaning" className="cursor-pointer hover:bg-gray-100">
                              Pulizia Sistema
                            </SelectItem>
                          </SelectContent>
                        </Select>
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
                          placeholder="Descrivi dettagliatamente l'intervento da eseguire..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Programmata</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priorità</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Bassa</SelectItem>
                            <SelectItem value="medium">Media</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="critical">Critica</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimatedDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durata Stimata (ore)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            {...field} 
                            onChange={e => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="technician"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tecnico Responsabile</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome tecnico..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costo Stimato (€)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01"
                            placeholder="0.00"
                            {...field} 
                            onChange={e => field.onChange(Number(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note Aggiuntive</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Note opzionali..." 
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMaintenanceForm(false)}
                  >
                    Annulla
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMaintenanceMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {createMaintenanceMutation.isPending ? "Programmazione..." : "Programma Intervento"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiche Manutenzione */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Wrench className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totale Interventi</p>
                <p className="text-2xl font-semibold">{maintenanceStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Programmati</p>
                <p className="text-2xl font-semibold text-blue-600">{maintenanceStats.scheduled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Corso</p>
                <p className="text-2xl font-semibold text-orange-600">{maintenanceStats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completati</p>
                <p className="text-2xl font-semibold text-green-600">{maintenanceStats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priorità Alta</p>
                <p className="text-2xl font-semibold text-red-600">{maintenanceStats.highPriority}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtri */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">Filtri di Ricerca</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cerca interventi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tutti gli stati" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="scheduled">Programmato</SelectItem>
                <SelectItem value="in_progress">In Corso</SelectItem>
                <SelectItem value="completed">Completato</SelectItem>
                <SelectItem value="cancelled">Annullato</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tutte le priorità" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le priorità</SelectItem>
                <SelectItem value="low">Bassa</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Critica</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tutti i tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                <SelectItem value="preventive">Preventiva</SelectItem>
                <SelectItem value="corrective">Correttiva</SelectItem>
                <SelectItem value="upgrade">Upgrade</SelectItem>
                <SelectItem value="cleaning">Pulizia</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Esporta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabella Interventi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wrench className="mr-2 h-5 w-5" />
            Interventi di Manutenzione ({filteredRecords.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">PC</TableHead>
                <TableHead className="min-w-[120px]">Tipo</TableHead>
                <TableHead className="min-w-[200px]">Descrizione</TableHead>
                <TableHead className="min-w-[120px]">Stato</TableHead>
                <TableHead className="min-w-[120px]">Priorità</TableHead>
                <TableHead className="min-w-[140px]">Data</TableHead>
                <TableHead className="min-w-[120px]">Tecnico</TableHead>
                <TableHead className="min-w-[100px]">Costo</TableHead>
                <TableHead className="min-w-[120px]">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{record.pc?.pcId}</p>
                          <p className="text-sm text-muted-foreground">
                            {record.pc?.brand} {record.pc?.model}
                          </p>
                          {record.pc?.employee && (
                            <p className="text-xs text-muted-foreground flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {record.pc.employee.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
                        {getTypeLabel(record.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm truncate" title={record.description}>
                          {record.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(record.status)}
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(record.priority)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(record.scheduledDate).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{record.technician}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.cost ? (
                        <span className="font-semibold text-green-600">€{record.cost.toFixed(2)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="dropdown-menu-enhanced">
                          <DropdownMenuItem 
                            onClick={() => {
                              toast({
                                title: "Dettagli intervento",
                                description: `Visualizzazione dettagli per ${record.pc?.pcId}`,
                              });
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizza
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              toast({
                                title: "Modifica intervento",
                                description: "Funzione in sviluppo",
                              });
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Modifica
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              toast({
                                title: "Elimina intervento",
                                description: "Funzione in sviluppo",
                                variant: "destructive"
                              });
                            }}
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
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                        <Wrench className="h-12 w-12 text-slate-400" />
                      </div>
                      <div className="space-y-2 text-center">
                        <p className="text-lg font-medium">Nessun intervento trovato</p>
                        <p className="text-muted-foreground">
                          {mockMaintenanceRecords.length === 0 
                            ? "Inizia programmando il primo intervento di manutenzione"
                            : "Prova a modificare i filtri di ricerca"
                          }
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}