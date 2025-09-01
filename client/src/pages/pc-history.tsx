import { PcHistory } from "@/components/pc-history";

export default function PcHistoryPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Storico PC</h1>
        <p className="text-muted-foreground">
          Visualizza lo storico completo delle modifiche e degli eventi per ogni PC aziendale
        </p>
      </div>
      
      <PcHistory />
    </div>
  );
}