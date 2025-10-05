import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, Download, QrCode, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Asset } from "@shared/schema";

export default function Labels() {
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const { toast } = useToast();

  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const selectedAssetData = assets.find(asset => asset.id === selectedAsset);

  const handlePrint = () => {
    if (!selectedAssetData) {
      toast({
        title: "Nessun asset selezionato",
        description: "Seleziona un asset per stampare l'etichetta.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Stampa avviata",
      description: `Stampa etichetta per ${selectedAssetData.assetCode}`
    });
  };

  const handleDownload = () => {
    if (!selectedAssetData) {
      toast({
        title: "Nessun asset selezionato",
        description: "Seleziona un asset per scaricare l'etichetta.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Download avviato",
      description: `Download etichetta per ${selectedAssetData.assetCode}`
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Etichette</h1>
          <p className="text-muted-foreground">Genera etichette per Asset aziendali</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleDownload}
            disabled={!selectedAsset}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button 
            onClick={handlePrint}
            disabled={!selectedAsset}
            className="bg-primary flex items-center gap-2"
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
                <p className="text-sm font-medium text-muted-foreground">Asset Totali</p>
                <p className="text-2xl font-bold">{assets.length}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Asset Attivi</p>
                <p className="text-2xl font-bold">{assets.filter(asset => asset.status === 'disponibile').length}</p>
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
                <p className="text-2xl font-bold">{selectedAsset ? 1 : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selezione Asset */}
        <Card>
          <CardHeader>
            <CardTitle>Seleziona Asset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="asset-select">Asset</Label>
              <select
                id="asset-select"
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Seleziona un Asset</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.assetCode} - {asset.brand} {asset.model}
                  </option>
                ))}
              </select>
            </div>

            {selectedAssetData && (
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium">Dettagli Asset Selezionato</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Codice:</span> {selectedAssetData.assetCode}
                  </div>
                  <div>
                    <span className="font-medium">Marca:</span> {selectedAssetData.brand}
                  </div>
                  <div>
                    <span className="font-medium">Modello:</span> {selectedAssetData.model}
                  </div>
                  <div>
                    <span className="font-medium">Serial:</span> {selectedAssetData.serialNumber}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Stato:</span> {selectedAssetData.status || 'Non disponibile'}
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
            {selectedAssetData ? (
              <div className="border border-gray-300 bg-white p-4 rounded-lg">
                <div className="text-center space-y-2">
                  <div className="text-xs font-bold text-blue-800">MAORI GROUP</div>
                  <div className="text-sm font-semibold">{selectedAssetData.assetCode}</div>
                  <div className="text-xs text-gray-600">{selectedAssetData.brand} {selectedAssetData.model}</div>
                  <div className="text-xs text-gray-500">{selectedAssetData.serialNumber}</div>
                  <div className="bg-black text-white text-xs p-2 font-mono">
                    [QR CODE PLACEHOLDER]
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-gray-300 p-8 rounded-lg text-center text-muted-foreground">
                Seleziona un Asset per vedere l'anteprima dell'etichetta
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}