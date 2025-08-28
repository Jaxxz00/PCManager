import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  X
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
        {/* Impostazioni Aziendali */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              Informazioni Azienda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Azienda</Label>
              <Input defaultValue="Maori Group S.r.l." />
            </div>
            <div className="space-y-2">
              <Label>Indirizzo</Label>
              <Input placeholder="Via della Sede, 123 - Milano" />
            </div>
            <div className="space-y-2">
              <Label>Email Aziendale</Label>
              <Input type="email" placeholder="info@maorigroup.com" />
            </div>
            <Button className="w-full mt-4">
              Salva Modifiche
            </Button>
          </CardContent>
        </Card>

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