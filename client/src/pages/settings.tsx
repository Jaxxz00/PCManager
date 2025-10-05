import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
  Settings as SettingsIcon, 
  Building2, 
  Database, 
  Shield, 
  Mail, 
  Bell,
  Users,
  Monitor,
  Key,
  Download,
  Upload,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Server,
  HardDrive,
  Activity,
  FileText,
  Globe,
  Lock,
  Smartphone,
  AlertTriangle
} from "lucide-react";

// Schema per creazione utente
const createUserSchema = z.object({
  username: z.string().min(3, "Username deve essere almeno 3 caratteri"),
  email: z.string().email("Email non valida"),
  firstName: z.string().min(1, "Nome richiesto"),
  lastName: z.string().min(1, "Cognome richiesto"),
  role: z.enum(["admin", "user"], { errorMap: () => ({ message: "Seleziona un ruolo" }) }),
});

type CreateUserData = z.infer<typeof createUserSchema>;

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "Generale", icon: SettingsIcon },
    { id: "users", label: "Utenti", icon: Users },
    { id: "security", label: "Sicurezza", icon: Shield },
    { id: "system", label: "Sistema", icon: Server },
    { id: "backup", label: "Backup", icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurazioni</h1>
          <p className="text-muted-foreground">Gestione e configurazione del sistema PC Manager</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "general" && <GeneralSettings />}
        {activeTab === "users" && <UserManagement />}
        {activeTab === "security" && <SecuritySettings />}
        {activeTab === "system" && <SystemSettings />}
        {activeTab === "backup" && <BackupSettings />}
      </div>
    </div>
  );
}

