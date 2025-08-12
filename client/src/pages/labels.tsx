import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, Download, Eye, QrCode, Settings, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import QRCodeLib from "qrcode";
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

  const generateQRCode = async (data: string): Promise<string> => {
    try {
      return await QRCodeLib.toDataURL(data, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Errore generazione QR Code:', error);
      return '';
    }
  };

  const printLabel = async () => {
    if (!selectedPcData) return;
    
    const qrCodeDataUrl = await generateQRCode(`PC-${selectedPcData.pcId}`);
    const labelContent = generateProfessionalLabel(qrCodeDataUrl);
    
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

  const generateProfessionalLabel = (qrCodeUrl: string) => {
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
        <!-- Header con QR Code -->
        <div style="
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start;
          margin-bottom: 2mm;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 2mm;
          ">
            <div style="
              width: 4mm;
              height: 4mm;
              background: #2563eb;
              border-radius: 1mm;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="color: white; font-size: 6pt; font-weight: bold;">P</span>
            </div>
            <div style="
              font-weight: 700; 
              font-size: 8pt; 
              color: #1e293b;
              letter-spacing: 0.5px;
            ">
              PC MANAGER
            </div>
          </div>
          
          ${qrCodeUrl ? `
            <img src="${qrCodeUrl}" style="
              width: 12mm; 
              height: 12mm; 
              border: 1px solid #e0e0e0;
              border-radius: 1mm;
            " />
          ` : ''}
        </div>
        
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
            font-weight: 800; 
            font-size: 11pt; 
            color: #0f172a;
            margin-bottom: 1mm;
            letter-spacing: 0.3px;
          ">
            ${selectedPcData.pcId}
          </div>
          
          <div style="
            font-size: 7pt; 
            color: #475569;
            font-weight: 500;
            margin-bottom: 1mm;
          ">
            ${selectedPcData.brand?.toUpperCase()} ${selectedPcData.model}
          </div>
          
          ${selectedPcData.employee?.name ? `
            <div style="
              font-size: 6pt; 
              color: #64748b;
              font-weight: 400;
            ">
              ${selectedPcData.employee.name}
            </div>
          ` : ''}
          
          ${customText ? `
            <div style="
              font-size: 6pt; 
              color: #475569;
              font-weight: 500;
              margin-top: 1mm;
              font-style: italic;
            ">
              ${customText}
            </div>
          ` : ''}
        </div>
        
        <!-- Footer -->
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 5pt; 
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 1mm;
        ">
          <span>Sistema IT Aziendale</span>
          <span>${new Date().toLocaleDateString('it-IT')}</span>
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
                    className="bg-white border border-gray-300 mx-auto relative shadow-sm"
                    style={{
                      width: '240px',
                      height: '120px',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    {/* Header con Logo e QR */}
                    <div className="flex justify-between items-start p-3 pb-1">
                      {includeLogo && (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-primary rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">P</span>
                          </div>
                          <div className="font-bold text-sm text-gray-900 tracking-wide">
                            PC MANAGER
                          </div>
                        </div>
                      )}
                      {includeQR && (
                        <div className="w-12 h-12 bg-gray-900 flex items-center justify-center text-white text-xs rounded border shadow-sm">
                          QR
                        </div>
                      )}
                    </div>
                    
                    {/* Area centrale con info PC */}
                    <div className="px-3 py-2 flex-grow flex flex-col justify-center">
                      <div className="text-center bg-gradient-to-br from-gray-50 to-gray-100 rounded p-2 mx-1">
                        <div className="font-bold text-lg text-gray-900 mb-1 tracking-wide">
                          {selectedPcData.pcId}
                        </div>
                        <div className="text-gray-600 text-sm font-medium">
                          {selectedPcData.brand?.toUpperCase()} {selectedPcData.model}
                        </div>
                        {selectedPcData.employee?.name && (
                          <div className="text-gray-500 text-xs mt-1">
                            {selectedPcData.employee.name}
                          </div>
                        )}
                        {customText && (
                          <div className="text-gray-600 text-xs mt-1 italic">
                            {customText}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="flex justify-between items-center px-3 pb-2 border-t border-gray-200 pt-1">
                      <div className="text-gray-400 text-xs">
                        Sistema IT Aziendale
                      </div>
                      <div className="text-gray-400 text-xs">
                        {new Date().toLocaleDateString('it-IT')}
                      </div>
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