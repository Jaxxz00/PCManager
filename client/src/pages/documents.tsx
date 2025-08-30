import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { 
  Plus, 
  Search, 
  Download, 
  Upload, 
  FileText, 
  Filter, 
  Calendar,
  User,
  Monitor,
  Eye,
  Trash2,
  Edit,
  File
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Employee, PcWithEmployee } from "@shared/schema";
import { z } from "zod";

// Schema per i documenti
const documentSchema = z.object({
  title: z.string().min(1, "Il titolo è obbligatorio"),
  type: z.string().min(1, "Il tipo è obbligatorio"),
  description: z.string().optional(),
  pcId: z.string().optional(),
  employeeId: z.string().optional(),
  tags: z.string().optional(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

interface Document {
  id: string;
  title: string;
  type: string;
  description?: string;
  pcId?: string;
  employeeId?: string;
  tags?: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt: string;
  uploadedBy: string;
  pc?: {
    pcId: string;
    brand: string;
    model: string;
  };
  employee?: {
    name: string;
    email: string;
  };
}

export default function Documents() {
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Mock data per ora - da sostituire con API reali
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    queryFn: async () => {
      // Simulazione dati documenti
      return [
        {
          id: "1",
          title: "Manleva PC Dell OptiPlex 7090",
          type: "manleva",
          description: "Documento di consegna e responsabilità per PC aziendale",
          pcId: "49a472d5-0d12-47c4-954b-6c0a811696e3",
          employeeId: "e0d90135-811d-429a-a0a6-0576ac529d21",
          tags: "consegna, responsabilità",
          fileName: "manleva_dell_optiplex_luca_rossi.pdf",
          fileSize: 245760,
          uploadedAt: "2025-08-28T10:30:00Z",
          uploadedBy: "admin",
          pc: { pcId: "PC-001", brand: "Dell", model: "OptiPlex 7090" },
          employee: { name: "Luca Rossi", email: "luca.rossi@maorigroup.com" }
        },
        {
          id: "2",
          title: "Manuale utente Windows 11",
          type: "manuale",
          description: "Guida completa per l'utilizzo di Windows 11 in ambiente aziendale",
          tags: "windows, guida, sistema operativo",
          fileName: "manuale_windows11_corporate.pdf",
          fileSize: 1024000,
          uploadedAt: "2025-08-25T14:20:00Z",
          uploadedBy: "admin"
        },
        {
          id: "3",
          title: "Contratto di assistenza HP",
          type: "contratto",
          description: "Contratto di assistenza tecnica per PC HP in garanzia",
          pcId: "pc-002",
          tags: "assistenza, garanzia, hp",
          fileName: "contratto_assistenza_hp_2025.pdf",
          fileSize: 567890,
          uploadedAt: "2025-08-20T09:15:00Z",
          uploadedBy: "admin",
          pc: { pcId: "PC-002", brand: "HP", model: "EliteDesk 800" }
        }
      ];
    }
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"]
  });

  const { data: pcs = [] } = useQuery<PcWithEmployee[]>({
    queryKey: ["/api/pcs"]
  });

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: "",
      type: "",
      description: "",
      pcId: "",
      employeeId: "",
      tags: ""
    }
  });

  // Filtri documenti
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Filtro ricerca
      if (debouncedSearch.trim()) {
        const searchLower = debouncedSearch.toLowerCase();
        const matches = (
          (doc.title || '').toLowerCase().includes(searchLower) ||
          (doc.description || '').toLowerCase().includes(searchLower) ||
          (doc.tags || '').toLowerCase().includes(searchLower) ||
          (doc.fileName || '').toLowerCase().includes(searchLower) ||
          (doc.pc?.pcId || '').toLowerCase().includes(searchLower) ||
          (doc.employee?.name || '').toLowerCase().includes(searchLower)
        );
        if (!matches) return false;
      }

      // Filtro tipo
      if (typeFilter && doc.type !== typeFilter) {
        return false;
      }

      // Filtro tag
      if (tagFilter && !(doc.tags || '').toLowerCase().includes(tagFilter.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [documents, debouncedSearch, typeFilter, tagFilter]);

  // Statistiche
  const totalDocuments = documents.length;
  const manleveDocuments = documents.filter(doc => doc.type === 'manleva').length;
  const manualiDocuments = documents.filter(doc => doc.type === 'manuale').length;
  const contrattiDocuments = documents.filter(doc => doc.type === 'contratto').length;

  // Tipi di documento unici
  const uniqueTypes = Array.from(new Set(documents.map(doc => doc.type))).filter(Boolean);
  const uniqueTags = Array.from(new Set(
    documents.flatMap(doc => (doc.tags || '').split(',').map(tag => tag.trim())).filter(Boolean)
  ));

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "manleva":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Manleva</Badge>;
      case "manuale":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Manuale</Badge>;
      case "contratto":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Contratto</Badge>;
      case "fattura":
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Fattura</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const onSubmit = (data: DocumentFormData) => {
    // Mock submission - sostituire con API reale
    console.log("Documento da creare:", data);
    toast({
      title: "Documento creato",
      description: "Il documento è stato aggiunto al sistema."
    });
    setShowDocumentForm(false);
    form.reset();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documenti</h1>
          <p className="text-muted-foreground">Gestione documenti aziendali - {documents.length} totali</p>
        </div>
        <Dialog open={showDocumentForm} onOpenChange={setShowDocumentForm}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Nuovo Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Aggiungi Nuovo Documento</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titolo</FormLabel>
                        <FormControl>
                          <Input placeholder="Titolo del documento" {...field} />
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
                        <FormLabel>Tipo</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Seleziona tipo</option>
                            <option value="manleva">Manleva</option>
                            <option value="manuale">Manuale</option>
                            <option value="contratto">Contratto</option>
                            <option value="fattura">Fattura</option>
                            <option value="garanzia">Garanzia</option>
                            <option value="altro">Altro</option>
                          </select>
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
                      <FormLabel>Descrizione</FormLabel>
                      <FormControl>
                        <Input placeholder="Descrizione del documento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pcId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PC Associato (opzionale)</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Nessun PC</option>
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
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dipendente Associato (opzionale)</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Nessun dipendente</option>
                            {employees.map(employee => (
                              <option key={employee.id} value={employee.id}>
                                {employee.name} - {employee.email}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tag (separati da virgola)</FormLabel>
                      <FormControl>
                        <Input placeholder="es: garanzia, assistenza, windows" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">Trascina i file qui o clicca per selezionare</p>
                  <Button type="button" variant="outline" size="sm">
                    Scegli File
                  </Button>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDocumentForm(false)}
                  >
                    Annulla
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90">
                    Salva Documento
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Totali</p>
                <p className="text-2xl font-bold">{totalDocuments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <File className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Manleve</p>
                <p className="text-2xl font-bold">{manleveDocuments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Manuali</p>
                <p className="text-2xl font-bold">{manualiDocuments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contratti</p>
                <p className="text-2xl font-bold">{contrattiDocuments}</p>
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
                placeholder="Cerca documenti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Tutti i tipi</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Tutti i tag</option>
              {uniqueTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Esporta
            </Button>
          </div>

          {(debouncedSearch || typeFilter || tagFilter) && (
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="secondary">
                {filteredDocuments.length} risultati
              </Badge>
              {debouncedSearch && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSearchTerm("")}
                >
                  Cancella Ricerca
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("");
                  setTagFilter("");
                }}
              >
                Rimuovi Tutti i Filtri
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabella Documenti */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Documenti ({filteredDocuments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium min-w-[200px]">Titolo</TableHead>
                  <TableHead className="font-medium min-w-[100px]">Tipo</TableHead>
                  <TableHead className="font-medium min-w-[150px]">PC/Dipendente</TableHead>
                  <TableHead className="font-medium min-w-[120px]">Dimensione</TableHead>
                  <TableHead className="font-medium min-w-[120px]">Data Upload</TableHead>
                  <TableHead className="font-medium min-w-[150px]">Tag</TableHead>
                  <TableHead className="min-w-[120px]">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(7)].map((_, j) => (
                        <TableCell key={j} className="animate-pulse">
                          <div className="h-4 bg-muted rounded w-20"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredDocuments.length > 0 ? (
                  filteredDocuments.map((document) => (
                    <TableRow key={document.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{document.title}</p>
                          {document.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {document.description}
                            </p>
                          )}
                          {document.fileName && (
                            <p className="text-xs text-blue-600">{document.fileName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(document.type)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {document.pc && (
                            <div className="flex items-center gap-1 text-sm">
                              <Monitor className="h-3 w-3" />
                              <span>{document.pc.pcId}</span>
                            </div>
                          )}
                          {document.employee && (
                            <div className="flex items-center gap-1 text-sm">
                              <User className="h-3 w-3" />
                              <span>{document.employee.name}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatFileSize(document.fileSize)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(document.uploadedAt), "dd/MM/yyyy", { locale: it })}
                      </TableCell>
                      <TableCell>
                        {document.tags && (
                          <div className="flex flex-wrap gap-1">
                            {document.tags.split(',').slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag.trim()}
                              </Badge>
                            ))}
                            {document.tags.split(',').length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{document.tags.split(',').length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
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
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
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
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <FileText className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          {searchTerm || typeFilter || tagFilter 
                            ? "Nessun documento trovato con i filtri applicati" 
                            : "Nessun documento presente"
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