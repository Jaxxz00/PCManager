import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Settings, UserPlus, UserMinus, Wrench, FileText, Search } from "lucide-react";
import type { PcHistory } from "@shared/schema";

interface PcHistoryProps {
  pcId?: string;
  serialNumber?: string;
}

export function PcHistory({ pcId, serialNumber }: PcHistoryProps) {
  const [searchSerial, setSearchSerial] = useState(serialNumber || "");

  // Query per storico specifico PC
  const { data: pcHistory, isLoading: pcHistoryLoading } = useQuery<PcHistory[]>({
    queryKey: ["/api/pcs", pcId, "history"],
    enabled: !!pcId,
  });

  // Query per storico basato su serial number
  const { data: serialHistory, isLoading: serialHistoryLoading } = useQuery<PcHistory[]>({
    queryKey: ["/api/pc-history/serial", searchSerial],
    enabled: !!searchSerial && searchSerial.length > 3,
  });

  // Query per tutto lo storico
  const { data: allHistory, isLoading: allHistoryLoading } = useQuery<PcHistory[]>({
    queryKey: ["/api/pc-history"],
    enabled: !pcId && !searchSerial,
  });

  const history = pcHistory || serialHistory || allHistory || [];
  const isLoading = pcHistoryLoading || serialHistoryLoading || allHistoryLoading;

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "created":
        return <Settings className="h-4 w-4 text-blue-600" />;
      case "assigned":
        return <UserPlus className="h-4 w-4 text-green-600" />;
      case "unassigned":
        return <UserMinus className="h-4 w-4 text-orange-600" />;
      case "maintenance":
        return <Wrench className="h-4 w-4 text-yellow-600" />;
      case "status_change":
        return <Settings className="h-4 w-4 text-purple-600" />;
      case "specs_update":
        return <Settings className="h-4 w-4 text-indigo-600" />;
      case "notes_update":
        return <FileText className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getEventBadgeColor = (eventType: string) => {
    switch (eventType) {
      case "created":
        return "bg-blue-100 text-blue-800";
      case "assigned":
        return "bg-green-100 text-green-800";
      case "unassigned":
        return "bg-orange-100 text-orange-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "status_change":
        return "bg-purple-100 text-purple-800";
      case "specs_update":
        return "bg-indigo-100 text-indigo-800";
      case "notes_update":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatEventType = (eventType: string) => {
    switch (eventType) {
      case "created":
        return "Creazione PC";
      case "assigned":
        return "Assegnazione";
      case "unassigned":
        return "Rimozione Assegnazione";
      case "maintenance":
        return "Manutenzione";
      case "status_change":
        return "Cambio Stato";
      case "specs_update":
        return "Aggiornamento Specifiche";
      case "notes_update":
        return "Aggiornamento Note";
      default:
        return eventType;
    }
  };

  return (
    <div className="space-y-6">
      {!pcId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Ricerca Storico per Serial Number
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Inserisci serial number (es: DL001234567)"
                value={searchSerial}
                onChange={(e) => setSearchSerial(e.target.value)}
                data-testid="input-search-serial"
              />
              <Button 
                onClick={() => setSearchSerial("")}
                variant="outline"
                data-testid="button-clear-search"
              >
                Cancella
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Storico PC
            {searchSerial && ` - ${searchSerial}`}
            {pcId && ` - ID: ${pcId}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Caricamento storico...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessun evento nello storico</p>
              {searchSerial && searchSerial.length <= 3 && (
                <p className="text-sm mt-2">Inserisci almeno 4 caratteri per la ricerca</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  data-testid={`history-entry-${entry.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        {getEventIcon(entry.eventType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            className={getEventBadgeColor(entry.eventType)}
                            data-testid={`badge-event-type-${entry.eventType}`}
                          >
                            {formatEventType(entry.eventType)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            S/N: {entry.serialNumber}
                          </span>
                        </div>
                        <p className="font-medium text-sm">{entry.eventDescription}</p>
                        
                        {(entry.oldValue || entry.newValue) && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {entry.oldValue && (
                              <div>
                                <span className="font-medium">Da:</span> {entry.oldValue}
                              </div>
                            )}
                            {entry.newValue && (
                              <div>
                                <span className="font-medium">A:</span> {entry.newValue}
                              </div>
                            )}
                          </div>
                        )}

                        {entry.relatedEmployeeName && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>Dipendente: {entry.relatedEmployeeName}</span>
                          </div>
                        )}

                        {entry.notes && (
                          <div className="mt-2 text-xs text-muted-foreground bg-gray-50 rounded p-2">
                            <FileText className="h-3 w-3 inline mr-1" />
                            {entry.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(entry.createdAt || new Date()).toLocaleDateString('it-IT')}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {new Date(entry.createdAt || new Date()).toLocaleTimeString('it-IT')}
                      </div>
                      {entry.performedByName && (
                        <div className="flex items-center gap-1 mt-1">
                          <User className="h-3 w-3" />
                          {entry.performedByName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}