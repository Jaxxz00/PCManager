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
        return <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">📅 Programmato</Badge>;
      case "in_progress":
        return <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">⚡ In Corso</Badge>;
      case "completed":
        return <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white">✅ Completato</Badge>;
      case "cancelled":
        return <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white">❌ Annullato</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return <Badge className="bg-gradient-to-r from-gray-400 to-gray-500 text-white">😌 Bassa</Badge>;
      case "medium":
        return <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">🟡 Media</Badge>;
      case "high":
        return <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">🔥 Alta</Badge>;
      case "critical":
        return <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse">🚨 CRITICA</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "preventive": return "🔧 Preventiva";
      case "corrective": return "🚑 Correttiva";
      case "upgrade": return "🚀 Upgrade";
      case "cleaning": return "🧹 Pulizia";
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-500" />
            Centro Manutenzione
            <Heart className="h-6 w-6 text-pink-500" />
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">🔧 Gestione divertente degli interventi PC! ✨</p>
        </div>
        <Dialog open={showMaintenanceForm} onOpenChange={setShowMaintenanceForm}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <Zap className="mr-2 h-5 w-5" />
              🚀 Nuovo Intervento
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona PC..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {pcs.map((pc) => (
                              <SelectItem key={pc.id} value={pc.id}>
                                {pc.pcId} - {pc.brand} {pc.model}
                                {pc.employee?.name && ` (${pc.employee.name})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="preventive">Manutenzione Preventiva</SelectItem>
                            <SelectItem value="corrective">Manutenzione Correttiva</SelectItem>
                            <SelectItem value="upgrade">Upgrade Hardware</SelectItem>
                            <SelectItem value="cleaning">Pulizia Sistema</SelectItem>
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

      {/* Statistiche Manutenzione - Design Colorato */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-950 dark:to-blue-900 border-indigo-200 dark:border-indigo-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-500 rounded-full">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">🔧 Totale</p>
                <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{maintenanceStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950 dark:to-cyan-900 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-500 rounded-full">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">📅 Programmati</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{maintenanceStats.scheduled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-yellow-100 dark:from-orange-950 dark:to-yellow-900 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-500 rounded-full">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">⏰ In Corso</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{maintenanceStats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-500 rounded-full">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">✅ Completati</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{maintenanceStats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-950 dark:to-pink-900 border-red-200 dark:border-red-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-red-500 rounded-full">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">🚨 Priorità Alta</p>
                <p className="text-3xl font-bold text-red-900 dark:text-red-100">{maintenanceStats.highPriority}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtri Colorati */}
      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 border-violet-200 dark:border-violet-800">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold text-purple-700 dark:text-purple-300">🎯 Filtri Ricerca</h3>
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
            <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
              <Download className="mr-2 h-4 w-4" />
              📊 Esporta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabella Interventi Colorata */}
      <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950 dark:to-gray-950 border-slate-200 dark:border-slate-800">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center text-xl">
            <Star className="mr-3 h-6 w-6 text-yellow-300" />
            🎉 Lista Interventi Manutenzione ({filteredRecords.length})
            <Sparkles className="ml-3 h-5 w-5 text-yellow-300" />
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
                <TableHead className="min-w-[100px]">Priorità</TableHead>
                <TableHead className="min-w-[140px]">Data</TableHead>
                <TableHead className="min-w-[120px]">Tecnico</TableHead>
                <TableHead className="min-w-[80px]">Costo</TableHead>
                <TableHead className="min-w-[100px]">Azioni</TableHead>
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
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
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
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => {
                              toast({
                                title: "Dettagli intervento",
                                description: `Visualizzazione dettagli per ${record.pc?.pcId}`,
                              });
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            👁️ Visualizza
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
                            ✏️ Modifica
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
                            🗑️ Elimina
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
                      <div className="p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-full">
                        <Wrench className="h-16 w-16 text-indigo-500" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-bold text-foreground">🤔 Nessun intervento trovato!</p>
                        <p className="text-muted-foreground">
                          {mockMaintenanceRecords.length === 0 
                            ? "🎯 Inizia programmando il primo intervento di manutenzione!"
                            : "🔍 Prova a modificare i filtri di ricerca"
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