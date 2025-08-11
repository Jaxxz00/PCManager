import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { UploadResult } from "@uppy/core";
import { FileText, Upload, Download, Calendar, User, Shield, AlertTriangle } from "lucide-react";

interface Document {
  id: string;
  filename: string;
  type: "manleva" | "contratto" | "privacy" | "altro";
  objectPath: string;
  uploadedAt: string;
  employeeName?: string;
  pcId?: string;
}

const documentTypes = {
  manleva: { label: "Manleva", icon: Shield, color: "bg-red-500" },
  contratto: { label: "Contratto", icon: FileText, color: "bg-blue-500" },
  privacy: { label: "Privacy", icon: User, color: "bg-green-500" },
  altro: { label: "Altro", icon: FileText, color: "bg-gray-500" }
};

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedType, setSelectedType] = useState<keyof typeof documentTypes>("manleva");
  const { toast } = useToast();

  const saveDocumentMutation = useMutation({
    mutationFn: async (data: { documentURL: string; filename: string; type: string }): Promise<any> => {
      return apiRequest("/api/documents", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: (data, variables) => {
      const newDocument: Document = {
        id: Date.now().toString(),
        filename: variables.filename,
        type: variables.type as any,
        objectPath: data.objectPath,
        uploadedAt: data.uploadedAt,
      };
      
      setDocuments(prev => [newDocument, ...prev]);
      
      toast({
        title: "Documento caricato",
        description: `${variables.filename} è stato caricato con successo.`,
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore durante il salvataggio del documento.",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response: any = await apiRequest("/api/objects/upload", {
      method: "POST",
    });
    
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful[0]) {
      const file = result.successful[0];
      
      saveDocumentMutation.mutate({
        documentURL: (file.uploadURL as string) || '',
        filename: file.name,
        type: selectedType,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTypeConfig = (type: keyof typeof documentTypes) => {
    return documentTypes[type];
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestione Documenti</h1>
        <p className="text-muted-foreground mt-2">
          Carica e gestisci i documenti aziendali come manleva, contratti e documenti privacy.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Caricamento documenti */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Carica Documento
              </CardTitle>
              <CardDescription>
                Seleziona il tipo di documento e carica il file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo Documento</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(documentTypes).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <Button
                        key={key}
                        variant={selectedType === key ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => setSelectedType(key as keyof typeof documentTypes)}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              <div className="text-center">
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={52428800} // 50MB
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleUploadComplete}
                  buttonClassName="w-full"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span>Carica {getTypeConfig(selectedType).label}</span>
                  </div>
                </ObjectUploader>
              </div>

              {saveDocumentMutation.isPending && (
                <div className="text-center text-sm text-muted-foreground">
                  Salvando documento...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informazioni importanti */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Informazioni Importanti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-semibold mb-1">Manleva</h4>
                <p className="text-muted-foreground">
                  Documento di esonero da responsabilità per l'uso di dispositivi aziendali. 
                  Deve essere firmato dal dipendente.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-1">Formati Supportati</h4>
                <p className="text-muted-foreground">
                  PDF, DOC, DOCX, PNG, JPG (max 50MB)
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Sicurezza</h4>
                <p className="text-muted-foreground">
                  I documenti sono archiviati in modo sicuro e accessibili solo agli amministratori.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista documenti */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documenti Caricati
              </CardTitle>
              <CardDescription>
                {documents.length === 0 
                  ? "Nessun documento caricato" 
                  : `${documents.length} documento${documents.length !== 1 ? 'i' : ''} in archivio`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nessun documento</h3>
                  <p className="text-muted-foreground">
                    Carica il primo documento utilizzando il modulo a sinistra.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => {
                    const typeConfig = getTypeConfig(doc.type);
                    const Icon = typeConfig.icon;
                    
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${typeConfig.color} flex items-center justify-center`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium">{doc.filename}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(doc.uploadedAt)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">
                            {typeConfig.label}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Scarica
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}