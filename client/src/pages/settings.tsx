import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  Monitor
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-foreground">Configurazione Sistema</h1>
          <p className="text-muted-foreground">Gestisci le impostazioni globali del sistema</p>
        </div>
        <Badge variant="outline" className="w-fit">
          <Settings className="w-3 h-3 mr-1" />
          Amministratore
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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