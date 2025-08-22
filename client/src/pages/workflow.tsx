import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  ArrowLeft, 
  Monitor, 
  User, 
  FileText, 
  Tag, 
  CheckSquare,
  Printer,
  Package
} from 'lucide-react';
import type { Pc, Employee } from '@shared/schema';

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
}

const initialSteps: WorkflowStep[] = [
  {
    id: 1,
    title: "Selezione PC",
    description: "Scegli il computer da assegnare",
    icon: Monitor,
    completed: false
  },
  {
    id: 2,
    title: "Assegnazione Dipendente",
    description: "Seleziona il dipendente destinatario",
    icon: User,
    completed: false
  },
  {
    id: 3,
    title: "Generazione Manleva",
    description: "Crea e compila il documento di manleva",
    icon: FileText,
    completed: false
  },
  {
    id: 4,
    title: "Creazione Etichetta",
    description: "Genera l'etichetta identificativa",
    icon: Tag,
    completed: false
  },
  {
    id: 5,
    title: "Controllo e Verifica",
    description: "Verifica tutti i documenti e l'etichetta",
    icon: CheckSquare,
    completed: false
  },
  {
    id: 6,
    title: "Consegna Finale",
    description: "Completamento del processo di consegna",
    icon: Package,
    completed: false
  }
];

