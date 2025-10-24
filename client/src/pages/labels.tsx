import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Printer,
  Search,
  Download,
  QrCode,
  Monitor,
  Smartphone,
  Tablet,
  Keyboard,
  CreditCard,
  Box,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Asset, Pc } from "@shared/schema";
import { AssetLabel } from "@/components/AssetLabel";

// Icone per tipo di asset
const assetIcons = {
  computer: Keyboard,
  smartphone: Smartphone,
  tablet: Tablet,
  monitor: Monitor,
  sim: CreditCard,
  altro: Box,
};

export default function Labels() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [serviceDeskUrl, setServiceDeskUrl] = useState("Ticket@maorigroup.it");
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch assets e PCs
  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: pcs = [], isLoading: pcsLoading } = useQuery<Pc[]>({
    queryKey: ["/api/pcs"],
  });

  // Combina assets e PCs per la visualizzazione
  // Filtra solo quelli con assetCode/pcId validi per la generazione di etichette
  const allItems = [
    ...assets.map(asset => ({
      id: asset.id,
      type: 'asset',
      assetCode: asset.assetCode,
      brand: asset.brand,
      model: asset.model,
      serialNumber: asset.serialNumber,
      assetType: asset.assetType,
      status: asset.status,
    })),
    ...pcs.map(pc => ({
      id: pc.id,
      type: 'pc',
      assetCode: pc.pcId,
      brand: pc.brand,
      model: pc.model,
      serialNumber: pc.serialNumber,
      assetType: 'computer',
      status: pc.status,
    }))
  ].filter(item => item.assetCode && item.assetCode.trim() !== '');

  // Filtra gli elementi
  const filteredItems = allItems.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.assetCode?.toLowerCase().includes(searchLower) ||
      item.brand?.toLowerCase().includes(searchLower) ||
      item.model?.toLowerCase().includes(searchLower) ||
      item.serialNumber?.toLowerCase().includes(searchLower)
    );
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssets(filteredItems.map(item => item.id));
    } else {
      setSelectedAssets([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedAssets(prev => [...prev, itemId]);
    } else {
      setSelectedAssets(prev => prev.filter(id => id !== itemId));
    }
  };

  const openPreview = () => {
    if (selectedAssets.length === 0) {
      toast({
        title: "Nessun asset selezionato",
        description: "Seleziona almeno un asset per visualizzare le etichette.",
        variant: "destructive",
      });
      return;
    }
    setShowPreview(true);
  };

  const printLabels = () => {
    if (selectedAssets.length === 0) {
      toast({
        title: "Nessun asset selezionato",
        description: "Seleziona almeno un asset per stampare le etichette.",
        variant: "destructive",
      });
      return;
    }

    // Apri preview e dopo un piccolo delay stampa
    setShowPreview(true);
    setTimeout(() => {
      window.print();
    }, 500);

    toast({
      title: "Anteprima stampa aperta",
      description: `${selectedAssets.length} etichette pronte per la stampa.`,
    });
  };

  // Get selected items for rendering
  const getSelectedItems = () => {
    return allItems.filter(item => selectedAssets.includes(item.id));
  };

  const isLoading = assetsLoading || pcsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stampa Etichette</h1>
          <p className="text-muted-foreground">Genera e stampa etichette per asset e PC</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={openPreview}
            disabled={selectedAssets.length === 0}
            variant="outline"
          >
            <Eye className="h-4 w-4 mr-2" />
            Anteprima ({selectedAssets.length})
          </Button>
          <Button
            onClick={printLabels}
            disabled={selectedAssets.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Printer className="h-4 w-4 mr-2" />
            Stampa Etichette ({selectedAssets.length})
          </Button>
        </div>
      </div>

      {/* Dialog Anteprima Etichette */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Anteprima Etichette ({selectedAssets.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 no-print">
            <div className="flex justify-end gap-2 sticky top-0 bg-background z-10 pb-2">
              <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Printer className="h-4 w-4 mr-2" />
                Stampa
              </Button>
              <Button onClick={() => setShowPreview(false)} variant="outline">
                Chiudi
              </Button>
            </div>
          </div>
          <div ref={printRef} className="space-y-4">
            {getSelectedItems().map((item) => (
              <div key={item.id} className="label-container flex justify-center">
                <AssetLabel
                  assetId={item.assetCode || ''}
                  model={`${item.brand || ''} ${item.model || ''}`.trim()}
                  serialNumber={item.serialNumber || ''}
                  url={serviceDeskUrl}
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Configurazione Service Desk */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configurazione Etichette</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Contatto Service Desk:</label>
            <Input
              value={serviceDeskUrl}
              onChange={(e) => setServiceDeskUrl(e.target.value)}
              placeholder="Ticket@maorigroup.it o URL"
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filtri e Selezione */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selezione Asset</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cerca asset..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedAssets.length === filteredItems.length && filteredItems.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Seleziona Tutti ({filteredItems.length})
              </label>
            </div>
          </div>

          {/* Tabella Asset */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Codice</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modello</TableHead>
                  <TableHead>Seriale</TableHead>
                  <TableHead>Stato</TableHead>
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
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const Icon = assetIcons[item.assetType as keyof typeof assetIcons] || Box;
                    const isSelected = selectedAssets.includes(item.id);
                    
                    return (
                      <TableRow key={item.id} className={isSelected ? "bg-blue-50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{item.assetCode}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span className="capitalize">{item.assetType}</span>
                          </div>
                        </TableCell>
                        <TableCell>{item.brand || "-"}</TableCell>
                        <TableCell>{item.model || "-"}</TableCell>
                        <TableCell>{item.serialNumber || "-"}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              item.status === "disponibile" ? "default" :
                              item.status === "assegnato" ? "secondary" :
                              item.status === "manutenzione" ? "destructive" : "outline"
                            }
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {searchTerm ? "Nessun asset corrisponde alla ricerca" : "Nessun asset trovato"}
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
