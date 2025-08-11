import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, Download, Eye, QrCode, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { PcWithEmployee } from "@shared/schema";

export default function Labels() {
  const [selectedPc, setSelectedPc] = useState<string>("");
  const [labelType, setLabelType] = useState<string>("standard");
  const [includeQR, setIncludeQR] = useState(true);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [customText, setCustomText] = useState("");

  const { data: pcs = [], isLoading } = useQuery<PcWithEmployee[]>({
    queryKey: ["/api/pcs"],
  });

  const selectedPcData = pcs.find(pc => pc.id === selectedPc);

  const labelTemplates = {
    standard: {
      name: "Standard",
      size: "62x29mm",
      description: "Etichetta standard per asset IT"
    },
    small: {
      name: "Piccola",
      size: "38x21mm", 
      description: "Etichetta compatta per dispositivi piccoli"
    },
    large: {
      name: "Grande",
      size: "89x36mm",
      description: "Etichetta grande con informazioni dettagliate"
    }
  };

  const generateQRCode = (pcId: string) => {
    // In una implementazione reale, qui genereresti un QR code
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="60" fill="white"/>
        <rect x="10" y="10" width="40" height="40" fill="black"/>
        <rect x="15" y="15" width="30" height="30" fill="white"/>
        <text x="30" y="35" text-anchor="middle" font-size="8" fill="black">${pcId}</text>
      </svg>
    `)}`;
  };

  const printLabel = () => {
    if (!selectedPcData) return;
    
    const printWindow = window.open('', '_blank');
    const labelContent = generateLabelHTML();
    
    printWindow?.document.write(`
      <html>
        <head>
          <title>Stampa Etichetta - ${selectedPcData.pcId}</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: Arial, sans-serif; 
            }
            .label { 
              page-break-after: always; 
              margin-bottom: 20px;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .label { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${labelContent}
        </body>
      </html>
    `);
    
    printWindow?.document.close();
    printWindow?.print();
  };

  const generateLabelHTML = () => {
    if (!selectedPcData) return "";

    const template = labelTemplates[labelType as keyof typeof labelTemplates];
    
    return `
      <div class="label" style="
        width: ${template.size.split('x')[0]}; 
        height: ${template.size.split('x')[1]}; 
        border: 2px solid #333; 
        padding: 8px; 
        display: flex; 
        flex-direction: column; 
        justify-content: space-between;
        background: white;
      ">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          ${includeLogo ? `
            <div style="font-weight: bold; font-size: 14px; color: #2563eb;">
              PC MANAGER
            </div>
          ` : ''}
          ${includeQR ? `
            <img src="${generateQRCode(selectedPcData.pcId)}" width="40" height="40" />
          ` : ''}
        </div>
        
        <div style="text-align: center; flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">
            ${selectedPcData.pcId}
          </div>
          <div style="font-size: 12px; color: #666;">
            ${selectedPcData.brand} ${selectedPcData.model}
          </div>
          ${selectedPcData.employee?.name ? `
            <div style="font-size: 10px; color: #888; margin-top: 2px;">
              ${selectedPcData.employee.name}
            </div>
          ` : ''}
          ${customText ? `
            <div style="font-size: 10px; color: #333; margin-top: 4px;">
              ${customText}
            </div>
          ` : ''}
        </div>
        
        <div style="font-size: 8px; color: #999; text-align: center;">
          ${new Date().toLocaleDateString('it-IT')}
        </div>
      </div>
    `;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-foreground">Etichette PC</h1>
          <p className="text-muted-foreground">Genera e stampa etichette di riconoscimento per i computer</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurazione Etichetta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Configurazione Etichetta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selezione PC */}
            <div className="space-y-2">
              <Label htmlFor="pc-select">Seleziona PC</Label>
              <Select value={selectedPc} onValueChange={setSelectedPc}>
                <SelectTrigger>
                  <SelectValue placeholder="Scegli un PC..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>Caricamento...</SelectItem>
                  ) : (
                    pcs.map((pc) => (
                      <SelectItem key={pc.id} value={pc.id}>
                        {pc.pcId} - {pc.brand} {pc.model}
                        {pc.employee?.name && ` (${pc.employee.name})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo Etichetta */}
            <div className="space-y-2">
              <Label htmlFor="label-type">Formato Etichetta</Label>
              <Select value={labelType} onValueChange={setLabelType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(labelTemplates).map(([key, template]) => (
                    <SelectItem key={key} value={key}>
                      {template.name} ({template.size})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {labelTemplates[labelType as keyof typeof labelTemplates]?.description}
              </p>
            </div>

            <Separator />

            {/* Opzioni */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Opzioni Etichetta</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-qr"
                  checked={includeQR}
                  onCheckedChange={(checked) => setIncludeQR(checked as boolean)}
                />
                <Label htmlFor="include-qr" className="flex items-center">
                  <QrCode className="mr-2 h-4 w-4" />
                  Includi QR Code
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-logo"
                  checked={includeLogo}
                  onCheckedChange={(checked) => setIncludeLogo(checked as boolean)}
                />
                <Label htmlFor="include-logo">
                  Includi Logo Aziendale
                </Label>
              </div>
            </div>

            {/* Testo Personalizzato */}
            <div className="space-y-2">
              <Label htmlFor="custom-text">Testo Aggiuntivo (opzionale)</Label>
              <Input
                id="custom-text"
                placeholder="Es: Reparto IT, Piano 2..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Anteprima e Azioni */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="mr-2 h-5 w-5" />
              Anteprima Etichetta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedPcData ? (
              <>
                {/* Anteprima */}
                <div className="border-2 border-dashed border-border p-4 rounded-lg bg-muted/30">
                  <div 
                    className="bg-white border-2 border-gray-800 p-3 mx-auto"
                    style={{
                      width: labelType === 'small' ? '190px' : labelType === 'large' ? '280px' : '240px',
                      height: labelType === 'small' ? '100px' : labelType === 'large' ? '140px' : '120px',
                      fontSize: labelType === 'small' ? '10px' : '12px'
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      {includeLogo && (
                        <div className="font-bold text-primary text-sm">
                          PC MANAGER
                        </div>
                      )}
                      {includeQR && (
                        <div className="w-8 h-8 bg-gray-900 flex items-center justify-center text-white text-xs">
                          QR
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center flex-grow flex flex-col justify-center">
                      <div className="font-bold text-lg mb-1">
                        {selectedPcData.pcId}
                      </div>
                      <div className="text-gray-600 text-sm">
                        {selectedPcData.brand} {selectedPcData.model}
                      </div>
                      {selectedPcData.employee?.name && (
                        <div className="text-gray-500 text-xs mt-1">
                          {selectedPcData.employee.name}
                        </div>
                      )}
                      {customText && (
                        <div className="text-gray-700 text-xs mt-1">
                          {customText}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-gray-400 text-xs text-center mt-2">
                      {new Date().toLocaleDateString('it-IT')}
                    </div>
                  </div>
                </div>

                {/* Informazioni PC */}
                <div className="space-y-3">
                  <h3 className="font-medium">Dettagli PC Selezionato</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">ID:</span>
                      <span className="ml-2 font-medium">{selectedPcData.pcId}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Stato:</span>
                      <Badge variant={selectedPcData.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                        {selectedPcData.status === 'active' ? 'Attivo' : 
                         selectedPcData.status === 'maintenance' ? 'Manutenzione' : 'Dismesso'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Marca:</span>
                      <span className="ml-2">{selectedPcData.brand}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Modello:</span>
                      <span className="ml-2">{selectedPcData.model}</span>
                    </div>
                    {selectedPcData.employee && (
                      <>
                        <div>
                          <span className="text-muted-foreground">Assegnato a:</span>
                          <span className="ml-2">{selectedPcData.employee.name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Email:</span>
                          <span className="ml-2">{selectedPcData.employee.email}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Azioni */}
                <div className="flex gap-3">
                  <Button onClick={printLabel} className="flex-1">
                    <Printer className="mr-2 h-4 w-4" />
                    Stampa Etichetta
                  </Button>
                  <Button variant="outline" onClick={printLabel}>
                    <Download className="mr-2 h-4 w-4" />
                    Scarica PDF
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Printer className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Seleziona un PC per vedere l'anteprima dell'etichetta</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Suggerimenti */}
      <Card>
        <CardHeader>
          <CardTitle>Suggerimenti per la Stampa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">Carta Consigliata</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Etichette adesive bianche</li>
                <li>• Carta per stampante laser</li>
                <li>• Resistenti all'acqua</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Impostazioni Stampa</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Qualità: Alta</li>
                <li>• Margini: Minimi</li>
                <li>• Orientamento: Orizzontale</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Applicazione</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Superficie pulita e asciutta</li>
                <li>• Posizione visibile</li>
                <li>• Evitare zone di calore</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}