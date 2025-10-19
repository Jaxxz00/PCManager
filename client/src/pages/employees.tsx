import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Plus, Search, MoreHorizontal, Edit, Trash2, User, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmployeeSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { z } from "zod";
import type { Employee, Asset } from "@shared/schema";

type EmployeeFormData = z.infer<typeof insertEmployeeSchema>;

export default function Employees() {
  const [, setLocation] = useLocation();
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Usa solo la ricerca locale ora che abbiamo il dialog globale
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets/all-including-pcs"],
  });

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      name: "",
      email: "",
      department: "",
      company: "Maori Group",
    },
    mode: "onChange", // Validazione in tempo reale
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const response = await apiRequest("POST", "/api/employees", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets/all-including-pcs"] });
      toast({
        title: "Collaboratore aggiunto",
        description: "Il nuovo collaboratore è stato registrato nel sistema.",
      });
      form.reset();
      setShowEmployeeForm(false);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Impossibile aggiungere il collaboratore.";
      toast({
        title: "Errore",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Callback ottimizzato per la creazione
  const handleCreateEmployee = useCallback((data: EmployeeFormData) => {
    createEmployeeMutation.mutate(data);
  }, [createEmployeeMutation]);

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets/all-including-pcs"] });
      toast({
        title: "Collaboratore eliminato",
        description: "Il collaboratore è stato rimosso dal sistema.",
      });
    },
    onError: (error: any) => {
      const message = error?.message || "Impossibile eliminare il collaboratore.";
      toast({
        title: "Errore",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Callback ottimizzato per l'eliminazione sarà definito dopo

  const filteredEmployees = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return employees;
    }
    
    const result = employees.filter((employee) => {
      const searchLower = debouncedSearch.toLowerCase();
      const matches = (
        (employee.name || '').toLowerCase().includes(searchLower) ||
        (employee.email || '').toLowerCase().includes(searchLower) ||
        (employee.department || '').toLowerCase().includes(searchLower) ||
        (employee.company || '').toLowerCase().includes(searchLower) ||
        (employee.id || '').toLowerCase().includes(searchLower)
      );
      return matches;
    });
    
    return result;
  }, [employees, debouncedSearch]);

  const getEmployeeAssetCount = (employeeId: string) => {
    return assets.filter((asset) => asset.employeeId === employeeId).length;
  };


  const handleDeleteEmployee = useCallback((id: string) => {
    const assignedAssets = getEmployeeAssetCount(id);
    if (assignedAssets > 0) {
      toast({
        title: "Impossibile eliminare",
        description: `Il collaboratore ha ${assignedAssets} asset assegnati. Rimuovere prima le assegnazioni.`,
        variant: "destructive",
      });
      return;
    }

    if (window.confirm("Sei sicuro di voler eliminare questo collaboratore?")) {
      deleteEmployeeMutation.mutate(id);
    }
  }, [deleteEmployeeMutation, toast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Collaboratori</h1>
          <p className="text-muted-foreground">Gestione collaboratori aziendali - {employees.length} totali</p>
        </div>
        <Dialog open={showEmployeeForm} onOpenChange={setShowEmployeeForm}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Collaboratore
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aggiungi Nuovo Collaboratore</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateEmployee)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome e Cognome</FormLabel>
                      <FormControl>
                        <Input placeholder="Inserisci nome e cognome" className="placeholder:text-gray-400" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Inserisci la mail" className="placeholder:text-gray-400" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dipartimento</FormLabel>
                      <FormControl>
                        <Input placeholder="IT, Marketing, Sales..." className="placeholder:text-gray-400" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Azienda</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="ALL AROUND S.R.L.">ALL AROUND S.R.L.</option>
                          <option value="BEYOND US S.R.L.">BEYOND US S.R.L.</option>
                          <option value="CALLX4 S.R.L.">CALLX4 S.R.L.</option>
                          <option value="DITIFET S.R.L.">DITIFET S.R.L.</option>
                          <option value="FILIPPELLI SERGIO S.R.L.">FILIPPELLI SERGIO S.R.L.</option>
                          <option value="HAMMER AND DRILL S.R.L.">HAMMER AND DRILL S.R.L.</option>
                          <option value="MAORI ESCO S.R.L.">MAORI ESCO S.R.L.</option>
                          <option value="PANIER S.R.L.">PANIER S.R.L.</option>
                          <option value="RED BRICK S.R.L.">RED BRICK S.R.L.</option>
                          <option value="SEKSTANT S.R.L.">SEKSTANT S.R.L.</option>
                          <option value="SKIPPER S.R.L.">SKIPPER S.R.L.</option>
                          <option value="SPEAK OVER DI MARCO FILIPPELLI S.R.L.">SPEAK OVER DI MARCO FILIPPELLI S.R.L.</option>
                          <option value="SPEAK OVER S.R.L.">SPEAK OVER S.R.L.</option>
                          <option value="TF S.R.L.">TF S.R.L.</option>
                          <option value="WE ON IT S.R.L.">WE ON IT S.R.L.</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEmployeeForm(false);
                      form.reset();
                    }}
                  >
                    Annulla
                  </Button>
                  <Button
                    type="submit"
                    disabled={createEmployeeMutation.isPending || !form.formState.isValid}
                    className="bg-blue-600 text-white disabled:opacity-50"
                  >
                    {createEmployeeMutation.isPending ? "Salvataggio..." : "Salva"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Cerca collaboratori..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Collaboratori ({filteredEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium min-w-[150px]">Nome</TableHead>
                  <TableHead className="font-medium min-w-[200px]">Email</TableHead>
                  <TableHead className="font-medium min-w-[120px]">Azienda</TableHead>
                  <TableHead className="font-medium min-w-[120px]">Dipartimento</TableHead>
                  <TableHead className="font-medium min-w-[120px]">PC Assegnati</TableHead>
                  <TableHead className="font-medium min-w-[120px]">Data Inserimento</TableHead>
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
                ) : filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee: Employee) => (
                    <TableRow key={employee.id} className="table-row-hover cursor-pointer" onClick={() => { sessionStorage.setItem('selectedEmployeeId', employee.id); setLocation(`/assigned-devices?employeeId=${employee.id}`); }}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{employee.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{employee.email}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                          {employee.company || 'Maori Group'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {employee.department}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{getEmployeeAssetCount(employee.id)}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString('it-IT') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="dropdown-menu-enhanced">
                            <DropdownMenuItem 
                              onClick={() => {
                                toast({
                                  title: "Funzione in sviluppo",
                                  description: "La modifica collaboratore sarà disponibile prossimamente.",
                                });
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Modifica
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteEmployee(employee.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Elimina
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {searchTerm ? "Nessun collaboratore corrisponde alla ricerca" : "Nessun collaboratore trovato"}
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