export default function WorkflowPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [steps, setSteps] = useState(initialSteps);
  const [workflowData, setWorkflowData] = useState({
    selectedPc: '',
    selectedEmployee: '',
    manlevaDetails: {
      purpose: '',
      conditions: '',
      returnDate: '',
      notes: ''
    },
    labelCreated: false,
    finalChecks: {
      documentsSigned: false,
      labelApplied: false,
      pcTested: false,
      employeeNotified: false
    }
  });

  // API calls
  const { data: pcs = [], isLoading: loadingPcs } = useQuery<Pc[]>({
    queryKey: ['/api/pcs']
  });

  const { data: employees = [], isLoading: loadingEmployees } = useQuery<Employee[]>({
    queryKey: ['/api/employees']
  });

  const assignPcMutation = useMutation({
    mutationFn: async (data: { pcId: string; employeeId: string }) => {
      return apiRequest(`/api/pcs/${data.pcId}/assign`, 'POST', { employeeId: data.employeeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pcs'] });
      toast({
        title: "Successo",
        description: "PC assegnato correttamente al dipendente"
      });
    }
  });

  const availablePcs = pcs.filter(pc => pc.status === 'DISPONIBILE');
  const selectedPcData = pcs.find(pc => pc.id === workflowData.selectedPc);
  const selectedEmployeeData = employees.find(emp => emp.id === workflowData.selectedEmployee);

  const markStepCompleted = (stepId: number) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      markStepCompleted(currentStep);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmit = async () => {
    if (workflowData.selectedPc && workflowData.selectedEmployee) {
      try {
        await assignPcMutation.mutateAsync({
          pcId: workflowData.selectedPc,
          employeeId: workflowData.selectedEmployee
        });
        markStepCompleted(6);
        toast({
          title: "Processo Completato!",
          description: "Il PC è stato assegnato con successo e tutti i documenti sono pronti."
        });
      } catch (error) {
        toast({
          title: "Errore",
          description: "Errore durante l'assegnazione del PC",
          variant: "destructive"
        });
      }
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return workflowData.selectedPc !== '';
      case 2:
        return workflowData.selectedEmployee !== '';
      case 3:
        return workflowData.manlevaDetails.purpose !== '' && workflowData.manlevaDetails.conditions !== '';
      case 4:
        return workflowData.labelCreated;
      case 5:
        return Object.values(workflowData.finalChecks).every(check => check);
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pc-select">Seleziona PC Disponibile</Label>
              <Select 
                value={workflowData.selectedPc} 
                onValueChange={(value) => setWorkflowData(prev => ({ ...prev, selectedPc: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Scegli un PC..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingPcs ? (
                    <SelectItem value="loading" disabled>Caricamento...</SelectItem>
                  ) : (
                    availablePcs.map((pc) => (
                      <SelectItem key={pc.id} value={pc.id}>
                        {pc.pcId} - {pc.brand} {pc.model} (S/N: {pc.serialNumber})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {selectedPcData && (
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="font-medium">Marca e Modello</Label>
                      <p>{selectedPcData.brand} {selectedPcData.model}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Numero Serie</Label>
                      <p>{selectedPcData.serialNumber}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Processore</Label>
                      <p>{selectedPcData.cpu || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="font-medium">RAM</Label>
                      <p>{selectedPcData.ram || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee-select">Seleziona Dipendente</Label>
              <Select 
                value={workflowData.selectedEmployee} 
                onValueChange={(value) => setWorkflowData(prev => ({ ...prev, selectedEmployee: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Scegli un dipendente..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingEmployees ? (
                    <SelectItem value="loading" disabled>Caricamento...</SelectItem>
                  ) : (
                    employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.department}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {selectedEmployeeData && (
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="font-medium">Nome Completo</Label>
                      <p>{selectedEmployeeData.name}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Email</Label>
                      <p>{selectedEmployeeData.email}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Dipartimento</Label>
                      <p>{selectedEmployeeData.department}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Posizione</Label>
                      <p>{selectedEmployeeData.position}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purpose">Scopo dell'Assegnazione</Label>
              <Input
                id="purpose"
                placeholder="Es: Sostituzione computer obsoleto, nuova assunzione..."
                value={workflowData.manlevaDetails.purpose}
                onChange={(e) => setWorkflowData(prev => ({
                  ...prev,
                  manlevaDetails: { ...prev.manlevaDetails, purpose: e.target.value }
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="conditions">Condizioni e Responsabilità</Label>
              <Textarea
                id="conditions"
                placeholder="Descrivi le condizioni d'uso e responsabilità del dipendente..."
                value={workflowData.manlevaDetails.conditions}
                onChange={(e) => setWorkflowData(prev => ({
                  ...prev,
                  manlevaDetails: { ...prev.manlevaDetails, conditions: e.target.value }
                }))}
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="return-date">Data Prevista Restituzione</Label>
                <Input
                  id="return-date"
                  type="date"
                  value={workflowData.manlevaDetails.returnDate}
                  onChange={(e) => setWorkflowData(prev => ({
                    ...prev,
                    manlevaDetails: { ...prev.manlevaDetails, returnDate: e.target.value }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Note Aggiuntive</Label>
                <Input
                  id="notes"
                  placeholder="Note opzionali..."
                  value={workflowData.manlevaDetails.notes}
                  onChange={(e) => setWorkflowData(prev => ({
                    ...prev,
                    manlevaDetails: { ...prev.manlevaDetails, notes: e.target.value }
                  }))}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Printer className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Creazione Etichetta</h3>
              <p className="text-muted-foreground mb-4">
                L'etichetta sarà generata con i dati del PC selezionato
              </p>
            </div>
            
            {selectedPcData && (
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="text-center space-y-2">
                    <div className="text-sm font-medium">Anteprima Etichetta</div>
                    <div className="border-2 border-dashed border-border p-4 rounded-lg inline-block">
                      <div className="text-xs space-y-1">
                        <div className="font-medium">{selectedPcData.brand} {selectedPcData.model}</div>
                        <div>S/N: {selectedPcData.serialNumber}</div>
                        <div className="text-xs text-muted-foreground">info@maorigroup.it</div>
                        <div className="w-16 h-3 bg-gray-900 mx-auto mt-2"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-center">
                    <Button 
                      onClick={() => {
                        setWorkflowData(prev => ({ ...prev, labelCreated: true }));
                        toast({
                          title: "Etichetta Creata",
                          description: "L'etichetta è stata generata e può essere stampata"
                        });
                      }}
                      disabled={workflowData.labelCreated}
                    >
                      {workflowData.labelCreated ? "Etichetta Creata" : "Genera Etichetta"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Controlli Finali</h3>
            <p className="text-muted-foreground">
              Verifica che tutti i passaggi siano stati completati correttamente
            </p>
            
            <div className="space-y-3">
              {[
                { key: 'documentsSigned', label: 'Manleva firmata dal dipendente' },
                { key: 'labelApplied', label: 'Etichetta applicata sul PC' },
                { key: 'pcTested', label: 'PC testato e funzionante' },
                { key: 'employeeNotified', label: 'Dipendente informato delle procedure' }
              ].map((check) => (
                <div key={check.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={check.key}
                    checked={workflowData.finalChecks[check.key as keyof typeof workflowData.finalChecks]}
                    onCheckedChange={(checked) => 
                      setWorkflowData(prev => ({
                        ...prev,
                        finalChecks: {
                          ...prev.finalChecks,
                          [check.key]: checked as boolean
                        }
                      }))
                    }
                  />
                  <Label htmlFor={check.key}>{check.label}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
            <h3 className="text-xl font-medium">Consegna Completata!</h3>
            <p className="text-muted-foreground">
              Il PC è stato assegnato con successo a {selectedEmployeeData?.name}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="font-medium text-green-800">PC Assegnato</div>
                  <div className="text-green-700">{selectedPcData?.pcId}</div>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="font-medium text-blue-800">Dipendente</div>
                  <div className="text-blue-700">{selectedEmployeeData?.name}</div>
                </CardContent>
              </Card>
            </div>
            
            <Button 
              onClick={handleFinalSubmit}
              disabled={assignPcMutation.isPending}
              className="mt-6"
            >
              {assignPcMutation.isPending ? "Salvando..." : "Finalizza Assegnazione"}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-foreground">Workflow Assegnazione PC</h1>
          <p className="text-muted-foreground">Processo guidato dalla selezione alla consegna completa</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Passo {currentStep} di {steps.length}
          </Badge>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.completed;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 
                      ${isCompleted ? 'bg-green-100 border-green-500 text-green-700' :
                        isActive ? 'bg-blue-100 border-blue-500 text-blue-700' :
                        'bg-gray-100 border-gray-300 text-gray-500'}
                    `}>
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                    </div>
                    <div className="mt-2 text-center">
                      <div className={`text-xs font-medium ${
                        isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </div>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 ${
                      step.completed ? 'bg-green-300' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {(() => {
              const StepIcon = steps[currentStep - 1].icon;
              return <StepIcon className="mr-2 h-5 w-5" />;
            })()}
            {steps[currentStep - 1].title}
          </CardTitle>
          <p className="text-muted-foreground">{steps[currentStep - 1].description}</p>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Indietro
        </Button>
        
        <Button 
          onClick={nextStep}
          disabled={!canProceedToNext() || currentStep === steps.length}
        >
          {currentStep === steps.length ? "Completato" : "Avanti"}
          {currentStep < steps.length && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}