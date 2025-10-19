import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { type User } from "@shared/schema";
import { 
  Mail, 
  Users,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  Smartphone,
  KeyRound
} from "lucide-react";

// Schema per creazione utente
const createUserSchema = z.object({
  email: z.string().email("Email non valida"),
  firstName: z.string().min(1, "Nome richiesto"),
  lastName: z.string().min(1, "Cognome richiesto"),
  password: z.string().min(6, "Password deve essere almeno 6 caratteri"),
  role: z.enum(["admin", "user"], { errorMap: () => ({ message: "Seleziona un ruolo" }) }),
});

type CreateUserData = z.infer<typeof createUserSchema>;

export default function Settings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Gestione Utenti</h1>
          <p className="text-muted-foreground">Crea e gestisci gli utenti del sistema</p>
        </div>
      </div>

      {/* Content */}
      <UserManagement />
    </div>
  );
}

function UserManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const { toast } = useToast();

  // Form per creare utente
  const createForm = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      role: "user",
    },
  });

  // Query per lista utenti
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Mutation per creare utente
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await apiRequest("POST", "/api/users", data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Utente creato",
        description: "Utente creato con successo",
      });
      setShowCreateDialog(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare l'utente",
        variant: "destructive",
      });
    },
  });

  // Mutation per eliminare utente
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Utente eliminato",
        description: "L'utente è stato rimosso dal sistema",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare l'utente",
        variant: "destructive",
      });
    },
  });

  // Mutation per toggle attivo/inattivo
  const toggleUserMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/users/${userId}`, { isActive });
    },
    onSuccess: () => {
      toast({
        title: "Stato aggiornato",
        description: "Lo stato dell'utente è stato modificato",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utenti Totali</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utenti Attivi</p>
                <p className="text-2xl font-bold">{users.filter(u => u.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Amministratori</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5" />
              Gestione Utenti
            </CardTitle>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Utente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Toolbar: ricerca e filtri */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="col-span-2">
              <Input placeholder="Cerca nome, username o email" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select value={roleFilter} onChange={(e)=>setRoleFilter(e.target.value as any)} className="h-10 px-3 py-2 text-sm border border-input bg-background rounded-md">
              <option value="all">Tutti i ruoli</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value as any)} className="h-10 px-3 py-2 text-sm border border-input bg-background rounded-md">
              <option value="all">Tutti gli stati</option>
              <option value="active">Attivi</option>
              <option value="inactive">Sospesi</option>
            </select>
          </div>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-muted-foreground mt-2">Caricamento...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nessun utente trovato</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utente</TableHead>
                    <TableHead>Ruolo</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users
                    .filter(u => {
                      const q = search.toLowerCase();
                      const matches = !q || (
                        (u.firstName+" "+u.lastName).toLowerCase().includes(q) ||
                        (u.username||"").toLowerCase().includes(q) ||
                        (u.email||"").toLowerCase().includes(q)
                      );
                      const roleOk = roleFilter === 'all' || u.role === roleFilter;
                      const statusOk = statusFilter === 'all' || (statusFilter==='active' ? u.isActive : !u.isActive);
                      return matches && roleOk && statusOk;
                    })
                    .sort((a,b)=> (b.lastLogin? new Date(b.lastLogin).getTime():0) - (a.lastLogin? new Date(a.lastLogin).getTime():0))
                    .map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? 'Admin' : 'User'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newRole = user.role === 'admin' ? 'user' : 'admin';
                              if (confirm(`Cambiare il ruolo di ${user.username} da ${user.role} a ${newRole}?`)) {
                                apiRequest("PATCH", `/api/users/${user.id}`, { role: newRole })
                                  .then(() => {
                                    toast({ title: "Ruolo aggiornato", description: `Ruolo cambiato a ${newRole}` });
                                    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
                                  })
                                  .catch((e: any) => {
                                    toast({ title: "Errore", description: e?.message || "Impossibile aggiornare il ruolo", variant: "destructive" });
                                  });
                              }
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'outline'} 
                               className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {user.isActive ? 'Attivo' : 'Sospeso'}
                        </Badge>
                      </TableCell>
                      {/* Colonna 2FA nascosta */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* Rigenera invito rimosso su richiesta */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const pwd = prompt(`Nuova password per ${user.username}`);
                            if (!pwd) return;
                            try {
                              await apiRequest("POST", `/api/users/${user.id}/set-password`, { password: pwd });
                              toast({ title: "Password aggiornata", description: "Password impostata con successo" });
                            } catch (e: any) {
                              toast({ title: "Errore", description: e?.message || "Impossibile impostare la password", variant: "destructive" });
                            }
                          }}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleUserMutation.mutate({ 
                              userId: user.id, 
                              isActive: !user.isActive 
                            })}
                            disabled={toggleUserMutation.isPending}
                          >
                            {user.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteUserMutation.mutate(user.id)}
                            disabled={deleteUserMutation.isPending}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog per creare nuovo utente */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Plus className="h-5 w-5" />
              Crea Nuovo Utente
            </DialogTitle>
          </DialogHeader>

          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((data) => createUserMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cognome</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Cognome" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="Email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <Label>Ruolo</Label>
                <select
                  value={createForm.watch("role")}
                  onChange={(e) => createForm.setValue("role", e.target.value as "admin" | "user")}
                  className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="user">👤 Utente Standard</option>
                  <option value="admin">🔧 Amministratore</option>
                </select>
                {createForm.formState.errors.role && (
                  <p className="text-sm text-red-600">
                    {createForm.formState.errors.role.message}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1"
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending}
                  className="flex-1 bg-blue-600 text-white"
                >
                  {createUserMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    "Crea Utente"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
