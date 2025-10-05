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
  Settings,
  FileText,
  Download,
  FileDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Asset } from "@shared/schema";
import { z } from "zod";
import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";

// Schema per intervento
const maintenanceSchema = z.object({
  assetId: z.string().min(1, "Seleziona un asset"),
  type: z.string().min(1, "Il tipo di intervento è obbligatorio"),
  priority: z.string().min(1, "La priorità è obbligatoria"),
  description: z.string().min(1, "La descrizione è obbligatoria"),
  technician: z.string().min(1, "Il tecnico è obbligatorio"),
  scheduledDate: z.string().optional(),
  estimatedCost: z.string().optional(),
  notes: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

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
  notes?: string;
  createdAt: string;
  scheduledDate?: string;
  completedDate?: string;
  asset?: {
    assetCode: string;
    assetType: string;
    brand: string;
    model: string;
    employeeId?: string | null;
    employee?: {
      name: string;
      email: string;
    };
  };
}

export default function Maintenance() {
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<MaintenanceRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch maintenance records from API
  const { data: maintenanceRecords = [], isLoading } = useQuery<MaintenanceRecord[]>({
    queryKey: ["/api/maintenance"],
  });

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets"]
  });

  // Delete maintenance mutation
  const deleteMaintenanceMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/maintenance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      toast({
        title: "Successo",
        description: "Intervento eliminato con successo",
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Impossibile eliminare l'intervento";
      toast({
        title: "Errore",
        description: message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      assetId: "",
      type: "",
      priority: "",
      description: "",
      technician: "",
      scheduledDate: "",
      estimatedCost: "",
      notes: ""
    }
  });

  // Filtri
  const filteredRecords = useMemo(() => {
    return maintenanceRecords.filter((record) => {
      if (debouncedSearch.trim()) {
        const searchLower = debouncedSearch.toLowerCase();
        const matches = (
          (record.type || '').toLowerCase().includes(searchLower) ||
          (record.description || '').toLowerCase().includes(searchLower) ||
          (record.technician || '').toLowerCase().includes(searchLower) ||
          (record.asset?.assetCode || '').toLowerCase().includes(searchLower) ||
          (record.asset?.employee?.name || '').toLowerCase().includes(searchLower)
        );
        if (!matches) return false;
      }

      if (statusFilter && record.status !== statusFilter) {
        return false;
      }

      if (priorityFilter && record.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [maintenanceRecords, debouncedSearch, statusFilter, priorityFilter]);

  // Statistiche
  const stats = useMemo(() => {
    const total = maintenanceRecords.length;
    const pending = maintenanceRecords.filter(r => r.status === 'pending').length;
    const inProgress = maintenanceRecords.filter(r => r.status === 'in_progress').length;
    const completed = maintenanceRecords.filter(r => r.status === 'completed').length;
    const totalCost = maintenanceRecords
      .filter(r => r.actualCost || r.estimatedCost)
      .reduce((sum, r) => sum + (r.actualCost || r.estimatedCost || 0), 0);
    
    return { total, pending, inProgress, completed, totalCost };
  }, [maintenanceRecords]);

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

  const onSubmit = (data: MaintenanceFormData) => {
    toast({
      title: "Intervento programmato",
      description: "L'intervento di manutenzione è stato aggiunto con successo."
    });
    setShowMaintenanceDialog(false);
    form.reset();
  };

  const generateMaintenancePDF = (record: MaintenanceRecord) => {
    const pdf = new jsPDF();
    
    // ID Intervento con timestamp
    const currentDate = new Date();
    const timestamp = format(currentDate, "yyyyMMddHHmm");
    const interventoId = `RIC-${timestamp.slice(2)}`; // RIC-25083110xx
    
    // Header compatto
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("MAORI GROUP", 20, 20);
    
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text("Richiesta Intervento Manutenzione", 20, 28);
    
    // Linea header
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(50, 50, 50);
    pdf.line(20, 32, 190, 32);
    
    // Codice a barre compatto
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 120;
    
    JsBarcode(canvas, interventoId, {
      format: "CODE128",
      width: 3,
      height: 70,
      displayValue: true,
      fontSize: 14,
      textAlign: "center",
      textMargin: 6,
      background: "#ffffff",
      lineColor: "#000000"
    });
    
    const barcodeDataURL = canvas.toDataURL('image/png', 1.0);
    
    // Codice a barre centrato e più piccolo
    pdf.addImage(barcodeDataURL, 'PNG', 65, 38, 80, 25);
    
    // Tabella informazioni principali - più compatta
    let yStart = 72;
    
    // Bordo tabella principale
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(100, 100, 100);
    pdf.rect(20, yStart, 170, 65, 'S');
    
    // Divisori tabella
    pdf.line(20, yStart + 16, 190, yStart + 16); // Header divisore
    pdf.line(105, yStart, 105, yStart + 65); // Divisore verticale
    
    // Headers tabella
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("DETTAGLI PC", 22, yStart + 12);
    pdf.text("DETTAGLI INTERVENTO", 107, yStart + 12);
    
    // Contenuto sinistro - PC
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    let yLeft = yStart + 24;
    
    pdf.text("ID:", 22, yLeft);
    pdf.setFont("helvetica", "normal");
    pdf.text(record.asset?.assetCode || 'N/A', 32, yLeft);
    
    yLeft += 7;
    pdf.setFont("helvetica", "bold");
    pdf.text("Marca:", 22, yLeft);
    pdf.setFont("helvetica", "normal");
    const brandModel = `${record.asset?.brand || ''} ${record.asset?.model || ''}`;
    pdf.text(brandModel.length > 18 ? brandModel.substring(0, 18) + '...' : brandModel, 32, yLeft);
    
    yLeft += 7;
    pdf.setFont("helvetica", "bold");
    pdf.text("Utente:", 22, yLeft);
    pdf.setFont("helvetica", "normal");
    const userName = record.asset?.employee?.name || 'Non Assegnato';
    pdf.text(userName.length > 18 ? userName.substring(0, 18) + '...' : userName, 32, yLeft);
    
    // Contenuto destro - Intervento con spaziatura corretta
    pdf.setFont("helvetica", "bold");
    let yRight = yStart + 24;
    
    pdf.text("Tipo:", 107, yRight);
    pdf.setFont("helvetica", "normal");
    pdf.text(record.type.length > 22 ? record.type.substring(0, 22) + '...' : record.type, 123, yRight);
    
    yRight += 8;
    pdf.setFont("helvetica", "bold");
    pdf.text("Priorità:", 107, yRight);
    pdf.setFont("helvetica", "normal");
    const priorityText = {
      'urgent': 'URGENTE',
      'high': 'ALTA',
      'medium': 'MEDIA',
      'low': 'BASSA'
    }[record.priority] || record.priority.toUpperCase();
    pdf.text(priorityText, 123, yRight);
    
    yRight += 8;
    pdf.setFont("helvetica", "bold");
    pdf.text("Stato:", 107, yRight);
    pdf.setFont("helvetica", "normal");
    const statusText = {
      'pending': 'IN ATTESA',
      'in_progress': 'IN CORSO',
      'completed': 'COMPLETATO',
      'cancelled': 'ANNULLATO'
    }[record.status] || record.status.toUpperCase();
    pdf.text(statusText, 123, yRight);
    
    yRight += 8;
    pdf.setFont("helvetica", "bold");
    pdf.text("Tecnico:", 107, yRight);
    pdf.setFont("helvetica", "normal");
    pdf.text(record.technician.length > 15 ? record.technician.substring(0, 15) + '...' : record.technician, 123, yRight);
    
    // Informazioni aggiuntive sotto la tabella - compatte
    let yExtra = yStart + 72;
    
    // Data e costo su una riga
    if (record.scheduledDate || record.estimatedCost || record.actualCost) {
      pdf.setFontSize(9);
      if (record.scheduledDate) {
        pdf.setFont("helvetica", "bold");
        pdf.text("Data:", 20, yExtra);
        pdf.setFont("helvetica", "normal");
        pdf.text(format(new Date(record.scheduledDate), "dd/MM/yyyy HH:mm", { locale: it }), 35, yExtra);
      }
      
      if (record.estimatedCost || record.actualCost) {
        pdf.setFont("helvetica", "bold");
        pdf.text("Costo:", 105, yExtra);
        pdf.setFont("helvetica", "normal");
        const cost = record.actualCost || record.estimatedCost;
        pdf.text(`€${cost} ${record.actualCost ? '(eff.)' : '(stim.)'}`, 120, yExtra);
      }
      yExtra += 10;
    }
    
    // Descrizione compatta
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("DESCRIZIONE:", 20, yExtra);
    
    yExtra += 3;
    pdf.setLineWidth(0.5);
    pdf.rect(20, yExtra, 170, 22, 'S');
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    const descriptionLines = pdf.splitTextToSize(record.description, 165);
    pdf.text(descriptionLines, 22, yExtra + 6);
    
    yExtra += 27;
    
    // Note compatte - sempre in una pagina
    if (record.notes) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("NOTE:", 20, yExtra);
      
      yExtra += 3;
      
      // Altezza fissa per note
      const notesHeight = 18;
      pdf.rect(20, yExtra, 170, notesHeight, 'S');
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      const notesLines = pdf.splitTextToSize(record.notes, 165);
      // Limita le note a quello che entra nello spazio
      const maxLines = Math.floor(notesHeight / 3) - 1;
      const displayLines = notesLines.slice(0, maxLines);
      pdf.text(displayLines, 22, yExtra + 6);
      
      yExtra += notesHeight + 5;
    }
    
    // Footer compatto
    pdf.setLineWidth(0.5);
    pdf.line(20, 270, 190, 270);
    
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Generato: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: it })}`, 20, 276);
    pdf.text(`ID: ${interventoId}`, 20, 282);
    pdf.text("MAORI GROUP - Sistema PC", 120, 276);
    
    // Download del PDF
    pdf.save(`Richiesta_${interventoId}.pdf`);
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Asset", "Tipo Asset", "Tipo Intervento", "Priorità", "Stato", "Tecnico", "Costo", "Data Programmata", "Descrizione"],
      ...filteredRecords.map(record => [
        record.asset?.assetCode || '',
        record.asset?.assetType || '',
        record.type,
        record.priority,
        record.status,
        record.technician,
        record.actualCost || record.estimatedCost || '0',
        record.scheduledDate ? format(new Date(record.scheduledDate), "dd/MM/yyyy") : '',
        record.description
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `manutenzione-${format(new Date(), "dd-MM-yyyy")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Centro Manutenzione</h1>
          <p className="text-muted-foreground">
            Gestione completa interventi di manutenzione - {stats.total} interventi registrati
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={exportToCSV}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Esporta CSV
          </Button>
          <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 text-white flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuovo Intervento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Programma Nuovo Intervento di Manutenzione</DialogTitle>
                <DialogDescription>
                  Compila i campi sottostanti per programmare un nuovo intervento di manutenzione per un PC aziendale
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="assetId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asset da Manutenere</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="">Seleziona Asset</option>
                              {assets.map(asset => (
                                <option key={asset.id} value={asset.id}>
                                  {asset.assetCode} - {asset.brand} {asset.model} ({asset.assetType})
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
                              <option value="Installazione">Installazione</option>
                              <option value="Diagnosi">Diagnosi</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
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
                    <FormField
                      control={form.control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Programmata</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
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
                        <FormLabel>Descrizione Dettagliata Intervento</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descrivi in dettaglio l'intervento da eseguire, componenti coinvolti, procedure da seguire..." 
                            className="min-h-[100px]"
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
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note Aggiuntive</FormLabel>
                          <FormControl>
                            <Input placeholder="Note specifiche, contatti, orari..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowMaintenanceDialog(false)}
                    >
                      Annulla
                    </Button>
                    <Button type="submit" className="bg-blue-600 text-white">
                      Programma Intervento
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiche Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Totali</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Attesa</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Wrench className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Corso</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completati</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Euro className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Costi</p>
                <p className="text-2xl font-bold">€{stats.totalCost}</p>
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
            Ricerca e Filtri Avanzati
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per PC, tecnico, tipo intervento..."
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

      {/* Sezioni Principali con Tab */}
      <Tabs defaultValue="maintenance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Manutenzione
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Storico Asset
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="space-y-4">
          {/* Tabella Interventi */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center justify-between">
                <span>Interventi di Manutenzione ({filteredRecords.length})</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Costo totale filtrati: €{filteredRecords.reduce((sum, r) => sum + (r.actualCost || r.estimatedCost || 0), 0)}
                </span>
              </CardTitle>
            </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium w-[180px]">Asset e Dipendente</TableHead>
                  <TableHead className="font-medium w-[150px]">Tipo Intervento</TableHead>
                  <TableHead className="font-medium w-[120px]">Priorità</TableHead>
                  <TableHead className="font-medium w-[120px]">Stato</TableHead>
                  <TableHead className="font-medium w-[130px]">Tecnico</TableHead>
                  <TableHead className="font-medium w-[100px]">Costi</TableHead>
                  <TableHead className="font-medium w-[120px]">Date</TableHead>
                  <TableHead className="w-[140px]">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(8)].map((_, j) => (
                        <TableCell key={j} className="animate-pulse">
                          <div className="h-4 bg-muted rounded w-24"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id} className="">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{record.asset?.assetCode}</p>
                          <p className="text-xs text-muted-foreground">
                            {record.asset?.brand} {record.asset?.model}
                          </p>
                          {record.asset?.employee && (
                            <p className="text-xs text-blue-600 font-medium">
                              {record.asset.employee.name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{record.type}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[140px]" title={record.description}>
                            {record.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(record.priority)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {record.technician}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          {record.actualCost && (
                            <p className="font-medium text-green-600">€{record.actualCost}</p>
                          )}
                          {record.estimatedCost && !record.actualCost && (
                            <p className="text-muted-foreground">Est. €{record.estimatedCost}</p>
                          )}
                          {record.estimatedCost && record.actualCost && (
                            <p className="text-xs text-muted-foreground">
                              Est. €{record.estimatedCost}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          {record.scheduledDate && (
                            <p className="font-medium text-xs">
                              {format(new Date(record.scheduledDate), "dd/MM/yy HH:mm", { locale: it })}
                            </p>
                          )}
                          {record.completedDate && (
                            <p className="text-xs text-green-600">
                              ✓ {format(new Date(record.completedDate), "dd/MM/yy", { locale: it })}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setViewingRecord(record)}
                            title="Visualizza dettagli"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600"
                            onClick={() => generateMaintenancePDF(record)}
                            title="Scarica PDF richiesta"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Modifica intervento"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600"
                            onClick={() => {
                              if (confirm('Sei sicuro di voler eliminare questo intervento?')) {
                                deleteMaintenanceMutation.mutate(record.id);
                              }
                            }}
                            title="Elimina intervento"
                            data-testid={`button-delete-maintenance-${record.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center space-y-3">
                        <Wrench className="h-16 w-16 text-muted-foreground/30" />
                        <div>
                          <p className="text-lg font-medium text-muted-foreground">
                            {searchTerm || statusFilter || priorityFilter 
                              ? "Nessun intervento trovato" 
                              : "Nessun intervento presente"
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {searchTerm || statusFilter || priorityFilter 
                              ? "Prova a modificare i filtri di ricerca" 
                              : "Inizia programmando il primo intervento"
                            }
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Dettagli Intervento */}
      <Dialog open={!!viewingRecord} onOpenChange={() => setViewingRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dettagli Intervento - {viewingRecord?.type}</DialogTitle>
          </DialogHeader>
          {viewingRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Asset</h4>
                  <p className="font-medium">{viewingRecord.asset?.assetCode}</p>
                  <p className="text-sm text-muted-foreground">
                    {viewingRecord.asset?.brand} {viewingRecord.asset?.model}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Dipendente</h4>
                  <p className="font-medium">
                    {viewingRecord.asset?.employee?.name || 'Non assegnato'}
                  </p>
                  {viewingRecord.asset?.employee?.email && (
                    <p className="text-sm text-muted-foreground">
                      {viewingRecord.asset.employee.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Priorità</h4>
                  {getPriorityBadge(viewingRecord.priority)}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Stato</h4>
                  {getStatusBadge(viewingRecord.status)}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Tecnico</h4>
                  <p className="font-medium">{viewingRecord.technician}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Descrizione</h4>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">{viewingRecord.description}</p>
              </div>

              {viewingRecord.notes && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Note</h4>
                  <p className="text-sm bg-blue-50 p-3 rounded-lg">{viewingRecord.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Costo Stimato</h4>
                  <p className="font-medium">€{viewingRecord.estimatedCost || '0'}</p>
                </div>
                {viewingRecord.actualCost && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Costo Effettivo</h4>
                    <p className="font-medium text-green-600">€{viewingRecord.actualCost}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Data Creazione</h4>
                  <p className="text-sm">
                    {format(new Date(viewingRecord.createdAt), "dd/MM/yyyy HH:mm", { locale: it })}
                  </p>
                </div>
                {viewingRecord.scheduledDate && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Data Programmata</h4>
                    <p className="text-sm font-medium">
                      {format(new Date(viewingRecord.scheduledDate), "dd/MM/yyyy HH:mm", { locale: it })}
                    </p>
                  </div>
                )}
              </div>

              {viewingRecord.completedDate && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Data Completamento</h4>
                  <p className="text-sm font-medium text-green-600">
                    {format(new Date(viewingRecord.completedDate), "dd/MM/yyyy HH:mm", { locale: it })}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <p>Storico Asset disponibile a breve</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}