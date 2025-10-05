import { Download, FileText, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Asset, Employee } from "@shared/schema";

interface DataExportProps {
  pcs: Asset[];
  employees: Employee[];
  filteredPcs?: Asset[];
}

export default function DataExport({ pcs, employees, filteredPcs }: DataExportProps) {
  const { toast } = useToast();

  const exportToCSV = (data: Record<string, string | number | boolean | null>[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "Errore",
        description: "Nessun dato da esportare",
        variant: "destructive",
      });
      return;
    }

    // Ottiene le chiavi dalla prima riga
    const headers = Object.keys(data[0]);
    
    // Converte i dati in formato CSV
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Gestisce valori con virgole o virgolette
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value == null ? '' : String(value);
        }).join(',')
      )
    ].join('\n');

    // Crea e scarica il file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Esportazione Completata",
      description: `File ${filename}.csv scaricato con successo`,
    });
  };

  const exportPCs = () => {
    const dataToExport = (filteredPcs || pcs).map(pc => ({
      'Codice Asset': pc.assetCode,
      'Marca': pc.brand || 'N/A',
      'Modello': pc.model || 'N/A',
      'CPU': (pc.specs as any)?.cpu || 'N/A',
      'RAM (GB)': (pc.specs as any)?.ram || 'N/A',
      'Storage': (pc.specs as any)?.storage || 'N/A',
      'Sistema Operativo': (pc.specs as any)?.operatingSystem || 'N/A',
      'Numero Serie': pc.serialNumber || 'N/A',
      'Data Acquisto': pc.purchaseDate || 'N/A',
      'Scadenza Garanzia': pc.warrantyExpiry || 'N/A',
      'Stato': pc.status === 'assegnato' ? 'Assegnato' : pc.status === 'disponibile' ? 'Disponibile' : pc.status === 'manutenzione' ? 'Manutenzione' : 'Dismesso',
      'Note': pc.notes || '',
      'Data Creazione': pc.createdAt ? new Date(pc.createdAt).toLocaleDateString('it-IT') : '',
      'Ultimo Aggiornamento': pc.updatedAt ? new Date(pc.updatedAt).toLocaleDateString('it-IT') : ''
    }));

    exportToCSV(dataToExport, 'inventario_pc');
  };

  const exportEmployees = () => {
    const dataToExport = employees.map(emp => ({
      'Nome': emp.name,
      'Email': emp.email,
      'Dipartimento': emp.department,
      'Azienda': emp.company,
      'Data Registrazione': emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('it-IT') : '',
      'PC Assegnati': pcs.filter(pc => pc.employeeId === emp.id).map(pc => pc.assetCode).join('; ') || 'Nessuno'
    }));

    exportToCSV(dataToExport, 'dipendenti');
  };

  const exportFullReport = () => {
    const currentDate = new Date().toLocaleDateString('it-IT');
    const totalPCs = pcs.length;
    const activePCs = pcs.filter(pc => pc.status === 'disponibile' || pc.status === 'assegnato').length;
    const maintenancePCs = pcs.filter(pc => pc.status === 'manutenzione').length;
    const retiredPCs = pcs.filter(pc => pc.status === 'dismesso').length;
    const assignedPCs = pcs.filter(pc => pc.employeeId).length;
    const unassignedPCs = totalPCs - assignedPCs;

    // Report di riepilogo
    const summaryData = [
      { 'Categoria': 'PC Totali', 'Valore': totalPCs },
      { 'Categoria': 'PC Attivi', 'Valore': activePCs },
      { 'Categoria': 'PC in Manutenzione', 'Valore': maintenancePCs },
      { 'Categoria': 'PC Dismessi', 'Valore': retiredPCs },
      { 'Categoria': 'PC Assegnati', 'Valore': assignedPCs },
      { 'Categoria': 'PC Non Assegnati', 'Valore': unassignedPCs },
      { 'Categoria': 'Dipendenti Totali', 'Valore': employees.length },
      { 'Categoria': 'Data Report', 'Valore': currentDate }
    ];

    exportToCSV(summaryData, 'report_completo');
  };

  const exportWarrantyReport = () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const warrantyData = pcs.map(pc => {
      const warrantyDate = pc.warrantyExpiry ? new Date(pc.warrantyExpiry) : new Date();
      const daysUntilExpiry = Math.ceil((warrantyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let status = 'Valida';
      if (warrantyDate <= now) status = 'Scaduta';
      else if (warrantyDate <= thirtyDaysFromNow) status = 'Scade tra 30 giorni';
      else if (warrantyDate <= ninetyDaysFromNow) status = 'Scade tra 90 giorni';

      return {
        'Codice Asset': pc.assetCode,
        'Marca': pc.brand || 'N/A',
        'Modello': pc.model || 'N/A',
        'Data Acquisto': pc.purchaseDate || 'N/A',
        'Scadenza Garanzia': pc.warrantyExpiry || 'N/A',
        'Giorni Rimanenti': daysUntilExpiry,
        'Stato Garanzia': status,
        'Stato PC': pc.status === 'assegnato' ? 'Assegnato' : pc.status === 'disponibile' ? 'Disponibile' : pc.status === 'manutenzione' ? 'Manutenzione' : 'Dismesso'
      };
    }).sort((a, b) => a['Giorni Rimanenti'] - b['Giorni Rimanenti']);

    exportToCSV(warrantyData, 'report_garanzie');
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={exportPCs}>
        <Table className="h-4 w-4 mr-1" />
        Esporta PC
      </Button>
      <Button variant="outline" size="sm" onClick={exportEmployees}>
        <FileText className="h-4 w-4 mr-1" />
        Esporta Dipendenti
      </Button>
      <Button variant="outline" size="sm" onClick={exportWarrantyReport}>
        <Download className="h-4 w-4 mr-1" />
        Report Garanzie
      </Button>
      <Button variant="outline" size="sm" onClick={exportFullReport}>
        <Download className="h-4 w-4 mr-1" />
        Report Completo
      </Button>
    </div>
  );
}