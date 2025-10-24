import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Monitor, 
  Smartphone, 
  FileText,
  Upload,
  Download
} from "lucide-react";
import type { Asset, Employee } from "@shared/schema";
import { Input } from "@/components/ui/input";

interface ReturnWorkflowData {
  selectedAsset: Asset | null;
  selectedEmployee: Employee | null;
  step: number;
  completed: boolean;
}

interface ReturnStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function ReturnWorkflow() {
  const [workflowData, setWorkflowData] = useState<ReturnWorkflowData>({
    selectedAsset: null,
    selectedEmployee: null,
    step: 1,
    completed: false
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isGeneratingReturnDocument, setIsGeneratingReturnDocument] = useState(false);
  const [returnDocumentGenerated, setReturnDocumentGenerated] = useState(false);
  const [documentUploaded, setDocumentUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { data: allAssets = [], isLoading: assetsLoading } = useQuery<any[]>({
    queryKey: ["/api/assets/all-including-pcs"],
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

  // Filtra solo asset assegnati
  const assignedAssets = allAssets.filter((asset: any) => 
    asset.employeeId && 
    (asset.status === 'assegnato')
  );

  const steps: ReturnStep[] = [
    {
      id: "select-asset",
      title: "Seleziona Asset",
      description: "Scegli l'asset da riconsegnare",
      icon: Monitor
    },
    {
      id: "confirm-employee",
      title: "Conferma Collaboratore",
      description: "Verifica il collaboratore assegnato",
      icon: User
    },
    {
      id: "generate-return-document",
      title: "Genera Documento Riconsegna",
      description: "Crea il documento di riconsegna",
      icon: FileText
    },
    {
      id: "upload-signed-document",
      title: "Carica Documento Firmato",
      description: "Carica il documento firmato",
      icon: Upload
    },
    {
      id: "complete-return",
      title: "Riconsegna Completata",
      description: "Asset riconsegnato con successo",
      icon: CheckCircle
    }
  ];

  const handleAssetSelect = (asset: Asset) => {
    console.log("🔍 Asset selected:", asset);
    setWorkflowData(prev => ({ 
      ...prev, 
      selectedAsset: asset,
      step: Math.max(prev.step, 2)
    }));
    
    // Trova l'employee associato
    const employee = employees.find(emp => emp.id === asset.employeeId);
    if (employee) {
      setWorkflowData(prev => ({ 
        ...prev, 
        selectedEmployee: employee,
        step: Math.max(prev.step, 3)
      }));
    }
  };

  const handleNextStep = () => {
    if (workflowData.step < 5) {
      // Se stai andando al passo 4, controlla se il documento è stato generato
      if (workflowData.step === 3 && !returnDocumentGenerated) {
        toast({
          title: "Attenzione",
          description: "Devi generare il documento di riconsegna prima di procedere",
          variant: "destructive"
        });
        return;
      }
      
      // Se stai andando al passo 5, controlla se il documento è stato caricato
      if (workflowData.step === 4 && !documentUploaded) {
        toast({
          title: "Attenzione",
          description: "Devi caricare il documento firmato prima di completare la riconsegna",
          variant: "destructive"
        });
        return;
      }
      
      // Se stai passando da step 4 a step 5, esegui la riconsegna
      if (workflowData.step === 4 && workflowData.selectedAsset) {
        returnAssetMutation.mutate({
          assetId: workflowData.selectedAsset.id,
          assetType: workflowData.selectedAsset.assetType === 'computer' ? 'pc' : 'asset'
        });
      } else {
        setWorkflowData(prev => ({ ...prev, step: prev.step + 1 }));
      }
    }
  };

  const handleReset = () => {
    setWorkflowData({
      selectedAsset: null,
      selectedEmployee: null,
      step: 1,
      completed: false
    });
    setReturnDocumentGenerated(false);
    setDocumentUploaded(false);
  };

  const handleGenerateReturnDocument = async () => {
    if (!workflowData.selectedAsset || !workflowData.selectedEmployee) {
      toast({
        title: "Errore",
        description: "Asset e collaboratore devono essere selezionati per generare il documento di riconsegna",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingReturnDocument(true);

    try {
      const success = await generateReturnPDF(
        workflowData.selectedAsset.assetCode || workflowData.selectedAsset.id,
        workflowData.selectedEmployee.id
      );

      if (success) {
        setReturnDocumentGenerated(true);
        toast({
          title: "Successo",
          description: "Documento di riconsegna generato e scaricato per la firma a mano",
        });
      } else {
        throw new Error('Errore nella generazione del documento');
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nella generazione del documento di riconsegna",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReturnDocument(false);
    }
  };

  const generateReturnPDF = async (assetId: string, employeeId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/return/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: JSON.stringify({ assetId, employeeId })
      });

      if (!response.ok) {
        throw new Error('Errore nella generazione del documento di riconsegna');
      }

      // Download PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `riconsegna_da_firmare_${workflowData.selectedAsset?.assetCode || workflowData.selectedAsset?.id}_${workflowData.selectedEmployee?.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      return false;
    }
  };

  const handleUploadSignedDocument = async (file: File) => {
    if (!workflowData.selectedAsset || !workflowData.selectedEmployee) {
      toast({
        title: "Errore",
        description: "Asset e collaboratore devono essere selezionati per caricare il documento firmato",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', `Riconsegna Firmata ${workflowData.selectedAsset.assetCode || workflowData.selectedAsset.id} - ${workflowData.selectedEmployee.name}`);
      formData.append('type', 'riconsegna_firmata');
      formData.append('description', `Documento di riconsegna firmato per ${workflowData.selectedEmployee.name}`);
      formData.append('employeeId', workflowData.selectedEmployee.id);
      formData.append('tags', `riconsegna, firmata, upload, itemId:${workflowData.selectedAsset.assetCode || workflowData.selectedAsset.id}`);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Errore nel caricamento del documento');
      }

      const result = await response.json();
      setDocumentUploaded(true);
      
      toast({
        title: "Successo",
        description: "Documento firmato caricato correttamente",
      });

      // Invalida la cache dei documenti
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });

    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nel caricamento del documento firmato",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const returnAssetMutation = useMutation({
    mutationFn: async (data: { assetId: string; assetType: 'pc' | 'asset' }) => {
      console.log("🔍 Return mutation data:", data);
      console.log("🔍 Selected asset:", workflowData.selectedAsset);
      
      // Riconsegna sempre tramite /api/assets (sia PC che altri asset)
      const endpoint = `/api/assets/${data.assetId}`;
      console.log("🔍 PATCH endpoint:", endpoint);
      
      const result = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: JSON.stringify({
          employeeId: null,
          status: "disponibile"
        })
      });
      
      if (!result.ok) {
        throw new Error('Errore nella riconsegna');
      }
      
      // Prova a parsare JSON, se fallisce restituisci un oggetto vuoto
      try {
        return await result.json();
      } catch (error) {
        // Se non c'è JSON, restituisci un oggetto vuoto (la chiamata è andata a buon fine)
        return {};
      }
    },
    onSuccess: () => {
      // Invalida tutte le query per forzare il refresh
      queryClient.invalidateQueries({ queryKey: ["/api/pcs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets/all-including-pcs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assigned-devices"] });
      
      setWorkflowData(prev => ({ ...prev, step: 5, completed: true }));
      toast({
        title: "Riconsegna Completata",
        description: "Asset riconsegnato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore durante la riconsegna",
        variant: "destructive",
      });
    },
  });

  const renderStepContent = () => {
    switch (workflowData.step) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Seleziona Asset da Riconsegnare
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assetsLoading ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Caricamento asset...</div>
                </div>
              ) : assignedAssets.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Nessun asset assegnato disponibile per la riconsegna</div>
                </div>
              ) : (
                <div className="grid gap-3">
                  {assignedAssets.map((asset) => {
                    const employee = employees.find(emp => emp.id === asset.employeeId);
                    const isSelected = workflowData.selectedAsset?.id === asset.id;
                    const Icon = asset.assetType === 'computer' ? Monitor : 
                                asset.assetType === 'smartphone' ? Smartphone : 
                                FileText;
                    
                    return (
                      <div
                        key={asset.id}
                        onClick={() => handleAssetSelect(asset)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? "border-blue-500 bg-blue-50" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-gray-600" />
                          <div className="flex-1">
                            <div className="font-medium">{asset.assetCode}</div>
                            <div className="text-sm text-muted-foreground">
                              {asset.brand} {asset.model} • {asset.assetType}
                            </div>
                            {employee && (
                              <div className="text-sm text-blue-600">
                                Assegnato a: {employee.name}
                              </div>
                            )}
                          </div>
                          <Badge variant={asset.status === 'assegnato' ? 'default' : 'secondary'}>
                            {asset.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Conferma Collaboratore
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workflowData.selectedAsset && workflowData.selectedEmployee ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Asset Selezionato</h4>
                    <div className="flex items-center gap-3">
                      <Monitor className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">{workflowData.selectedAsset.assetCode}</div>
                        <div className="text-sm text-muted-foreground">
                          {workflowData.selectedAsset.brand} {workflowData.selectedAsset.model}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Collaboratore Assegnato</h4>
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">{workflowData.selectedEmployee.name}</div>
                        <div className="text-sm text-muted-foreground">{workflowData.selectedEmployee.email}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Seleziona un asset per continuare</div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Genera Documento di Riconsegna
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Genera il documento di riconsegna per l'asset selezionato.
                </p>
                
                <Button
                  onClick={handleGenerateReturnDocument}
                  disabled={isGeneratingReturnDocument || !workflowData.selectedAsset || !workflowData.selectedEmployee}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isGeneratingReturnDocument ? "Generando..." : "Genera Documento di Riconsegna"}
                </Button>
                
                {returnDocumentGenerated ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-800">
                      Documento generato e scaricato per la firma. Procedi al passo successivo per caricare il documento firmato.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      Genera il documento di riconsegna per procedere
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Carica Documento Firmato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Carica il documento di riconsegna firmato per completare il processo.
                </p>
                
                <div className="mb-3">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadSignedDocument(file);
                      }
                    }}
                    disabled={isUploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer disabled:opacity-50"
                  />
                </div>
                
                {documentUploaded ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-800">
                      Documento firmato caricato correttamente
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      Carica il documento firmato per procedere
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Riconsegna Completata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Riconsegna Completata!</h3>
                  <p className="text-muted-foreground">
                    L'asset è stato riconsegnato con successo e ora è disponibile per nuove assegnazioni.
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleReset} variant="outline">
                    Nuova Riconsegna
                  </Button>
                  <Button onClick={() => setLocation("/assigned-devices")}>
                    Torna agli Asset Assegnati
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Procedura di Riconsegna</h1>
          <p className="text-muted-foreground">Gestisci la riconsegna degli asset assegnati</p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/assigned-devices")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna agli Asset Assegnati
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = workflowData.step === stepNumber;
          const isCompleted = workflowData.step > stepNumber;
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                isCompleted 
                  ? "bg-green-500 border-green-500 text-white" 
                  : isActive 
                    ? "bg-blue-500 border-blue-500 text-white" 
                    : "bg-gray-100 border-gray-300 text-gray-500"
              }`}>
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  isCompleted ? "bg-green-500" : "bg-gray-300"
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation */}
      {!workflowData.completed && (
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/assigned-devices")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Annulla
          </Button>
          
          <div className="flex gap-2">
            {workflowData.step > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setWorkflowData(prev => ({ ...prev, step: prev.step - 1 }))}
              >
                Indietro
              </Button>
            )}
            
            {workflowData.step < 5 && (
              <Button 
                onClick={handleNextStep}
                disabled={
                  (workflowData.step === 1 && !workflowData.selectedAsset) ||
                  (workflowData.step === 2 && !workflowData.selectedEmployee) ||
                  (workflowData.step === 3 && !returnDocumentGenerated) ||
                  (workflowData.step === 4 && !documentUploaded)
                }
              >
                {workflowData.step === 4 ? "Completa Riconsegna" : "Avanti"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
