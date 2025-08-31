import { useState, useMemo } from "react";
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
import type { Employee } from "@shared/schema";

type EmployeeFormData = z.infer<typeof insertEmployeeSchema>;

export default function Employees() {
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Usa solo la ricerca locale ora che abbiamo il dialog globale
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: pcs = [] } = useQuery<any[]>({
    queryKey: ["/api/pcs"],
  });

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      name: "",
      email: "",
      department: "",
      position: "",
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const response = await apiRequest("POST", "/api/employees", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Dipendente aggiunto",
        description: "Il nuovo dipendente è stato registrato nel sistema.",
      });
      form.reset();
      setShowEmployeeForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiungere il dipendente.",
        variant: "destructive",
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Dipendente eliminato",
        description: "Il dipendente è stato rimosso dal sistema.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare il dipendente.",
        variant: "destructive",
      });
    },
  });

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
        (employee.position || '').toLowerCase().includes(searchLower) ||
        (employee.id || '').toLowerCase().includes(searchLower)
      );
      return matches;
    });
    
    return result;
  }, [employees, debouncedSearch]);

  const getEmployeePcCount = (employeeId: string) => {
    return pcs.filter((pc: any) => pc.employeeId === employeeId).length;
  };

  const onSubmit = (data: EmployeeFormData) => {
    createEmployeeMutation.mutate(data);
  };

  const handleDeleteEmployee = (id: string) => {
    const assignedPcs = getEmployeePcCount(id);
    if (assignedPcs > 0) {
      toast({
        title: "Impossibile eliminare",
        description: `Il dipendente ha ${assignedPcs} PC assegnati. Rimuovere prima le assegnazioni.`,
        variant: "destructive",
      });
      return;
    }

    if (window.confirm("Sei sicuro di voler eliminare questo dipendente?")) {
      deleteEmployeeMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dipendenti</h1>
          <p className="text-muted-foreground">Gestione dipendenti aziendali - {employees.length} totali</p>
        </div>
        <Dialog open={showEmployeeForm} onOpenChange={setShowEmployeeForm}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Dipendente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aggiungi Nuovo Dipendente</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Mario Rossi" {...field} />
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
                        <Input type="email" placeholder="mario.rossi@company.com" {...field} />
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
                        <Input placeholder="IT, Marketing, Sales..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posizione</FormLabel>
                      <FormControl>
                        <Input placeholder="Developer, Manager..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEmployeeForm(false)}
                  >
                    Annulla
                  </Button>
                  <Button
                    type="submit"
                    disabled={createEmployeeMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
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
          placeholder="Cerca dipendenti..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Dipendenti ({filteredEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium min-w-[150px]">Nome</TableHead>
                  <TableHead className="font-medium min-w-[200px]">Email</TableHead>
                  <TableHead className="font-medium min-w-[120px]">Dipartimento</TableHead>
                  <TableHead className="font-medium min-w-[120px]">Posizione</TableHead>
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
                    <TableRow key={employee.id} className="table-row-hover">
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
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {employee.department}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{employee.position}</TableCell>
                      <TableCell>
                        <span className="font-medium">{getEmployeePcCount(employee.id)}</span>
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
                                  description: "La modifica dipendente sarà disponibile prossimamente.",
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
                      {searchTerm ? "Nessun dipendente corrisponde alla ricerca" : "Nessun dipendente trovato"}
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
