import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  Box
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Asset, Pc } from "@shared/schema";
import { HPEliteBookLabel, printStyles } from "@/components/HPEliteBookLabel";
import ReactDOMServer from 'react-dom/server';

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
  const [serviceDeskUrl, setServiceDeskUrl] = useState("http://alstom.service-now.com");
  const { toast } = useToast();

  // Fetch assets e PCs
  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: pcs = [], isLoading: pcsLoading } = useQuery<Pc[]>({
    queryKey: ["/api/pcs"],
  });

  // Combina assets e PCs per la visualizzazione
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
  ];

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

  const generateLabelHTML = (item: any) => {
    // Usa il componente React per generare l'HTML
    const labelComponent = HPEliteBookLabel({
      assetId: item.assetCode,
      model: `${item.brand || ''} ${item.model || ''}`.trim(),
      serialNumber: item.serialNumber || ''
    });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          ${printStyles}
        </style>
      </head>
      <body>
        ${ReactDOMServer.renderToString(labelComponent)}
      </body>
      </html>
    `;
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

    const selectedItems = allItems.filter(item => selectedAssets.includes(item.id));
    
    // Crea una finestra di stampa per ogni etichetta
    selectedItems.forEach((item, index) => {
      setTimeout(() => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(generateLabelHTML(item));
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }
      }, index * 500); // Stampa ogni etichetta con un piccolo delay
    });

    toast({
      title: "Stampa avviata",
      description: `${selectedAssets.length} etichette in corso di stampa.`,
    });
  };

  const downloadLabels = () => {
    if (selectedAssets.length === 0) {
      toast({
        title: "Nessun asset selezionato",
        description: "Seleziona almeno un asset per scaricare le etichette.",
        variant: "destructive",
      });
      return;
    }

    const selectedItems = allItems.filter(item => selectedAssets.includes(item.id));
    const htmlContent = selectedItems.map(item => generateLabelHTML(item)).join('<div style="page-break-after: always;"></div>');
    
    const fullHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          ${printStyles}
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `etichette_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download avviato",
      description: `${selectedAssets.length} etichette scaricate.`,
    });
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
            onClick={printLabels}
            disabled={selectedAssets.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Printer className="h-4 w-4 mr-2" />
            Stampa Etichette ({selectedAssets.length})
          </Button>
          <Button 
            onClick={downloadLabels}
            disabled={selectedAssets.length === 0}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Scarica HTML
          </Button>
        </div>
      </div>

      {/* Configurazione Service Desk */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configurazione Service Desk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">URL Service Desk:</label>
            <Input
              value={serviceDeskUrl}
              onChange={(e) => setServiceDeskUrl(e.target.value)}
              placeholder="http://alstom.service-now.com"
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
