import { useState } from "react";
import { Filter, X, Download, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export interface FilterState {
  search: string;
  status: string;
  brand: string;
  ramMin: string;
  ramMax: string;
  warrantyExpiring: boolean;
  assignmentStatus: string;
  purchaseDateFrom: string;
  purchaseDateTo: string;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onExport: () => void;
}

export default function AdvancedFilters({ filters, onFiltersChange, onExport }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof FilterState, value: string | boolean) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      status: '',
      brand: '',
      ramMin: '',
      ramMax: '',
      warrantyExpiring: false,
      assignmentStatus: '',
      purchaseDateFrom: '',
      purchaseDateTo: ''
    });
  };

  const getActiveFiltersCount = () => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'search') return value.trim() !== '';
      if (typeof value === 'boolean') return value;
      return value !== '';
    }).length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const brands = ['Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'Apple'];

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <CardTitle className="flex items-center text-lg">
                <Filter className="mr-2 h-5 w-5" />
                Filtri Avanzati
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center space-x-2">
                {activeFiltersCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAllFilters();
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Pulisci
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="h-4 w-4 mr-1" />
                  Esporta
                </Button>
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Ricerca generale */}
            <div className="space-y-2">
              <Label htmlFor="search">Ricerca Generale</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Cerca per ID, marca, modello, seriale..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Separator />

            {/* Filtri in griglia */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Stato */}
              <div className="space-y-2">
                <Label htmlFor="status">Stato</Label>
                <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti gli stati" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutti gli stati</SelectItem>
                    <SelectItem value="active">Attivo</SelectItem>
                    <SelectItem value="maintenance">Manutenzione</SelectItem>
                    <SelectItem value="retired">Dismesso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Marca */}
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Select value={filters.brand} onValueChange={(value) => updateFilter('brand', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutte le marche" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutte le marche</SelectItem>
                    {brands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stato Assegnazione */}
              <div className="space-y-2">
                <Label htmlFor="assignment">Assegnazione</Label>
                <Select value={filters.assignmentStatus} onValueChange={(value) => updateFilter('assignmentStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutte le assegnazioni" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutte le assegnazioni</SelectItem>
                    <SelectItem value="assigned">Assegnato</SelectItem>
                    <SelectItem value="unassigned">Non Assegnato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* RAM Range */}
            <div className="space-y-2">
              <Label>RAM (GB)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    placeholder="Min"
                    type="number"
                    value={filters.ramMin}
                    onChange={(e) => updateFilter('ramMin', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Max"
                    type="number"
                    value={filters.ramMax}
                    onChange={(e) => updateFilter('ramMax', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Data Acquisto</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="date"
                    value={filters.purchaseDateFrom}
                    onChange={(e) => updateFilter('purchaseDateFrom', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    type="date"
                    value={filters.purchaseDateTo}
                    onChange={(e) => updateFilter('purchaseDateTo', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Filtri rapidi */}
            <div className="space-y-2">
              <Label>Filtri Rapidi</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filters.warrantyExpiring ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilter('warrantyExpiring', !filters.warrantyExpiring)}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Garanzia in Scadenza
                </Button>
                <Button
                  variant={filters.status === 'maintenance' ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilter('status', filters.status === 'maintenance' ? '' : 'maintenance')}
                >
                  In Manutenzione
                </Button>
                <Button
                  variant={filters.assignmentStatus === 'unassigned' ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilter('assignmentStatus', filters.assignmentStatus === 'unassigned' ? '' : 'unassigned')}
                >
                  Non Assegnati
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}