function GeneralSettings() {
  const [settings, setSettings] = useState({
    companyName: "Maori Group",
    emailNotifications: true,
    autoBackup: true,
    maintenanceMode: false,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Informazioni Azienda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informazioni Azienda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="companyName">Nome Azienda</Label>
            <Input
              id="companyName"
              value={settings.companyName}
              onChange={(e) => setSettings({...settings, companyName: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="companyEmail">Email Aziendale</Label>
            <Input
              id="companyEmail"
              type="email"
              placeholder="info@maorigroup.com"
            />
          </div>
          <div>
            <Label htmlFor="companyAddress">Indirizzo</Label>
            <Input
              id="companyAddress"
              placeholder="Via Roma 123, Milano"
            />
          </div>
          <Button className="w-full">Salva Modifiche</Button>
        </CardContent>
      </Card>

      {/* Preferenze Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Preferenze Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Notifiche Email</Label>
              <p className="text-sm text-muted-foreground">Ricevi notifiche via email</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Backup Automatico</Label>
              <p className="text-sm text-muted-foreground">Backup giornaliero automatico</p>
            </div>
            <Switch
              checked={settings.autoBackup}
              onCheckedChange={(checked) => setSettings({...settings, autoBackup: checked})}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Modalità Manutenzione
              </Label>
              <p className="text-sm text-muted-foreground">Disabilita accesso temporaneamente</p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UserManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  // Form per creare utente
  const createForm = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
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
    onSuccess: () => {
      toast({
        title: "Utente creato",
        description: "Email di invito inviata con successo",
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
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestione Utenti
            </CardTitle>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Utente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
                    <TableHead>2FA</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'outline'} 
                               className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {user.isActive ? 'Attivo' : 'Sospeso'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.twoFactorEnabled ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Smartphone className="h-3 w-3 mr-1" />
                            Attivo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-600">
                            Disattivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
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
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Crea Nuovo Utente
            </DialogTitle>
            <DialogDescription>
              Inserisci i dati per creare un nuovo utente. Verrà inviata un'email di invito.
            </DialogDescription>
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
                        <Input {...field} placeholder="Mario" />
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
                        <Input {...field} placeholder="Rossi" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={createForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="mario.rossi" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="mario.rossi@maorigroup.com" />
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
                  className="flex-1 bg-blue-600"
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

function SecuritySettings() {
  const [securitySettings, setSecuritySettings] = useState({
    enforceStrongPasswords: true,
    require2FA: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Politiche di Sicurezza
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Password Forti Obbligatorie</Label>
              <p className="text-sm text-muted-foreground">Richiedi password complesse</p>
            </div>
            <Switch
              checked={securitySettings.enforceStrongPasswords}
              onCheckedChange={(checked) => setSecuritySettings({...securitySettings, enforceStrongPasswords: checked})}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>2FA Obbligatorio</Label>
              <p className="text-sm text-muted-foreground">Forza autenticazione a due fattori</p>
            </div>
            <Switch
              checked={securitySettings.require2FA}
              onCheckedChange={(checked) => setSecuritySettings({...securitySettings, require2FA: checked})}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Timeout Sessione (minuti)</Label>
            <Input
              type="number"
              value={securitySettings.sessionTimeout}
              onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
              min="5"
              max="480"
            />
          </div>

          <div className="space-y-2">
            <Label>Tentativi Login Massimi</Label>
            <Input
              type="number"
              value={securitySettings.maxLoginAttempts}
              onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: parseInt(e.target.value)})}
              min="3"
              max="10"
            />
          </div>

          <Button className="w-full">Salva Configurazioni</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Log e Monitoraggio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-green-600">127</p>
              <p className="text-sm text-muted-foreground">Login Riusciti</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-red-600">3</p>
              <p className="text-sm text-muted-foreground">Tentativi Falliti</p>
            </div>
          </div>
          <Button variant="outline" className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            Visualizza Log Completi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SystemSettings() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Stato Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">CPU</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">23%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Memoria</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">67%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Disco</span>
              <Badge variant="outline" className="bg-orange-50 text-orange-700">45%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Uptime</span>
              <span className="text-sm text-muted-foreground">7 giorni, 3 ore</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Connessioni Attive</span>
              <Badge variant="outline">12</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Dimensione DB</span>
              <span className="text-sm text-muted-foreground">245 MB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Ultima Ottimizzazione</span>
              <span className="text-sm text-muted-foreground">2 giorni fa</span>
            </div>
            <Button variant="outline" className="w-full">
              Ottimizza Database
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Configurazioni Avanzate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL Base Applicazione</Label>
            <Input defaultValue="https://pcmanager.maorigroup.com" />
          </div>
          <div className="space-y-2">
            <Label>Porta Server</Label>
            <Input type="number" defaultValue="5000" />
          </div>
          <div className="space-y-2">
            <Label>Fuso Orario</Label>
            <select className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md">
              <option>Europe/Rome</option>
              <option>Europe/London</option>
              <option>America/New_York</option>
            </select>
          </div>
          <Button className="w-full">Salva Configurazioni</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function BackupSettings() {
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configurazioni Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Backup Automatico</Label>
              <p className="text-sm text-muted-foreground">Esegui backup automatici</p>
            </div>
            <Switch
              checked={backupSettings.autoBackup}
              onCheckedChange={(checked) => setBackupSettings({...backupSettings, autoBackup: checked})}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Frequenza Backup</Label>
            <select
              value={backupSettings.backupFrequency}
              onChange={(e) => setBackupSettings({...backupSettings, backupFrequency: e.target.value})}
              className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md"
            >
              <option value="hourly">Ogni Ora</option>
              <option value="daily">Giornaliero</option>
              <option value="weekly">Settimanale</option>
              <option value="monthly">Mensile</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Giorni di Conservazione</Label>
            <Input
              type="number"
              value={backupSettings.retentionDays}
              onChange={(e) => setBackupSettings({...backupSettings, retentionDays: parseInt(e.target.value)})}
              min="1"
              max="365"
            />
          </div>

          <Button className="w-full">Salva Configurazioni</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Backup Recenti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: "30/08/2025 04:00", size: "125 MB", status: "Completato" },
              { date: "29/08/2025 04:00", size: "123 MB", status: "Completato" },
              { date: "28/08/2025 04:00", size: "121 MB", status: "Completato" },
            ].map((backup, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{backup.date}</p>
                  <p className="text-sm text-muted-foreground">{backup.size}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {backup.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex gap-2">
            <Button className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Backup Manuale
            </Button>
            <Button variant="outline" className="flex-1">
              <Upload className="h-4 w-4 mr-2" />
              Ripristina
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}