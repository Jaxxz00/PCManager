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
  Package,
  Shield
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
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Scegli un PC..." />
                </SelectTrigger>
                <SelectContent 
                  className="z-[100] bg-white border border-gray-200 shadow-lg rounded-md max-h-60 overflow-y-auto"
                  position="popper"
                  sideOffset={4}
                >
                  {loadingPcs ? (
                    <SelectItem value="loading" disabled className="cursor-not-allowed opacity-50">
                      Caricamento...
                    </SelectItem>
                  ) : (
                    availablePcs.map((pc) => (
                      <SelectItem 
                        key={pc.id} 
                        value={pc.id}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        {pc.pcId} - {pc.brand} {pc.model} (S/N: {pc.serialNumber})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {selectedPcData && (
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Monitor className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">PC Selezionato</h3>
                      <p className="text-sm text-blue-700">Dettagli hardware e configurazione</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/50 rounded-lg p-3">
                      <Label className="font-medium text-blue-800">Marca e Modello</Label>
                      <p className="font-semibold text-gray-900">{selectedPcData.brand} {selectedPcData.model}</p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <Label className="font-medium text-blue-800">Numero Serie</Label>
                      <p className="font-semibold text-gray-900">{selectedPcData.serialNumber}</p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <Label className="font-medium text-blue-800">Processore</Label>
                      <p className="font-semibold text-gray-900">{selectedPcData.cpu || 'N/A'}</p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <Label className="font-medium text-blue-800">RAM</Label>
                      <p className="font-semibold text-gray-900">{selectedPcData.ram ? `${selectedPcData.ram}GB` : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">PC Disponibile per l'assegnazione</span>
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
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Scegli un dipendente..." />
                </SelectTrigger>
                <SelectContent 
                  className="z-[100] bg-white border border-gray-200 shadow-lg rounded-md max-h-60 overflow-y-auto"
                  position="popper"
                  sideOffset={4}
                >
                  {loadingEmployees ? (
                    <SelectItem value="loading" disabled className="cursor-not-allowed opacity-50">
                      Caricamento...
                    </SelectItem>
                  ) : (
                    employees.map((employee) => (
                      <SelectItem 
                        key={employee.id} 
                        value={employee.id}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        {employee.name} - {employee.department}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {selectedEmployeeData && (
              <Card className="bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-200 shadow-lg">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500 rounded-lg">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-emerald-900">Dipendente Destinatario</h3>
                      <p className="text-sm text-emerald-700">Informazioni del beneficiario dell'assegnazione</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/50 rounded-lg p-3">
                      <Label className="font-medium text-emerald-800">Nome Completo</Label>
                      <p className="font-semibold text-gray-900">{selectedEmployeeData.name}</p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <Label className="font-medium text-emerald-800">Email</Label>
                      <p className="font-semibold text-gray-900">{selectedEmployeeData.email}</p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <Label className="font-medium text-emerald-800">Dipartimento</Label>
                      <p className="font-semibold text-gray-900">{selectedEmployeeData.department}</p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <Label className="font-medium text-emerald-800">Posizione</Label>
                      <p className="font-semibold text-gray-900">{selectedEmployeeData.position}</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-emerald-100 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-800">Dipendente attivo e abilitato alle assegnazioni</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-xl border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-500 rounded-full">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-purple-900">Documento di Manleva</h3>
                  <p className="text-purple-700">Crea il documento ufficiale per l'assegnazione del dispositivo</p>
                </div>
              </div>
              
              <div className="bg-purple-100 border border-purple-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div className="text-sm text-purple-800">
                    <p className="font-medium mb-1">Protezione Legale Aziendale</p>
                    <p>Questo documento stabilisce responsabilità e condizioni d'uso del dispositivo assegnato, proteggendo sia l'azienda che il dipendente.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="purpose" className="text-base font-semibold text-purple-800">Scopo dell'Assegnazione</Label>
                <Input
                  id="purpose"
                  placeholder="Es: Sostituzione computer obsoleto, nuova assunzione, upgrade hardware..."
                  value={workflowData.manlevaDetails.purpose}
                  onChange={(e) => setWorkflowData(prev => ({
                    ...prev,
                    manlevaDetails: { ...prev.manlevaDetails, purpose: e.target.value }
                  }))}
                  className="bg-white border-purple-200 focus:border-purple-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="conditions" className="text-base font-semibold text-purple-800">Condizioni e Responsabilità</Label>
                <Textarea
                  id="conditions"
                  placeholder="Descrivi le condizioni d'uso, responsabilità del dipendente, obblighi di cura e conservazione del dispositivo..."
                  value={workflowData.manlevaDetails.conditions}
                  onChange={(e) => setWorkflowData(prev => ({
                    ...prev,
                    manlevaDetails: { ...prev.manlevaDetails, conditions: e.target.value }
                  }))}
                  rows={6}
                  className="bg-white border-purple-200 focus:border-purple-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="return-date" className="text-base font-semibold text-purple-800">Data Prevista Restituzione</Label>
                  <Input
                    id="return-date"
                    type="date"
                    value={workflowData.manlevaDetails.returnDate}
                    onChange={(e) => setWorkflowData(prev => ({
                      ...prev,
                      manlevaDetails: { ...prev.manlevaDetails, returnDate: e.target.value }
                    }))}
                    className="bg-white border-purple-200 focus:border-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-base font-semibold text-purple-800">Note Aggiuntive</Label>
                  <Input
                    id="notes"
                    placeholder="Accordi particolari, condizioni speciali..."
                    value={workflowData.manlevaDetails.notes}
                    onChange={(e) => setWorkflowData(prev => ({
                      ...prev,
                      manlevaDetails: { ...prev.manlevaDetails, notes: e.target.value }
                    }))}
                    className="bg-white border-purple-200 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center bg-gradient-to-br from-orange-50 to-amber-100 p-6 rounded-xl border border-orange-200">
              <div className="p-3 bg-orange-500 rounded-full inline-block mb-4">
                <Printer className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-orange-900 mb-2">Creazione Etichetta Professionale</h3>
              <p className="text-orange-700 mb-4">
                L'etichetta sarà generata con i dati del PC selezionato seguendo lo standard aziendale Maori Group
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-orange-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Logo aziendale incluso</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Codice a barre leggibile</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Formato 5x3cm</span>
                </div>
              </div>
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
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-red-50 to-rose-100 p-6 rounded-xl border border-red-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-500 rounded-full">
                  <CheckSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-red-900">Controlli Finali di Qualità</h3>
                  <p className="text-red-700">Verifica finale prima della consegna ufficiale</p>
                </div>
              </div>
              
              <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">Lista di Controllo Obbligatoria</p>
                    <p>Tutti i controlli devono essere completati prima di procedere alla consegna finale del dispositivo.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {[
                { 
                  key: 'documentsSigned', 
                  label: 'Manleva firmata dal dipendente',
                  description: 'Documento di responsabilità firmato e datato',
                  icon: FileText,
                  color: 'blue'
                },
                { 
                  key: 'labelApplied', 
                  label: 'Etichetta applicata sul PC',
                  description: 'Etichetta identificativa correttamente posizionata',
                  icon: Tag,
                  color: 'green'
                },
                { 
                  key: 'pcTested', 
                  label: 'PC testato e funzionante',
                  description: 'Verifica accensione, login e funzionalità base',
                  icon: Monitor,
                  color: 'purple'
                },
                { 
                  key: 'employeeNotified', 
                  label: 'Dipendente informato delle procedure',
                  description: 'Spiegazione delle responsabilità e procedure',
                  icon: User,
                  color: 'orange'
                }
              ].map((check) => {
                const CheckIcon = check.icon;
                const isChecked = workflowData.finalChecks[check.key as keyof typeof workflowData.finalChecks];
                
                return (
                  <Card key={check.key} className={`transition-all duration-300 ${
                    isChecked 
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-md' 
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <Checkbox
                          id={check.key}
                          checked={isChecked}
                          onCheckedChange={(checked) => 
                            setWorkflowData(prev => ({
                              ...prev,
                              finalChecks: {
                                ...prev.finalChecks,
                                [check.key]: checked as boolean
                              }
                            }))
                          }
                          className="mt-1"
                        />
                        <div className={`p-2 rounded-lg ${
                          isChecked ? 'bg-green-500' : 'bg-gray-400'
                        }`}>
                          <CheckIcon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor={check.key} className={`font-semibold cursor-pointer ${
                            isChecked ? 'text-green-800' : 'text-gray-700'
                          }`}>
                            {check.label}
                          </Label>
                          <p className={`text-sm mt-1 ${
                            isChecked ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {check.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="text-center space-y-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-8 rounded-2xl border border-green-200">
              <div className="p-4 bg-green-500 rounded-full inline-block mb-6 shadow-lg">
                <Package className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-green-900 mb-3">🎉 Processo Completato con Successo!</h3>
              <p className="text-green-700 text-lg">
                Il PC è stato assegnato con successo a <span className="font-semibold">{selectedEmployeeData?.name}</span>
              </p>
              
              <div className="flex items-center justify-center gap-6 mt-6 text-sm text-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Documentazione completa</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Etichetta applicata</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Controlli superati</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mt-8">
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200 shadow-lg">
                <CardContent className="pt-6 text-center">
                  <div className="p-3 bg-blue-500 rounded-full inline-block mb-4">
                    <Monitor className="h-6 w-6 text-white" />
                  </div>
                  <div className="font-semibold text-blue-900 text-lg mb-2">PC Assegnato</div>
                  <div className="text-blue-700 font-medium">{selectedPcData?.pcId}</div>
                  <div className="text-blue-600 text-sm mt-2">{selectedPcData?.brand} {selectedPcData?.model}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 shadow-lg">
                <CardContent className="pt-6 text-center">
                  <div className="p-3 bg-purple-500 rounded-full inline-block mb-4">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="font-semibold text-purple-900 text-lg mb-2">Beneficiario</div>
                  <div className="text-purple-700 font-medium">{selectedEmployeeData?.name}</div>
                  <div className="text-purple-600 text-sm mt-2">{selectedEmployeeData?.department}</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-8">
              <Button 
                onClick={handleFinalSubmit}
                disabled={assignPcMutation.isPending}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                {assignPcMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Salvando nel sistema...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-3 h-5 w-5" />
                    Finalizza Assegnazione nel Database
                  </>
                )}
              </Button>
            </div>
            
            {steps.filter(s => s.completed).length === 6 && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <CheckSquare className="h-5 w-5" />
                  <span className="font-medium">Tutti i passaggi sono stati completati con successo!</span>
                </div>
              </div>
            )}
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
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-lg">
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
                      flex items-center justify-center w-14 h-14 rounded-full border-3 shadow-lg transition-all duration-300 
                      ${isCompleted ? 'bg-gradient-to-br from-green-400 to-green-600 border-green-500 text-white shadow-green-200' :
                        isActive ? 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-500 text-white shadow-blue-200 scale-110' :
                        'bg-gradient-to-br from-gray-200 to-gray-300 border-gray-400 text-gray-600 shadow-gray-100'}
                    `}>
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : <StepIcon className="w-6 h-6" />}
                    </div>
                    <div className="mt-3 text-center max-w-20">
                      <div className={`text-xs font-semibold leading-tight ${
                        isActive ? 'text-blue-800' : isCompleted ? 'text-green-800' : 'text-gray-600'
                      }`}>
                        {step.title}
                      </div>
                      <div className={`text-xs mt-1 ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {step.description}
                      </div>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-3 rounded-full transition-all duration-500 ${
                      step.completed ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-sm' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center text-white">
            {(() => {
              const StepIcon = steps[currentStep - 1].icon;
              return (
                <div className="p-2 bg-white/20 rounded-lg mr-3">
                  <StepIcon className="h-5 w-5" />
                </div>
              );
            })()}
            <div>
              <div className="text-xl font-bold">{steps[currentStep - 1].title}</div>
              <div className="text-indigo-100 text-sm font-normal mt-1">{steps[currentStep - 1].description}</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card className="bg-gradient-to-r from-gray-50 to-slate-100 border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 1}
              className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 shadow-sm disabled:opacity-50 px-6 py-3"
              size="lg"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Passo Precedente
            </Button>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Progresso Workflow</div>
              <div className="text-lg font-semibold text-gray-800">{currentStep} di {steps.length} completati</div>
            </div>
            
            <Button 
              onClick={nextStep}
              disabled={!canProceedToNext() || currentStep === steps.length}
              className={`px-6 py-3 font-semibold shadow-lg transition-all duration-300 ${
                currentStep === steps.length 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              size="lg"
            >
              {currentStep === steps.length ? (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Workflow Completato
                </>
              ) : (
                <>
                  Prossimo Passo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}