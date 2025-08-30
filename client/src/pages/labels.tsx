import { useState, useMemo, useRef } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery } from "@tanstack/react-query";
import { 
  QrCode, 
  Search, 
  Download, 
  Printer, 
  Settings, 
  Filter,
  Monitor,
  User,
  Check,
  Package,
  Grid3X3,
  Palette,
  Maximize
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { PcWithEmployee } from "@shared/schema";

export default function Labels() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPcs, setSelectedPcs] = useState<Set<string>>(new Set());
  const [labelSettings, setLabelSettings] = useState({
    format: "5x3cm",
    includeQR: true,
    includeLogo: true,
    includeSerial: false,
    includeEmployee: false,
    layout: "compact"
  });
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: pcs = [], isLoading } = useQuery<PcWithEmployee[]>({
    queryKey: ["/api/pcs"]
  });

  // Filtri PC
  const filteredPcs = useMemo(() => {
    return pcs.filter((pc) => {
      // Filtro ricerca
      if (debouncedSearch.trim()) {
        const searchLower = debouncedSearch.toLowerCase();
        const matches = (
          (pc.pcId || '').toLowerCase().includes(searchLower) ||
          (pc.brand || '').toLowerCase().includes(searchLower) ||
          (pc.model || '').toLowerCase().includes(searchLower) ||
          (pc.serialNumber || '').toLowerCase().includes(searchLower) ||
          (pc.employee?.name || '').toLowerCase().includes(searchLower)
        );
        if (!matches) return false;
      }

      // Filtro stato
      if (statusFilter && pc.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [pcs, debouncedSearch, statusFilter]);

  // Statistiche
  const totalPcs = pcs.length;
  const activePcs = pcs.filter(pc => pc.status === 'active').length;
  const selectedCount = selectedPcs.size;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPcs(new Set(filteredPcs.map(pc => pc.id)));
    } else {
      setSelectedPcs(new Set());
    }
  };

  const handleSelectPc = (pcId: string, checked: boolean) => {
    const newSelected = new Set(selectedPcs);
    if (checked) {
      newSelected.add(pcId);
    } else {
      newSelected.delete(pcId);
    }
    setSelectedPcs(newSelected);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">Attivo</Badge>;
      case "maintenance":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">Manutenzione</Badge>;
      case "retired":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 text-xs">Dismesso</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const generateQRContent = (pc: PcWithEmployee) => {
    return `https://maorigroup.com/pc/${pc.id}`;
  };

  const handlePrintLabels = () => {
    if (selectedPcs.size === 0) {
      toast({
        title: "Nessun PC selezionato",
        description: "Seleziona almeno un PC per stampare le etichette.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Stampa avviata",
      description: `Generazione di ${selectedPcs.size} etichette in corso...`
    });

    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleDownloadLabels = () => {
    if (selectedPcs.size === 0) {
      toast({
        title: "Nessun PC selezionato",
        description: "Seleziona almeno un PC per scaricare le etichette.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Download avviato",
      description: `Download di ${selectedPcs.size} etichette PDF in corso...`
    });
  };

  const selectedPcsData = pcs.filter(pc => selectedPcs.has(pc.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Etichette QR</h1>
          <p className="text-muted-foreground">Genera e stampa etichette QR per PC aziendali - {totalPcs} PC totali</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleDownloadLabels}
            disabled={selectedPcs.size === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download PDF ({selectedPcs.size})
          </Button>
          <Button 
            onClick={handlePrintLabels}
            disabled={selectedPcs.size === 0}
            className="bg-primary hover:bg-primary/90 flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Stampa Etichette ({selectedPcs.size})
          </Button>
        </div>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Monitor className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">PC Totali</p>
                <p className="text-2xl font-bold">{totalPcs}</p>
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
                <p className="text-2xl font-bold">{activePcs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Check className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Selezionati</p>
                <p className="text-2xl font-bold">{selectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Etichette Pronte</p>
                <p className="text-2xl font-bold">{selectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="selection" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="selection" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Selezione PC
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Impostazioni
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Anteprima
          </TabsTrigger>
        </TabsList>

        <TabsContent value="selection" className="space-y-6">
          {/* Filtri e Ricerca */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtri e Ricerca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca PC..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Tutti gli stati</option>
                  <option value="active">Attivo</option>
                  <option value="maintenance">Manutenzione</option>
                  <option value="retired">Dismesso</option>
                </select>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("");
                    setSelectedPcs(new Set());
                  }}
                  className="flex items-center gap-2"
                >
                  Reset Filtri
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabella PC */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">
                  PC Disponibili ({filteredPcs.length})
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={filteredPcs.length > 0 && filteredPcs.every(pc => selectedPcs.has(pc.id))}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm">Seleziona tutti</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={filteredPcs.length > 0 && filteredPcs.every(pc => selectedPcs.has(pc.id))}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="font-medium">PC ID</TableHead>
                      <TableHead className="font-medium">Marca/Modello</TableHead>
                      <TableHead className="font-medium">Serial Number</TableHead>
                      <TableHead className="font-medium">Stato</TableHead>
                      <TableHead className="font-medium">Dipendente</TableHead>
                      <TableHead className="font-medium">QR Code</TableHead>
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
                    ) : filteredPcs.length > 0 ? (
                      filteredPcs.map((pc) => (
                        <TableRow key={pc.id} className="hover:bg-muted/50">
                          <TableCell>
                            <Checkbox
                              checked={selectedPcs.has(pc.id)}
                              onCheckedChange={(checked) => handleSelectPc(pc.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{pc.pcId}</TableCell>
                          <TableCell>{pc.brand} {pc.model}</TableCell>
                          <TableCell className="font-mono text-sm">{pc.serialNumber}</TableCell>
                          <TableCell>
                            {getStatusBadge(pc.status)}
                          </TableCell>
                          <TableCell>
                            {pc.employee ? (
                              <div className="flex items-center gap-1 text-sm">
                                <User className="h-3 w-3" />
                                <span>{pc.employee.name}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Non assegnato</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <QrCode className="h-4 w-4 text-blue-600" />
                              <span className="text-xs text-muted-foreground">
                                {generateQRContent(pc).slice(-12)}...
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <Monitor className="h-12 w-12 text-muted-foreground/50" />
                            <p className="text-muted-foreground">
                              {searchTerm || statusFilter 
                                ? "Nessun PC trovato con i filtri applicati" 
                                : "Nessun PC disponibile"
                              }
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Impostazioni Etichette
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Formato Etichetta</h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="5x3cm"
                        checked={labelSettings.format === "5x3cm"}
                        onChange={(e) => setLabelSettings(prev => ({ ...prev, format: e.target.value }))}
                      />
                      <span>5cm x 3cm (Standard)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="4x2cm"
                        checked={labelSettings.format === "4x2cm"}
                        onChange={(e) => setLabelSettings(prev => ({ ...prev, format: e.target.value }))}
                      />
                      <span>4cm x 2cm (Compatto)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="6x4cm"
                        checked={labelSettings.format === "6x4cm"}
                        onChange={(e) => setLabelSettings(prev => ({ ...prev, format: e.target.value }))}
                      />
                      <span>6cm x 4cm (Grande)</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Contenuto Etichetta</h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <Checkbox
                        checked={labelSettings.includeQR}
                        onCheckedChange={(checked) => 
                          setLabelSettings(prev => ({ ...prev, includeQR: checked as boolean }))
                        }
                      />
                      <span>QR Code (obbligatorio)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <Checkbox
                        checked={labelSettings.includeLogo}
                        onCheckedChange={(checked) => 
                          setLabelSettings(prev => ({ ...prev, includeLogo: checked as boolean }))
                        }
                      />
                      <span>Logo Maori Group</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <Checkbox
                        checked={labelSettings.includeSerial}
                        onCheckedChange={(checked) => 
                          setLabelSettings(prev => ({ ...prev, includeSerial: checked as boolean }))
                        }
                      />
                      <span>Serial Number</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <Checkbox
                        checked={labelSettings.includeEmployee}
                        onCheckedChange={(checked) => 
                          setLabelSettings(prev => ({ ...prev, includeEmployee: checked as boolean }))
                        }
                      />
                      <span>Nome Dipendente</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Layout</h3>
                <div className="grid grid-cols-3 gap-4">
                  <label className="flex flex-col items-center space-y-2 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="radio"
                      value="compact"
                      checked={labelSettings.layout === "compact"}
                      onChange={(e) => setLabelSettings(prev => ({ ...prev, layout: e.target.value }))}
                    />
                    <div className="text-center">
                      <Grid3X3 className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-sm">Compatto</span>
                    </div>
                  </label>
                  <label className="flex flex-col items-center space-y-2 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="radio"
                      value="detailed"
                      checked={labelSettings.layout === "detailed"}
                      onChange={(e) => setLabelSettings(prev => ({ ...prev, layout: e.target.value }))}
                    />
                    <div className="text-center">
                      <Maximize className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-sm">Dettagliato</span>
                    </div>
                  </label>
                  <label className="flex flex-col items-center space-y-2 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="radio"
                      value="minimal"
                      checked={labelSettings.layout === "minimal"}
                      onChange={(e) => setLabelSettings(prev => ({ ...prev, layout: e.target.value }))}
                    />
                    <div className="text-center">
                      <QrCode className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-sm">Minimale</span>
                    </div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                Anteprima Etichette ({selectedPcsData.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPcsData.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">Nessuna etichetta selezionata</h3>
                  <p className="text-muted-foreground mb-4">
                    Seleziona uno o più PC dalla tab "Selezione PC" per visualizzare l'anteprima delle etichette.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Formato: {labelSettings.format} • Layout: {labelSettings.layout}
                    </p>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Scarica Anteprima
                    </Button>
                  </div>
                  
                  {/* Anteprima etichette */}
                  <div 
                    ref={printRef}
                    className="grid grid-cols-4 gap-4 p-4 border rounded-lg bg-white"
                  >
                    {selectedPcsData.slice(0, 12).map((pc) => (
                      <div 
                        key={pc.id}
                        className={`border border-gray-300 bg-white p-2 flex flex-col items-center justify-center text-center ${
                          labelSettings.format === "5x3cm" ? "h-24 w-32" :
                          labelSettings.format === "4x2cm" ? "h-16 w-24" :
                          "h-32 w-40"
                        }`}
                      >
                        {labelSettings.includeLogo && (
                          <div className="text-xs font-bold text-blue-800 mb-1">MAORI GROUP</div>
                        )}
                        
                        {labelSettings.includeQR && (
                          <div className="bg-black text-white text-xs p-1 mb-1 font-mono">
                            [QR {pc.pcId}]
                          </div>
                        )}
                        
                        {labelSettings.layout !== "minimal" && (
                          <>
                            <div className="text-xs font-semibold truncate w-full">{pc.pcId}</div>
                            {labelSettings.includeSerial && (
                              <div className="text-xs text-gray-600 truncate w-full">{pc.serialNumber}</div>
                            )}
                            {labelSettings.includeEmployee && pc.employee && (
                              <div className="text-xs text-gray-500 truncate w-full">{pc.employee.name}</div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {selectedPcsData.length > 12 && (
                    <p className="text-sm text-muted-foreground text-center">
                      ... e altre {selectedPcsData.length - 12} etichette
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}