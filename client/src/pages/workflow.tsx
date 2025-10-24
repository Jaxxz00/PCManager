import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  GitBranch, 
  Monitor, 
  Users, 
  ArrowRight, 
  CheckCircle, 
  Circle, 
  Clock,
  FileText,
  AlertTriangle,
  Printer,
  User
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AssignmentStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ElementType;
}

interface WorkflowData {
  selectedPc: any;
  selectedEmployee: any;
  step: number;
  completed: boolean;
}

export default function Workflow() {
  const [workflowData, setWorkflowData] = useState<WorkflowData>({
    selectedPc: null,
    selectedEmployee: null,
    step: 1,
    completed: false
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratingManleva, setIsGeneratingManleva] = useState(false);
  const [manlevaGenerated, setManlevaGenerated] = useState(false);

  const { data: pcs = [], isLoading: pcsLoading } = useQuery<any[]>({
    queryKey: ["/api/pcs"],
  });

  const { data: assets = [], isLoading: assetsLoading } = useQuery<any[]>({
    queryKey: ["/api/assets"],
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

  // Combina PC e Assets non assegnati
  const availablePcs = pcs.filter((pc: any) => !pc.employeeId && pc.status === 'active');
  const availableAssets = assets.filter((asset: any) => !asset.employeeId && asset.status === 'disponibile');
  const allAvailableItems = [...availablePcs, ...availableAssets];

  const generateManlevaPDF = async (pcId: string, employeeId: string) => {
    try {
      const response = await fetch('/api/manleva/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: JSON.stringify({ pcId, employeeId })
      });

      if (!response.ok) {
        throw new Error('Errore nella generazione della manleva');
      }

      // Download PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `manleva_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      return false;
    }
  };

  const assignItemMutation = useMutation({
    mutationFn: async (data: { itemId: string; employeeId: string; itemType: 'pc' | 'asset' }) => {
      // Assegna il PC o Asset tramite PATCH
      const endpoint = data.itemType === 'pc' ? `/api/pcs/${data.itemId}` : `/api/assets/${data.itemId}`;
      const result = await apiRequest("PATCH", endpoint, {
        employeeId: data.employeeId,
        status: "assegnato"
      });
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pcs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setWorkflowData(prev => ({ ...prev, step: 6, completed: true }));
      toast({
        title: "Assegnazione Completata",
        description: "Asset assegnato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore durante l'assegnazione",
        variant: "destructive",
      });
    },
  });

  const steps: AssignmentStep[] = [
    {
      id: "select-asset",
      title: "Seleziona Asset",
      description: "Scegli il dispositivo o asset da assegnare",
      completed: !!workflowData.selectedPc,
      icon: Monitor
    },
    {
      id: "select-employee",
      title: "Seleziona Collaboratore",
      description: "Scegli il collaboratore destinatario",
      completed: !!workflowData.selectedEmployee,
      icon: Users
    },
    {
      id: "verify",
      title: "Verifica Dati",
      description: "Controlla le informazioni inserite",
      completed: workflowData.step >= 3,
      icon: CheckCircle
    },
    {
      id: "print-label",
      title: "Stampa Etichetta",
      description: "Genera etichetta identificativa",
      completed: workflowData.step >= 4,
      icon: Printer
    },
    {
      id: "document",
      title: "Genera Documento",
      description: "Stampa documento per firma (opzionale)",
      completed: workflowData.step >= 5,
      icon: FileText
    },
    {
      id: "complete",
      title: "Assegnazione",
      description: "Asset assegnato con successo",
      completed: workflowData.completed,
      icon: GitBranch
    }
  ];

  const handlePcSelect = (pc: any) => {
    setWorkflowData(prev => ({ ...prev, selectedPc: pc, step: Math.max(prev.step, 2) }));
  };

  const handleEmployeeSelect = (employee: any) => {
    setWorkflowData(prev => ({ ...prev, selectedEmployee: employee, step: Math.max(prev.step, 3) }));
  };

  const handleNextStep = () => {
    if (workflowData.step < 6) {
      // Se stai andando al passo 6 (assegnazione), controlla se la manleva è stata generata
      if (workflowData.step === 5 && !manlevaGenerated) {
        toast({
          title: "Attenzione",
          description: "Devi generare la manleva prima di completare l'assegnazione",
          variant: "destructive"
        });
        return;
      }
      
      // Se stai passando da step 5 a step 6, esegui l'assegnazione
      if (workflowData.step === 5 && workflowData.selectedPc && workflowData.selectedEmployee) {
        // Determina se è un PC o un Asset in base alla presenza di 'pcId' o 'assetCode'
        const itemType = workflowData.selectedPc.pcId ? 'pc' : 'asset';
        assignItemMutation.mutate({
          itemId: workflowData.selectedPc.id,
          employeeId: workflowData.selectedEmployee.id,
          itemType: itemType
        });
      } else {
        // Altrimenti passa semplicemente allo step successivo
        setWorkflowData(prev => ({ ...prev, step: prev.step + 1 }));
      }
    }
  };

  const handleReset = () => {
    setWorkflowData({
      selectedPc: null,
      selectedEmployee: null,
      step: 1,
      completed: false
    });
    setManlevaGenerated(false);
  };

  const handleGenerateManlevaDocument = async () => {
    if (!workflowData.selectedPc || !workflowData.selectedEmployee) {
      toast({
        title: "Errore",
        description: "Asset e collaboratore devono essere selezionati per generare la manleva",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingManleva(true);

    try {
      if (!workflowData.selectedPc || !workflowData.selectedEmployee) {
        throw new Error("Asset o collaboratore non selezionati");
      }
      
      // Se è un PC usa pcId, altrimenti usa assetCode
      const itemIdentifier = workflowData.selectedPc.pcId || workflowData.selectedPc.assetCode || workflowData.selectedPc.id;
      
      const requestBody = {
        pcId: itemIdentifier,
        employeeId: workflowData.selectedEmployee.id
      };
      
      // Genera e scarica il PDF della manleva
      const response = await fetch("/api/manleva/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('sessionId')}`,
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error("Errore nella generazione del documento");
      }

      // Scarica il file PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Usa assetCode o pcId per il nome del file
      const itemId = workflowData.selectedPc.assetCode || workflowData.selectedPc.pcId || workflowData.selectedPc.id;
      const fileName = `manleva_${itemId}_${workflowData.selectedEmployee.name.replace(/\s/g, '_')}.pdf`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Salva i metadati del documento nel database
      try {
        // Salva itemId nel campo tags per poi recuperarlo al download
        const documentData = {
          title: `Manleva ${itemId} - ${workflowData.selectedEmployee.name}`,
          type: "manleva",
          description: `Documento di assegnazione asset aziendale a ${workflowData.selectedEmployee.name}`,
          fileName: fileName,
          fileSize: blob.size,
          employeeId: workflowData.selectedEmployee.id,
          tags: `manleva, assegnazione, firmata, itemId:${itemId}`,
        };

        await apiRequest("POST", "/api/documents", documentData);
        
        // Invalida la cache dei documenti per aggiornare la lista
        queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      } catch (docError) {
        console.error("Errore nel salvataggio metadati documento:", docError);
        // Non blocchiamo il flusso se il salvataggio dei metadati fallisce
      }

      toast({
        title: "Successo",
        description: "Documento manleva generato e scaricato correttamente",
      });

      setManlevaGenerated(true);

    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nella generazione del documento manleva",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingManleva(false);
    }
  };

  const renderStepContent = () => {
    switch (workflowData.step) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Seleziona Asset da Assegnare
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allAvailableItems.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nessun asset disponibile per l'assegnazione</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allAvailableItems.map((item: any) => {
                    const isPC = !!item.pcId;
                    const displayId = isPC ? item.pcId : item.assetCode;
                    const displayType = isPC ? 'PC' : item.assetType?.toUpperCase();
                    
                    return (
                      <div
                        key={item.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          workflowData.selectedPc?.id === item.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                        onClick={() => handlePcSelect(item)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{displayId}</h3>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Badge variant="outline">{displayType}</Badge>
                              <span>{item.brand} {item.model}</span>
                            </div>
                            {isPC && item.ram && item.storage && (
                              <p className="text-xs text-muted-foreground">
                                RAM: {item.ram}GB - Storage: {item.storage}
                              </p>
                            )}
                            {!isPC && item.serialNumber && (
                              <p className="text-xs text-muted-foreground">SN: {item.serialNumber}</p>
                            )}
                          </div>
                          <Badge variant={item.status === 'active' || item.status === 'disponibile' ? 'default' : 'secondary'}>
                            {item.status}
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
                <Users className="h-5 w-5" />
                Seleziona Collaboratore
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employees.map((employee: any) => (
                  <div
                    key={employee.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      workflowData.selectedEmployee?.id === employee.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                    onClick={() => handleEmployeeSelect(employee)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{employee.name}</h3>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                        <p className="text-xs text-muted-foreground">{employee.department}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Verifica Assegnazione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    PC Selezionato
                  </h3>
                  {workflowData.selectedPc && (
                    <div>
                      <p className="font-medium">{workflowData.selectedPc.pcId}</p>
                      <p className="text-sm text-muted-foreground">
                        {workflowData.selectedPc.brand} {workflowData.selectedPc.model}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        S/N: {workflowData.selectedPc.serialNumber}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Collaboratore
                  </h3>
                  {workflowData.selectedEmployee && (
                    <div>
                      <p className="font-medium">{workflowData.selectedEmployee.name}</p>
                      <p className="text-sm text-muted-foreground">{workflowData.selectedEmployee.email}</p>
                      <p className="text-sm text-muted-foreground">{workflowData.selectedEmployee.department}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Verificare che tutti i dati siano corretti prima di procedere
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Stampa Etichetta Identificativa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <Printer className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="font-medium">Etichetta PC {workflowData.selectedPc?.pcId}</p>
                <p className="text-sm text-muted-foreground">
                  Assegnato a: {workflowData.selectedEmployee?.name}
                </p>
              </div>
              <Button 
                onClick={() => {
                  // Genera etichetta per il PC selezionato
                  const labelHTML = generateLabelHTML(workflowData.selectedPc);
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(labelHTML);
                    printWindow.document.close();
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Printer className="h-4 w-4 mr-2" />
                Stampa Etichetta
              </Button>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documento di Manleva
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">Documento di Presa in Carico</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Il collaboratore deve firmare il documento di manleva per la presa in carico dell'asset aziendale.
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Asset:</strong> {workflowData.selectedPc?.assetCode || workflowData.selectedPc?.pcId} - {workflowData.selectedPc?.brand} {workflowData.selectedPc?.model}</p>
                  <p><strong>Collaboratore:</strong> {workflowData.selectedEmployee?.name}</p>
                  <p><strong>Data:</strong> {new Date().toLocaleDateString('it-IT')}</p>
                </div>
              </div>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={handleGenerateManlevaDocument}
                disabled={isGeneratingManleva}
              >
                <FileText className="h-4 w-4 mr-2" />
                {isGeneratingManleva ? "Generando..." : "Genera Documento Manleva"}
              </Button>
              {manlevaGenerated ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-800">
                    Documento generato e acquisito
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Genera la manleva per procedere con l'assegnazione
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Assegnazione Completata
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="p-6 bg-green-50 rounded-lg">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800">Operazione Completata</h3>
                <p className="text-green-700">
                  PC {workflowData.selectedPc?.pcId} assegnato con successo a {workflowData.selectedEmployee?.name}
                </p>
              </div>
              <Button onClick={handleReset} className="w-full">
                Nuova Assegnazione
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  // Funzione per generare HTML dell'etichetta piccola per PC
  const generateLabelHTML = (pc: any) => {
    // Debug: mostra i dati del PC
    console.log('PC data for label:', pc);
    console.log('PC ID:', pc?.pcId);
    console.log('PC Brand:', pc?.brand);
    console.log('PC Model:', pc?.model);
    console.log('PC Serial:', pc?.serialNumber);
    
    const assetId = pc?.pcId || 'PC-001';
    const brand = pc?.brand || 'Dell';
    const model = pc?.model || 'OptiPlex';
    const serialNumber = pc?.serialNumber || 'SN123456';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { 
            size: 70mm 36mm; 
            margin: 0; 
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0; 
            font-size: 6px;
            background: white;
            width: 70mm;
            height: 36mm;
          }
          .label { 
            width: 70mm; 
            height: 36mm; 
            border: 1px solid #000; 
            border-radius: 0px; 
            padding: 1mm; 
            display: flex; 
            flex-direction: column; 
            justify-content: space-between;
            background: white;
            box-sizing: border-box;
          }
          .asset-id { 
            font-weight: bold; 
            font-size: 8px; 
            margin-bottom: 1px; 
            color: #000;
            line-height: 1.0;
          }
          .info-line { 
            margin: 0px; 
            font-size: 6px; 
            color: #000;
            line-height: 1.0;
          }
          .service-desk { 
            display: flex; 
            align-items: center; 
            margin-top: 1px; 
            font-size: 4px;
          }
          .service-desk-icon { 
            width: 6px; 
            height: 4px; 
            margin-right: 1px; 
            background: black; 
            position: relative; 
          }
          .service-desk-icon::after { 
            content: ''; 
            position: absolute; 
            right: -1px; 
            top: 1px; 
            width: 1px; 
            height: 2px; 
            background: black; 
          }
          .barcode { 
            margin-top: 1px; 
            height: 8px; 
            background: #000;
            position: relative;
            border: 0px;
          }
          .barcode::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 1px,
              #fff 1px,
              #fff 2px
            );
            background-size: 2px 8px;
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="asset-id">Asset: ${assetId}</div>
          <div class="info-line">Model: ${brand} ${model}</div>
          <div class="info-line">S/N: ${serialNumber}</div>
          <div class="service-desk">
            <span>SD</span>
            <div class="service-desk-icon"></div>
            <span>: www.maori.it</span>
          </div>
          <div class="barcode"></div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workflow Assegnazione PC</h1>
          <p className="text-muted-foreground">Processo guidato per l'assegnazione di PC aziendali</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          Processo Attivo
        </Badge>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Avanzamento Processo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = workflowData.step === index + 1;
              const isCompleted = step.completed;
              
              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isActive 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <p className={`text-xs text-center font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  {index < steps.length - 1 && (
                    <div className={`w-full h-0.5 mt-2 ${
                      steps[index + 1].completed ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation */}
      {!workflowData.completed && workflowData.step < 6 && (
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setWorkflowData(prev => ({ ...prev, step: Math.max(1, prev.step - 1) }))}
            disabled={workflowData.step === 1}
          >
            Indietro
          </Button>
          
          <Button 
            onClick={handleNextStep}
            disabled={
              (workflowData.step === 1 && !workflowData.selectedPc) ||
              (workflowData.step === 2 && !workflowData.selectedEmployee) ||
              (workflowData.step === 5 && !manlevaGenerated) ||
              assignItemMutation.isPending
            }
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {workflowData.step === 6 ? (
              assignItemMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Assegnazione...
                </>
              ) : (
                <>
                  Completa Assegnazione
                  <CheckCircle className="h-4 w-4" />
                </>
              )
            ) : (
              <>
                Avanti
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}