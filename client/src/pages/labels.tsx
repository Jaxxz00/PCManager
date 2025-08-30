import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, Download, QrCode, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { PcWithEmployee } from "@shared/schema";

export default function Labels() {
  const [selectedPc, setSelectedPc] = useState<string>("");
  const { toast } = useToast();

  const { data: pcs = [], isLoading } = useQuery<PcWithEmployee[]>({
    queryKey: ["/api/pcs"],
  });

  const selectedPcData = pcs.find(pc => pc.id === selectedPc);

  const handlePrint = () => {
    if (!selectedPcData) {
      toast({
        title: "Nessun PC selezionato",
        description: "Seleziona un PC per stampare l'etichetta.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Stampa avviata",
      description: `Stampa etichetta per ${selectedPcData.pcId}`
    });
  };

  const handleDownload = () => {
    if (!selectedPcData) {
      toast({
        title: "Nessun PC selezionato",
        description: "Seleziona un PC per scaricare l'etichetta.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Download avviato",
      description: `Download etichetta per ${selectedPcData.pcId}`
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Etichette</h1>
          <p className="text-muted-foreground">Genera etichette per PC aziendali</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleDownload}
            disabled={!selectedPc}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button 
            onClick={handlePrint}
            disabled={!selectedPc}
            className="bg-primary hover:bg-primary/90 flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Stampa
          </Button>
        </div>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Monitor className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">PC Totali</p>
                <p className="text-2xl font-bold">{pcs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <QrCode className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">PC Attivi</p>
                <p className="text-2xl font-bold">{pcs.filter(pc => pc.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Printer className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Selezionato</p>
                <p className="text-2xl font-bold">{selectedPc ? 1 : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selezione PC */}
        <Card>
          <CardHeader>
            <CardTitle>Seleziona PC</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pc-select">PC</Label>
              <select
                id="pc-select"
                value={selectedPc}
                onChange={(e) => setSelectedPc(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Seleziona un PC</option>
                {pcs.map(pc => (
                  <option key={pc.id} value={pc.id}>
                    {pc.pcId} - {pc.brand} {pc.model}
                  </option>
                ))}
              </select>
            </div>

            {selectedPcData && (
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium">Dettagli PC Selezionato</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">ID:</span> {selectedPcData.pcId}
                  </div>
                  <div>
                    <span className="font-medium">Marca:</span> {selectedPcData.brand}
                  </div>
                  <div>
                    <span className="font-medium">Modello:</span> {selectedPcData.model}
                  </div>
                  <div>
                    <span className="font-medium">Serial:</span> {selectedPcData.serialNumber}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Dipendente:</span> {selectedPcData.employee?.name || 'Non assegnato'}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Anteprima Etichetta */}
        <Card>
          <CardHeader>
            <CardTitle>Anteprima Etichetta</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPcData ? (
              <div className="border border-gray-300 bg-white p-4 rounded-lg">
                <div className="text-center space-y-2">
                  <div className="text-xs font-bold text-blue-800">MAORI GROUP</div>
                  <div className="text-sm font-semibold">{selectedPcData.pcId}</div>
                  <div className="text-xs text-gray-600">{selectedPcData.brand} {selectedPcData.model}</div>
                  <div className="text-xs text-gray-500">{selectedPcData.serialNumber}</div>
                  <div className="bg-black text-white text-xs p-2 font-mono">
                    [QR CODE PLACEHOLDER]
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-gray-300 p-8 rounded-lg text-center text-muted-foreground">
                Seleziona un PC per vedere l'anteprima dell'etichetta
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}