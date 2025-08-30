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
        width: 1.2,
        height: 25,
        displayValue: true,
        fontSize: 7,
        textAlign: "center",
        textPosition: "bottom",
        textMargin: 1,
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
        width: 50mm; 
        height: 30mm; 
        border: 1px solid #e0e0e0; 
        padding: 2mm; 
        display: flex; 
        flex-direction: column;
        justify-content: space-between;
        background: white;
        font-family: 'Inter', sans-serif;
        position: relative;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        overflow: hidden;
      ">
        <!-- Informazioni Principali -->
        <div style="
          text-align: center;
          padding: 1mm;
        ">
          <div style="
            font-size: 8pt; 
            color: #475569;
            font-weight: 600;
            margin-bottom: 0.5mm;
            line-height: 1.1;
          ">
            ${selectedPcData.brand?.toUpperCase()} ${selectedPcData.model}
          </div>
          
          <div style="
            font-size: 6pt; 
            color: #64748b;
            font-weight: 500;
            margin-bottom: 1mm;
          ">
            S/N: ${selectedPcData.serialNumber || 'N/A'}
          </div>
          
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1mm;
            margin-bottom: 1mm;
          ">
            <img src="/assets/maori-logo.jpeg" alt="Maori Group Logo" style="
              height: 2.5mm;
              width: auto;
              object-fit: contain;
            "/>
            <div style="
              font-size: 5pt; 
              color: #475569;
              font-weight: 500;
            ">
              info@maorigroup.it
            </div>
          </div>
          
          ${customText ? `
            <div style="
              font-size: 5pt; 
              color: #475569;
              font-weight: 500;
              margin-bottom: 1mm;
              font-style: italic;
            ">
              ${customText}
            </div>
          ` : ''}
        </div>
        
        <!-- Codice a Barre -->
        ${barcodeUrl ? `
          <div style="
            display: flex;
            justify-content: center;
            align-items: center;
          ">
            <img src="${barcodeUrl}" style="
              width: 22mm; 
              height: 6mm; 
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
              <div style="width: 50px; height: 14px; background: #333; color: white; display: flex; align-items: center; justify-content: center; font-size: 6px; border-radius: 2px;">||||||||</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-900 rounded-xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
            <Printer className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Centro Stampa Etichette</h1>
            <p className="text-blue-100 text-lg">Sistema professionale per etichettatura dispositivi Maori Group</p>
            <div className="flex items-center gap-6 mt-2 text-sm text-blue-200">
              <div className="flex items-center gap-2">
                <Barcode className="w-4 h-4" />
                <span>Codici a barre CODE128</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span>Formato 5cm x 3cm</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>Logo aziendale incluso</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="bg-gradient-to-r from-amber-50 to-orange-100 p-4 rounded-lg border border-amber-200">
          <h2 className="text-lg font-semibold text-amber-900">Generazione Etichette</h2>
          <p className="text-amber-700">Crea etichette personalizzate per identificazione asset IT</p>
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
                <div className="border-2 border-dashed border-border p-6 rounded-lg bg-muted/30">
                  <div 
                    className="bg-white border-2 border-gray-300 mx-auto relative shadow-lg rounded-sm overflow-hidden"
                    style={{
                      width: '210px',
                      height: '126px',
                      fontFamily: 'Inter, sans-serif',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '8px'
                    }}
                  >
                    {/* Area centrale con info PC */}
                    <div className="flex-1 flex flex-col justify-center items-center text-center">
                      <div className="text-gray-800 text-base font-bold mb-1 leading-tight">
                        {selectedPcData.brand?.toUpperCase()} {selectedPcData.model}
                      </div>
                      <div className="text-gray-600 text-xs font-medium mb-1">
                        S/N: {selectedPcData.serialNumber || 'N/A'}
                      </div>
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <img 
                          src="/assets/maori-logo.jpeg" 
                          alt="Maori Group Logo" 
                          className="h-2.5 w-auto object-contain"
                        />
                        <div className="text-gray-700 text-xs font-medium">
                          info@maorigroup.it
                        </div>
                      </div>
                      {customText && (
                        <div className="text-gray-600 text-xs italic mb-1">
                          {customText}
                        </div>
                      )}
                    </div>
                    
                    {/* Codice a barre in fondo */}
                    {includeBarcode && (
                      <div className="flex justify-center">
                        <div className="w-20 h-4 bg-gray-900 flex items-center justify-center text-white text-xs rounded-sm">
                          <span className="font-mono text-xs">||||||</span>
                        </div>
                      </div>
                    )}
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


    </div>
  );
}