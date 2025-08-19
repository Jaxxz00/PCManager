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

  const filteredEmployees = employees.filter(employee =>
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
      <div className="bg-gradient-to-r from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-md rounded-xl p-8 border border-slate-700/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestione Dipendenti</h1>
            <p className="text-slate-400">
              Organico aziendale e assegnazioni PC - {employees.length} dipendenti registrati
            </p>
          </div>
          <Dialog open={showEmployeeForm} onOpenChange={setShowEmployeeForm}>
            <DialogTrigger asChild>
              <Button className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg">
                <Plus className="mr-2 h-5 w-5" />
                Aggiungi Dipendente
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900/95 backdrop-blur-md border-slate-800/50">
              <DialogHeader>
                <DialogTitle className="text-white text-xl">Aggiungi Nuovo Dipendente</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">Nome Completo</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Mario Rossi" 
                            className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-400"
                            {...field} 
                          />
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
                        <FormLabel className="text-slate-200">Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="mario.rossi@company.com"
                            className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-400"
                            {...field} 
                          />
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
                        <FormLabel className="text-slate-200">Dipartimento</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="IT, Marketing, Sales..."
                            className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-400"
                            {...field} 
                          />
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
                        <FormLabel className="text-slate-200">Posizione</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Developer, Manager..."
                            className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-400"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-3 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEmployeeForm(false)}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Annulla
                    </Button>
                    <Button
                      type="submit"
                      disabled={createEmployeeMutation.isPending}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      {createEmployeeMutation.isPending ? "Salvataggio..." : "Salva"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-slate-900/60 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Cerca per nome, email, dipartimento o posizione..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-400 focus:border-slate-600/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card className="bg-slate-900/60 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardHeader className="border-b border-slate-700/40 bg-slate-800/30">
          <CardTitle className="flex items-center text-white text-xl font-semibold">
            <User className="mr-3 h-6 w-6 text-slate-300" />
            Lista Dipendenti ({filteredEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/30 hover:bg-slate-800/30">
                  <TableHead className="text-slate-300 font-semibold">Nome</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Email</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Dipartimento</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Posizione</TableHead>
                  <TableHead className="text-slate-300 font-semibold">PC Assegnati</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Data Inserimento</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-slate-800/30">
                      {[...Array(7)].map((_, j) => (
                        <TableCell key={j} className="animate-pulse">
                          <div className="h-4 bg-slate-700 rounded w-20"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee: Employee) => (
                    <TableRow 
                      key={employee.id} 
                      className="border-slate-800/30 hover:bg-slate-800/50 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg"
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-slate-700/40 rounded-lg border border-slate-600/30">
                            <User className="h-4 w-4 text-slate-300" />
                          </div>
                          <span className="font-semibold text-white">{employee.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{employee.email}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-700/40 text-slate-200 border border-slate-600/30">
                          {employee.department}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-300">{employee.position}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-white">{getEmployeePcCount(employee.id)}</span>
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString('it-IT') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-900/95 backdrop-blur-md border-slate-800/50">
                            <DropdownMenuItem 
                              onClick={() => {
                                toast({
                                  title: "Funzione in sviluppo",
                                  description: "La modifica dipendente sarà disponibile prossimamente.",
                                });
                              }}
                              className="text-slate-300 hover:bg-slate-800/50"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Modifica
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="text-red-400 hover:bg-red-900/20"
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
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-400 text-lg mb-2">Nessun dipendente trovato</p>
                      <p className="text-slate-500 text-sm">
                        {employees.length === 0 
                          ? "Inizia aggiungendo il primo dipendente al sistema"
                          : "Prova a modificare i criteri di ricerca"
                        }
                      </p>
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