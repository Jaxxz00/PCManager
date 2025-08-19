import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MoreHorizontal, Edit, Trash2, User } from "lucide-react";
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

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="space-y-8 p-2">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-900/50 via-purple-900/30 to-indigo-900/50 backdrop-blur-md rounded-2xl p-8 border border-slate-800/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestione Dipendenti</h1>
            <p className="text-slate-300 bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Organico aziendale e assegnazioni PC - {employees.length} dipendenti registrati
            </p>
          </div>
          <Dialog open={showEmployeeForm} onOpenChange={setShowEmployeeForm}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-xl border-0 text-white px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105">
                <Plus className="mr-2 h-5 w-5" />
                Aggiungi Dipendente
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      <Card className="bg-slate-900/70 backdrop-blur-md border-slate-800/50 shadow-2xl">
        <CardHeader className="border-b border-slate-800/50 bg-gradient-to-r from-slate-900/50 to-purple-900/30">
          <CardTitle className="flex items-center text-white text-xl font-semibold">
            <User className="mr-3 h-6 w-6 text-purple-400" />
            Lista Dipendenti ({filteredEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium">Nome</TableHead>
                  <TableHead className="font-medium">Email</TableHead>
                  <TableHead className="font-medium">Dipartimento</TableHead>
                  <TableHead className="font-medium">Posizione</TableHead>
                  <TableHead className="font-medium">PC Assegnati</TableHead>
                  <TableHead className="font-medium">Data Inserimento</TableHead>
                  <TableHead className="w-12"></TableHead>
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
                          <DropdownMenuContent align="end">
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
