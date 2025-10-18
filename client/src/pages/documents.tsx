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
  File,
  FileDown,
  QrCode
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
import type { Employee, Asset } from "@shared/schema";
import { z } from "zod";

// Schema per i documenti
const documentSchema = z.object({
  title: z.string().min(1, "Il titolo è obbligatorio"),
  type: z.string().min(1, "Il tipo è obbligatorio"),
  description: z.string().optional(),
  assetId: z.string().optional(),
  employeeId: z.string().optional(),
  tags: z.string().optional(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

interface Document {
  id: string;
  title: string;
  type: string;
  description?: string;
  assetId?: string;
  employeeId?: string;
  tags?: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt: string;
  uploadedBy: string;
  asset?: {
    assetCode: string;
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

  // Fetch documents from API
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"]
  });

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets"]
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Successo",
        description: "Documento eliminato con successo",
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Impossibile eliminare il documento";
      toast({
        title: "Errore",
        description: message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: "",
      type: "",
      description: "",
      assetId: "",
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
          (doc.asset?.assetCode || '').toLowerCase().includes(searchLower) ||
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

  // Statistiche solo manleve
  const totalManleve = documents.length;
  const manleveFirmate = documents.filter(doc => doc.tags?.includes('firmata')).length;
  const manleveAttive = documents.filter(doc => !doc.tags?.includes('archiviata')).length;

  // Tipi di documento unici - ottimizzati con useMemo
  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(documents.map(doc => doc.type))).filter(Boolean);
  }, [documents]);

  const uniqueTags = useMemo(() => {
    return Array.from(new Set(
      documents.flatMap(doc => (doc.tags || '').split(',').map(tag => tag.trim())).filter(Boolean)
    ));
  }, [documents]);

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

  const generateManlevaPDF = async (itemId: string, employeeId: string, fileName?: string) => {
    try {
      const response = await fetch('/api/manleva/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: JSON.stringify({ pcId: itemId, employeeId })
      });

      if (!response.ok) {
        throw new Error('Errore nella generazione della manleva');
      }

      // Download PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'manleva.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Manleva generata",
        description: "Il PDF della manleva è stato scaricato."
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile generare la manleva PDF.",
        variant: "destructive"
      });
    }
  };

  const generateQRCode = async (assetId: string) => {
    try {
      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: JSON.stringify({ assetId })
      });

      if (!response.ok) {
        throw new Error('Errore nella generazione del QR code');
      }

      // Download QR as PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `etichetta_${assetId}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Successo",
        description: "Etichetta QR generata e scaricata",
      });

      return true;
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nella generazione del QR code",
        variant: "destructive",
      });
      return false;
    }
  };

  const onSubmit = (data: DocumentFormData) => {
    // Mock submission - sostituire con API reale
    toast({
      title: "Manleva creata",
      description: "La manleva è stata aggiunta al sistema."
    });
    setShowDocumentForm(false);
    form.reset();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manleve</h1>
          <p className="text-muted-foreground">Archivio manleve generate automaticamente durante l'assegnazione PC - {documents.filter(doc => doc.type === 'manleva').length} totali</p>
        </div>
        {/* Rimosso il pulsante / dialog "Registra Manleva" su richiesta */}
      </div>

      {/* Statistiche Manleve */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Totale Manleve</p>
                <p className="text-2xl font-bold">{totalManleve}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <File className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attive</p>
                <p className="text-2xl font-bold">{manleveAttive}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Collaboratori</p>
                <p className="text-2xl font-bold">{new Set(documents.filter(doc => doc.employeeId).map(doc => doc.employeeId)).size}</p>
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
                  <TableHead className="font-medium min-w-[150px]">Asset/Collaboratore</TableHead>
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
                    <TableRow key={document.id} className="">
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
                          {document.asset && (
                            <div className="flex items-center gap-1 text-sm">
                              <Monitor className="h-3 w-3" />
                              <span>{document.asset.assetCode}</span>
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
                            onClick={async () => {
                              try {
                                // Estrai itemId dai tags (formato: "tag1, tag2, itemId:XXXX")
                                const itemIdMatch = document.tags?.match(/itemId:([^\s,]+)/);
                                const itemId = itemIdMatch ? itemIdMatch[1] : null;
                                
                                if (itemId && document.employeeId) {
                                  // Genera il PDF e aprilo in una nuova tab
                                  const response = await fetch('/api/manleva/generate', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
                                    },
                                    body: JSON.stringify({ pcId: itemId, employeeId: document.employeeId })
                                  });

                                  if (!response.ok) {
                                    throw new Error('Errore nella generazione della manleva');
                                  }

                                  // Crea blob e URL per visualizzazione
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  
                                  // Apri in nuova tab
                                  window.open(url, '_blank');
                                  
                                  // Pulisci URL dopo un po' per liberare memoria
                                  setTimeout(() => window.URL.revokeObjectURL(url), 10000);
                                  
                                  toast({
                                    title: "Manleva aperta",
                                    description: "Il documento è stato aperto in una nuova tab."
                                  });
                                } else {
                                  toast({
                                    title: "Errore",
                                    description: "Asset o collaboratore non trovato per questa manleva",
                                    variant: "destructive"
                                  });
                                }
                              } catch (error) {
                                toast({
                                  title: "Errore",
                                  description: "Impossibile aprire la manleva",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Download Manleva PDF"
                            onClick={() => {
                              // Estrai itemId dai tags (formato: "tag1, tag2, itemId:XXXX")
                              const itemIdMatch = document.tags?.match(/itemId:([^\s,]+)/);
                              const itemId = itemIdMatch ? itemIdMatch[1] : null;
                              
                              if (itemId && document.employeeId) {
                                generateManlevaPDF(itemId, document.employeeId, document.fileName);
                              } else {
                                toast({
                                  title: "Errore",
                                  description: "Asset o collaboratore non trovato per questa manleva",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Genera QR Code"
                            onClick={() => {
                              // Logica per generare QR code
                              if (document.assetId) {
                                generateQRCode(document.assetId);
                              } else {
                                toast({
                                  title: "Errore", 
                                  description: "Nessun Asset associato a questa manleva",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600"
                            onClick={() => {
                              if (confirm('Sei sicuro di voler eliminare questo documento?')) {
                                deleteDocumentMutation.mutate(document.id);
                              }
                            }}
                            title="Elimina documento"
                            data-testid={`button-delete-document-${document.id}`}
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