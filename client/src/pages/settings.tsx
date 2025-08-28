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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { type User, setup2FASchema, disable2FASchema } from "@shared/schema";
import { 
  Settings, 
  Building2, 
  Database, 
  Shield, 
  Mail, 
  Bell,
  Palette,
  HardDrive,
  Users,
  Monitor,
  QrCode,
  Key,
  Download,
  Check,
  X,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";

// Tipi per i form locali (diversi dagli schemi completi del backend)
const localSetup2FASchema = z.object({
  token: z.string().min(6, "Il codice deve essere di almeno 6 cifre"),
});

const localDisable2FASchema = z.object({
  password: z.string().min(1, "Password richiesta"),
  token: z.string().min(6, "Il codice deve essere di almeno 6 cifre"),
});

type LocalSetup2FAData = z.infer<typeof localSetup2FASchema>;
type LocalDisable2FAData = z.infer<typeof localDisable2FASchema>;

// Schema per creazione utente
const createUserSchema = z.object({
  username: z.string().min(3, "Username deve essere almeno 3 caratteri"),
  email: z.string().email("Email non valida"),
  firstName: z.string().min(1, "Nome richiesto"),
  lastName: z.string().min(1, "Cognome richiesto"),
  password: z.string().min(6, "Password deve essere almeno 6 caratteri"),
  role: z.enum(["admin", "user"], { errorMap: () => ({ message: "Seleziona un ruolo" }) }),
});

type CreateUserData = z.infer<typeof createUserSchema>;

// Componente per gestire gli utenti
function UserManagementCard() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Form per creare utente
  const createForm = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
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
    onSuccess: () => {
      toast({
        title: "Utente creato",
        description: "Il nuovo utente è stato creato con successo",
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
      const response = await apiRequest("DELETE", `/api/users/${userId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Utente eliminato",
        description: "L'utente è stato eliminato dal sistema",
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
      const response = await apiRequest("PATCH", `/api/users/${userId}`, { isActive });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Stato aggiornato",
        description: "Lo stato dell'utente è stato aggiornato",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare lo stato",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Gestione Utenti
            </CardTitle>
            <Button
              onClick={() => setShowCreateDialog(true)}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuovo Utente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Caricamento utenti...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {users.length} utent{users.length !== 1 ? 'i' : 'e'} registrat{users.length !== 1 ? 'i' : 'o'}
                </p>
                <Badge variant="outline">{users.length}</Badge>
              </div>
              
              {users.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utente</TableHead>
                        <TableHead>Ruolo</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-gray-500">@{user.username}</p>
                              <p className="text-xs text-gray-400">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role === 'admin' ? 'Amministratore' : 'Utente'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                {user.isActive ? 'Attivo' : 'Sospeso'}
                              </Badge>
                              {user.twoFactorEnabled && (
                                <Badge variant="outline" className="text-xs">
                                  2FA
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
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
                                className="text-red-600 hover:text-red-700"
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog per creare nuovo utente */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md z-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Crea Nuovo Utente
            </DialogTitle>
            <DialogDescription>
              Inserisci i dati per creare un nuovo utente del sistema
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
              
              <FormField
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Almeno 6 caratteri" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ruolo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleziona ruolo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent 
                        className="z-[100] bg-white border border-gray-200 shadow-lg rounded-md"
                        position="popper"
                        sideOffset={4}
                      >
                        <SelectItem value="user" className="cursor-pointer hover:bg-gray-100">
                          Utente Standard
                        </SelectItem>
                        <SelectItem value="admin" className="cursor-pointer hover:bg-gray-100">
                          Amministratore
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {createUserMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Crea Utente
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Componente per gestire 2FA
function TwoFactorAuthCard() {
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const { toast } = useToast();

  // Query per verificare se 2FA è abilitato
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const setupForm = useForm<LocalSetup2FAData>({
    resolver: zodResolver(localSetup2FASchema),
    defaultValues: { token: "" },
  });

  const disableForm = useForm<LocalDisable2FAData>({
    resolver: zodResolver(localDisable2FASchema),
    defaultValues: { password: "", token: "" },
  });

  // Mutation per iniziare setup 2FA
  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/2fa/setup");
      return await response.json();
    },
    onSuccess: (data) => {
      setQrCodeUrl(data.qrCodeUrl);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setShowSetupDialog(true);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile configurare 2FA",
        variant: "destructive",
      });
    },
  });

  // Mutation per abilitare 2FA
  const enable2FAMutation = useMutation({
    mutationFn: async (data: LocalSetup2FAData) => {
      const response = await apiRequest("POST", "/api/auth/2fa/enable", { secret, token: data.token });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "2FA Attivato",
        description: "Autenticazione a due fattori configurata con successo",
      });
      setShowSetupDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Codice non valido",
        variant: "destructive",
      });
    },
  });

  // Mutation per disabilitare 2FA
  const disable2FAMutation = useMutation({
    mutationFn: async (data: LocalDisable2FAData) => {
      const response = await apiRequest("POST", "/api/auth/2fa/disable", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "2FA Disattivato",
        description: "Autenticazione a due fattori disabilitata",
      });
      setShowDisableDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Password o codice non validi",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Autenticazione a Due Fattori (2FA)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${user?.twoFactorEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                {user?.twoFactorEnabled ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {user?.twoFactorEnabled ? "2FA Attivo" : "2FA Non Configurato"}
                </p>
                <p className="text-sm text-gray-600">
                  {user?.twoFactorEnabled 
                    ? "Il tuo account è protetto con autenticazione a due fattori"
                    : "Aggiungi un livello extra di sicurezza al tuo account"
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {!user?.twoFactorEnabled ? (
                <Button 
                  onClick={() => setup2FAMutation.mutate()}
                  disabled={setup2FAMutation.isPending}
                >
                  <Key className="mr-2 h-4 w-4" />
                  Configura 2FA
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  onClick={() => setShowDisableDialog(true)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Disabilita 2FA
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog per setup 2FA */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Configura Autenticazione 2FA
            </DialogTitle>
            <DialogDescription>
              Scansiona il QR code con Google Authenticator o Authy
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {qrCodeUrl && (
              <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                <img src={qrCodeUrl} alt="QR Code 2FA" className="w-48 h-48" />
              </div>
            )}
            
            <div className="text-center text-sm text-gray-600">
              <p>Chiave manuale:</p>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs break-all">
                {secret}
              </code>
            </div>

            <Form {...setupForm}>
              <form onSubmit={setupForm.handleSubmit((data) => enable2FAMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={setupForm.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codice di verifica</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="123456"
                          className="text-center tracking-widest font-mono"
                          maxLength={6}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowSetupDialog(false)}
                    className="flex-1"
                  >
                    Annulla
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={enable2FAMutation.isPending}
                    className="flex-1"
                  >
                    Attiva 2FA
                  </Button>
                </div>
              </form>
            </Form>

            {backupCodes.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">
                  <Download className="inline w-4 h-4 mr-1" />
                  Codici di Backup
                </h4>
                <p className="text-sm text-yellow-700 mb-2">
                  Salva questi codici in un posto sicuro. Puoi usarli se perdi l'accesso al tuo dispositivo.
                </p>
                <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="bg-white p-1 rounded text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog per disabilitare 2FA */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5" />
              Disabilita Autenticazione 2FA
            </DialogTitle>
            <DialogDescription>
              Inserisci la tua password e un codice 2FA per disabilitare l'autenticazione a due fattori
            </DialogDescription>
          </DialogHeader>

          <Form {...disableForm}>
            <form onSubmit={disableForm.handleSubmit((data) => disable2FAMutation.mutate(data))} className="space-y-4">
              <FormField
                control={disableForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="La tua password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={disableForm.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codice 2FA</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="123456"
                        className="text-center tracking-widest font-mono"
                        maxLength={6}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowDisableDialog(false)}
                  className="flex-1"
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  variant="destructive"
                  disabled={disable2FAMutation.isPending}
                  className="flex-1"
                >
                  Disabilita 2FA
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-900 rounded-xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
            <Settings className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Centro Configurazione</h1>
            <p className="text-blue-100 text-lg">Gestione avanzata impostazioni sistema Maori Group</p>
            <div className="flex items-center gap-6 mt-2 text-sm text-blue-200">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Sicurezza avanzata</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span>Backup automatico</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Gestione utenti</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="bg-gradient-to-r from-gray-50 to-slate-100 p-4 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Pannello Amministrazione</h2>
          <p className="text-gray-700">Configura parametri avanzati del sistema</p>
        </div>
        <Badge variant="outline" className="w-fit">
          <Settings className="w-3 h-3 mr-1" />
          Amministratore
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Componente 2FA */}
        <TwoFactorAuthCard />
        
        {/* Gestione Utenti */}
        <UserManagementCard />
        
        {/* Database e Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Database e Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Backup Automatico</p>
                <p className="text-sm text-muted-foreground">Backup giornaliero dei dati</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Frequenza Backup</Label>
              <select className="w-full p-2 border rounded">
                <option>Giornaliero</option>
                <option>Settimanale</option>
                <option>Mensile</option>
              </select>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">Ultimo backup</span>
              <Badge variant="outline">2 giorni fa</Badge>
            </div>
            <Button variant="outline" className="w-full">
              <HardDrive className="mr-2 h-4 w-4" />
              Esegui Backup Ora
            </Button>
          </CardContent>
        </Card>

        {/* Sicurezza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Sicurezza Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Autenticazione Obbligatoria</p>
                <p className="text-sm text-muted-foreground">Richiedi login per accedere</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Rate Limiting</p>
                <p className="text-sm text-muted-foreground">Protezione da attacchi</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Log Attività</p>
                <p className="text-sm text-muted-foreground">Registra tutte le azioni</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Button variant="outline" className="w-full mt-4">
              <Shield className="mr-2 h-4 w-4" />
              Visualizza Log Sicurezza
            </Button>
          </CardContent>
        </Card>

        {/* Notifiche */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              Notifiche e Avvisi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Garanzia in Scadenza</p>
                <p className="text-sm text-muted-foreground">Avvisa 30 giorni prima</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Nuovi PC Aggiunti</p>
                <p className="text-sm text-muted-foreground">Email per nuove aggiunte</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Report Settimanali</p>
                <p className="text-sm text-muted-foreground">Statistiche via email</p>
              </div>
              <Switch />
            </div>
            <div className="space-y-2 pt-2">
              <Label>Email Amministratore</Label>
              <Input type="email" placeholder="admin@maorigroup.com" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiche Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="mr-2 h-5 w-5" />
            Statistiche Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <Database className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">PostgreSQL</p>
              <p className="text-sm text-muted-foreground">Database Attivo</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <Shield className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold">Sicuro</p>
              <p className="text-sm text-muted-foreground">Sistema Protetto</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <HardDrive className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold">78%</p>
              <p className="text-sm text-muted-foreground">Spazio Utilizzato</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <Users className="w-8 h-8 mx-auto text-orange-600 mb-2" />
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-sm text-muted-foreground">Monitoraggio</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zona Pericolosa</CardTitle>
          <p className="text-sm text-muted-foreground">
            Queste azioni sono irreversibili e possono causare perdita di dati
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="destructive" className="w-full">
            Reset Database
          </Button>
          <Button variant="destructive" className="w-full">
            Elimina Tutti i Dati
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}