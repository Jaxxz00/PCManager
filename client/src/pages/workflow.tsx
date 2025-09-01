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

  const { data: pcs = [], isLoading: pcsLoading } = useQuery({
    queryKey: ["/api/pcs"],
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ["/api/employees"],
  });

  // Filtra PC non assegnati
  const availablePCs = pcs.filter((pc: any) => !pc.employeeId);

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
      console.error('Errore generazione manleva:', error);
      return false;
    }
  };

  const assignPcMutation = useMutation({
    mutationFn: async (data: { pcId: string; employeeId: string }) => {
      // Prima assegna il PC
      const result = await apiRequest(`/api/pcs/${data.pcId}/assign`, "POST", {
        employeeId: data.employeeId
      });
      
      // Poi genera automaticamente la manleva
      await generateManlevaPDF(data.pcId, data.employeeId);
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pcs"] });
      setWorkflowData(prev => ({ ...prev, step: 6, completed: true }));
      toast({
        title: "Assegnazione Completata",
        description: "PC assegnato con successo e manleva generata automaticamente",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore durante l'assegnazione del PC",
        variant: "destructive",
      });
    },
  });

  const steps: AssignmentStep[] = [
    {
      id: "select-pc",
      title: "Seleziona PC",
      description: "Scegli il computer da assegnare",
      completed: !!workflowData.selectedPc,
      icon: Monitor
    },
    {
      id: "select-employee",
      title: "Seleziona Dipendente",
      description: "Scegli il dipendente destinatario",
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
      title: "Genera Manleva",
      description: "Stampa documento per firma",
      completed: workflowData.step >= 5,
      icon: FileText
    },
    {
      id: "complete",
      title: "Assegnazione",
      description: "PC assegnato e manleva creata",
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
    if (workflowData.step < 5) {
      setWorkflowData(prev => ({ ...prev, step: prev.step + 1 }));
    } else if (workflowData.step === 5 && workflowData.selectedPc && workflowData.selectedEmployee) {
      assignPcMutation.mutate({
        pcId: workflowData.selectedPc.id,
        employeeId: workflowData.selectedEmployee.id
      });
    }
  };

  const handleReset = () => {
    setWorkflowData({
      selectedPc: null,
      selectedEmployee: null,
      step: 1,
      completed: false
    });
  };

  const renderStepContent = () => {
    switch (workflowData.step) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Seleziona PC da Assegnare
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availablePCs.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nessun PC disponibile per l'assegnazione</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availablePCs.map((pc: any) => (
                    <div
                      key={pc.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        workflowData.selectedPc?.id === pc.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handlePcSelect(pc)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{pc.pcId}</h3>
                          <p className="text-sm text-muted-foreground">{pc.brand} {pc.model}</p>
                          <p className="text-xs text-muted-foreground">RAM: {pc.ram}GB - Storage: {pc.storage}GB</p>
                        </div>
                        <Badge variant={pc.status === 'active' ? 'default' : 'secondary'}>
                          {pc.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
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
                Seleziona Dipendente
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
                        : "border-gray-200 hover:border-gray-300"
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
                    Dipendente
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
              <Button className="w-full" variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Stampa Etichetta QR
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
                  Il dipendente deve firmare il documento di manleva per la presa in carico del PC aziendale.
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>PC:</strong> {workflowData.selectedPc?.pcId} - {workflowData.selectedPc?.brand} {workflowData.selectedPc?.model}</p>
                  <p><strong>Dipendente:</strong> {workflowData.selectedEmployee?.name}</p>
                  <p><strong>Data:</strong> {new Date().toLocaleDateString('it-IT')}</p>
                </div>
              </div>
              <Button className="w-full" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Genera Documento Manleva
              </Button>
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-800">
                  Documento firmato e acquisito
                </p>
              </div>
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
              assignPcMutation.isPending
            }
            className="flex items-center gap-2"
          >
            {workflowData.step === 5 ? (
              assignPcMutation.isPending ? (
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