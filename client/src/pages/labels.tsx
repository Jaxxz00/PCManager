import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, Download, Eye, Barcode, Settings, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import JsBarcode from "jsbarcode";
import type { PcWithEmployee } from "@shared/schema";

export default function Labels() {
  const [selectedPc, setSelectedPc] = useState<string>("");
  const [labelType, setLabelType] = useState<string>("standard");
  const [includeBarcode, setIncludeBarcode] = useState(true);
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

  const generateBarcode = async (pcData: PcWithEmployee): Promise<string> => {
    try {
      // Genera un codice a barre usando l'ID del PC (più semplice e leggibile)
      const canvas = document.createElement('canvas');
      
      JsBarcode(canvas, pcData.serialNumber || pcData.pcId, {
        format: "CODE128",
        width: 4,
        height: 100,
        displayValue: true,
        fontSize: 18,
        textAlign: "center",
        textPosition: "bottom",
        textMargin: 4,
        fontOptions: "bold",
        font: "Arial",
        background: "#ffffff",
        lineColor: "#000000"
      });
      
      return canvas.toDataURL();
    } catch (error) {
      console.error('Errore generazione codice a barre:', error);
      return '';
    }
  };

  const printLabel = async () => {
    if (!selectedPcData) return;
    
    const barcodeDataUrl = await generateBarcode(selectedPcData);
    const labelContent = generateProfessionalLabel(barcodeDataUrl);
    
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
      <html>
        <head>
          <title>Etichetta PC - ${selectedPcData.pcId}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: 'Inter', 'Segoe UI', sans-serif; 
              background: white;
            }
            .label { 
              page-break-after: always; 
              margin-bottom: 20px;
            }
            @media print {
              body { margin: 0; padding: 5mm; }
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

  const generateProfessionalLabel = (barcodeUrl: string) => {
    if (!selectedPcData) return "";

    return `
      <div class="label" style="
        width: 62mm; 
        height: 29mm; 
        border: 1px solid #e0e0e0; 
        padding: 3mm; 
        display: flex; 
        flex-direction: column;
        background: white;
        font-family: 'Inter', sans-serif;
        position: relative;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      ">

        
        <!-- Informazioni Principali -->
        <div style="
          flex-grow: 1; 
          display: flex; 
          flex-direction: column; 
          justify-content: center;
          text-align: center;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 2mm;
          padding: 2mm;
          margin: 1mm 0;
        ">
          <div style="
            font-size: 9pt; 
            color: #475569;
            font-weight: 600;
            margin-bottom: 1mm;
            text-align: center;
          ">
            ${selectedPcData.brand?.toUpperCase()} ${selectedPcData.model}
          </div>
          
          <div style="
            font-size: 7pt; 
            color: #64748b;
            font-weight: 500;
            margin-bottom: 2mm;
            text-align: center;
          ">
            S/N: ${selectedPcData.serialNumber || 'N/A'}
          </div>
          
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1.5mm;
            margin-bottom: 2mm;
          ">
            <img src="/assets/maori-logo.jpeg" alt="Maori Group Logo" style="
              height: 5mm;
              width: auto;
              object-fit: contain;
            "/>
            <div style="
              font-size: 6pt; 
              color: #475569;
              font-weight: 500;
            ">
              info@maorigroup.it
            </div>
          </div>
          
          ${customText ? `
            <div style="
              font-size: 6pt; 
              color: #475569;
              font-weight: 500;
              margin-bottom: 2mm;
              font-style: italic;
              text-align: center;
            ">
              ${customText}
            </div>
          ` : ''}
          
          <!-- Codice a Barre -->
          ${barcodeUrl ? `
            <div style="
              display: flex;
              justify-content: center;
              margin-top: 1mm;
            ">
              <img src="${barcodeUrl}" style="
                width: 45mm; 
                height: 15mm; 
                border: 1px solid #e0e0e0;
                border-radius: 1mm;
                object-fit: contain;
              " />
            </div>
          ` : ''}
        </div>
      </div>
    `;
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
        <div style="text-align: center; flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">
            ${selectedPcData.brand?.toUpperCase()} ${selectedPcData.model}
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
            S/N: ${selectedPcData.serialNumber || 'N/A'}
          </div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 8px;">
            <img src="/assets/maori-logo.jpeg" alt="Logo" style="height: 14px; width: auto; object-fit: contain;">
            <div style="font-size: 10px; color: #666;">
              info@maorigroup.it
            </div>
          </div>
          ${customText ? `
            <div style="font-size: 10px; color: #333; margin-bottom: 8px;">
              ${customText}
            </div>
          ` : ''}
          ${includeBarcode ? `
            <div style="display: flex; justify-content: center;">
              <div style="width: 100px; height: 30px; background: #333; color: white; display: flex; align-items: center; justify-content: center; font-size: 8px; border-radius: 2px;">||||||||||||||||</div>
            </div>
          ` : ''}
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
                <SelectContent className="dropdown-menu-enhanced">
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
                <SelectContent className="dropdown-menu-enhanced">
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
                  id="include-barcode"
                  checked={includeBarcode}
                  onCheckedChange={(checked) => setIncludeBarcode(checked as boolean)}
                />
                <Label htmlFor="include-barcode" className="flex items-center">
                  <Barcode className="mr-2 h-4 w-4" />
                  Includi Codice a Barre
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-logo"
                  checked={includeLogo}
                  onCheckedChange={(checked) => setIncludeLogo(checked as boolean)}
                />
                <Label htmlFor="include-logo">
                  Includi Logo Maori Group
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

            <Separator />

            {/* Informazioni Privacy */}
            <div className="space-y-3">
              <Label className="text-base font-medium">🔒 Privacy & Tracciamento</Label>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Barcode className="h-5 w-5 text-blue-600 mt-0.5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Tracciamento tramite Database
                    </h4>
                    <p className="text-sm text-blue-700">
                      Il nome del dipendente non appare sull'etichetta per privacy. 
                      Il codice a barre contiene l'ID univoco del PC che permette di risalire 
                      all'assegnazione tramite il database aziendale.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Sull'etichetta:</strong> Solo ID PC e stato assegnazione (ASSEGNATO/DISPONIBILE)</p>
                <p><strong>Nel Codice a Barre:</strong> ID univoco del PC per ricerca rapida nel database</p>
                <p><strong>Nel Sistema:</strong> Collegamento completo PC → Dipendente consultabile</p>
              </div>
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
                    className="bg-white border border-gray-300 mx-auto relative shadow-sm"
                    style={{
                      width: '240px',
                      height: '120px',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    {/* Header vuoto */}
                    <div className="p-3 pb-1">
                    </div>
                    
                    {/* Area centrale con info PC */}
                    <div className="px-3 py-2 flex-grow flex flex-col justify-center">
                      <div className="text-center bg-gradient-to-br from-gray-50 to-gray-100 rounded p-2 mx-1">
                        <div className="text-gray-700 text-lg font-semibold mb-1">
                          {selectedPcData.brand?.toUpperCase()} {selectedPcData.model}
                        </div>
                        <div className="text-gray-500 text-xs font-medium mb-2">
                          S/N: {selectedPcData.serialNumber || 'N/A'}
                        </div>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <img 
                            src="/assets/maori-logo.jpeg" 
                            alt="Maori Group Logo" 
                            className="h-3 w-auto object-contain"
                          />
                          <div className="text-gray-600 text-xs font-medium">
                            info@maorigroup.it
                          </div>
                        </div>
                        {customText && (
                          <div className="text-gray-600 text-xs mb-2 italic">
                            {customText}
                          </div>
                        )}
                        {includeBarcode && (
                          <div className="flex justify-center mt-2">
                            <div className="w-36 h-10 bg-gray-900 flex items-center justify-center text-white text-xs rounded border shadow-sm">
                              ||||||||||||||||
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Footer vuoto */}
                    <div className="px-3 pb-2">
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
                    <div>
                      <span className="text-muted-foreground">S/N:</span>
                      <span className="ml-2 font-mono text-xs">{selectedPcData.serialNumber || 'N/A'}</span>
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