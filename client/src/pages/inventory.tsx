import { useState, useMemo, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Monitor, Smartphone, CreditCard, Keyboard, Box, Search, ScanBarcode, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Asset, Employee } from "@shared/schema";

// Asset types configuration
const assetTypes = [
  { value: "pc", label: "PC", icon: Monitor, color: "bg-blue-500" },
  { value: "smartphone", label: "Smartphone", icon: Smartphone, color: "bg-purple-500" },
  { value: "sim", label: "SIM", icon: CreditCard, color: "bg-green-500" },
  { value: "tastiera", label: "Tastiere", icon: Keyboard, color: "bg-orange-500" },
  { value: "monitor", label: "Monitor", icon: Monitor, color: "bg-indigo-500" },
  { value: "altro", label: "Altro", icon: Box, color: "bg-gray-500" },
] as const;

// Form schema
const assetFormSchema = z.object({
  assetCode: z.string().min(1, "Codice asset richiesto"),
  assetType: z.string().min(1, "Tipo asset richiesto"),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  status: z.string().default("disponibile"),
  employeeId: z.string().optional(),
  specs: z.record(z.any()).optional(),
  notes: z.string().optional(),
});

type AssetFormData = z.infer<typeof assetFormSchema>;

export default function Inventory() {
  const [selectedType, setSelectedType] = useState<string>("pc");
  const [showAssetDialog, setShowAssetDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(searchTerm, 300);
  const serialInputRef = useRef<HTMLInputElement>(null);

  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Filter assets by type and search
  const filteredAssets = useMemo(() => {
    let filtered = assets.filter((asset) => asset.assetType === selectedType);

    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter((asset) =>
        (asset.assetCode || "").toLowerCase().includes(searchLower) ||
        (asset.brand || "").toLowerCase().includes(searchLower) ||
        (asset.model || "").toLowerCase().includes(searchLower) ||
        (asset.serialNumber || "").toLowerCase().includes(searchLower) ||
        (asset.notes || "").toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [assets, selectedType, debouncedSearch]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalAssets = assets.length;
    const availableAssets = assets.filter((a) => a.status === "disponibile").length;
    const assignedAssets = assets.filter((a) => a.status === "assegnato" || a.employeeId).length;
    const maintenanceAssets = assets.filter((a) => a.status === "manutenzione").length;

    return { totalAssets, availableAssets, assignedAssets, maintenanceAssets };
  }, [assets]);

  // Mutations
  const createAssetMutation = useMutation({
    mutationFn: async (data: AssetFormData) => {
      return await apiRequest("POST", "/api/assets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Successo", description: "Asset creato con successo" });
      setShowAssetDialog(false);
      form.reset();
    },
    onError: (error: unknown) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante la creazione",
        variant: "destructive",
      });
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AssetFormData> }) => {
      return await apiRequest("PATCH", `/api/assets/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Successo", description: "Asset aggiornato con successo" });
      setShowAssetDialog(false);
      setEditingAsset(null);
      form.reset();
    },
    onError: (error: unknown) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante l'aggiornamento",
        variant: "destructive",
      });
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Successo", description: "Asset eliminato con successo" });
    },
    onError: (error: unknown) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante l'eliminazione",
        variant: "destructive",
      });
    },
  });

  const unassignAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/assets/${id}`, {
        employeeId: null,
        status: "disponibile",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Successo", description: "Assegnazione rimossa con successo" });
    },
    onError: (error: unknown) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante la rimozione",
        variant: "destructive",
      });
    },
  });

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      assetCode: "",
      assetType: selectedType,
      brand: "",
      model: "",
      serialNumber: "",
      purchaseDate: "",
      warrantyExpiry: "",
      status: "disponibile",
      employeeId: "",
      notes: "",
    },
  });

  // Auto-generate asset code when asset type changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Solo quando cambia il tipo e non stiamo editando un asset esistente
      if (name === 'assetType' && value.assetType && !editingAsset) {
        fetch(`/api/assets/next-code?type=${value.assetType}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
          }
        })
          .then(res => res.json())
          .then(data => {
            if (data.code) {
              form.setValue('assetCode', data.code);
            }
          })
          .catch(err => {
            console.error('Error fetching next asset code:', err);
          });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, editingAsset]);

  const onSubmit = (data: AssetFormData) => {
    if (editingAsset) {
      updateAssetMutation.mutate({ id: editingAsset.id, data });
    } else {
      createAssetMutation.mutate(data);
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    form.reset({
      assetCode: asset.assetCode,
      assetType: asset.assetType,
      brand: asset.brand || "",
      model: asset.model || "",
      serialNumber: asset.serialNumber || "",
      purchaseDate: asset.purchaseDate || "",
      warrantyExpiry: asset.warrantyExpiry || "",
      status: asset.status,
      employeeId: asset.employeeId || "",
      notes: asset.notes || "",
    });
    setShowAssetDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo asset?")) {
      deleteAssetMutation.mutate(id);
    }
  };

  const handleUnassign = (asset: Asset) => {
    const employeeName = getEmployeeName(asset.employeeId);
    if (confirm(`Vuoi rimuovere l'assegnazione di ${asset.assetCode} da ${employeeName}?`)) {
      unassignAssetMutation.mutate(asset.id);
    }
  };

  const handleAddNew = async () => {
    setEditingAsset(null);
    
    // Fetch next asset code for the selected type
    try {
      const response = await fetch(`/api/assets/next-code?type=${selectedType}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        }
      });
      const data = await response.json();
      
      form.reset({
        assetCode: data.code || "",
        assetType: selectedType,
        brand: "",
        model: "",
        serialNumber: "",
        purchaseDate: "",
        warrantyExpiry: "",
        status: "disponibile",
        employeeId: "",
        notes: "",
      });
    } catch (error) {
      console.error('Error fetching next asset code:', error);
      form.reset({
        assetCode: "",
        assetType: selectedType,
        brand: "",
        model: "",
        serialNumber: "",
        purchaseDate: "",
        warrantyExpiry: "",
        status: "disponibile",
        employeeId: "",
        notes: "",
      });
    }
    
    setShowAssetDialog(true);
  };

  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return "-";
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? employee.name : "-";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      disponibile: { bg: "bg-green-100", text: "text-green-800" },
      assegnato: { bg: "bg-blue-100", text: "text-blue-800" },
      active: { bg: "bg-blue-100", text: "text-blue-800" },
      manutenzione: { bg: "bg-yellow-100", text: "text-yellow-800" },
      dismesso: { bg: "bg-gray-100", text: "text-gray-800" },
      retired: { bg: "bg-gray-100", text: "text-gray-800" },
    };

    const variant = variants[status] || variants.disponibile;
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${variant.bg} ${variant.text}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Inventario Asset</h1>
            <p className="text-sm text-gray-600 mt-1">Gestione PC, smartphone, SIM, tastiere, monitor e altri dispositivi</p>
          </div>
          <Button onClick={handleAddNew} className="bg-blue-600" data-testid="button-add-asset">
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Asset
          </Button>
        </div>
      </div>

      <div className="p-8">
        {/* Statistics */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-900">{stats.totalAssets}</div>
              <p className="text-sm text-gray-600">Totale Asset</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.availableAssets}</div>
              <p className="text-sm text-gray-600">Disponibili</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.assignedAssets}</div>
              <p className="text-sm text-gray-600">Assegnati</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.maintenanceAssets}</div>
              <p className="text-sm text-gray-600">In Manutenzione</p>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Cerca per codice, marca, modello, seriale..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </div>

        {/* Tabs for Asset Types */}
        <Card className="p-6">
          <Tabs value={selectedType} onValueChange={setSelectedType}>
            <TabsList className="mb-6">
              {assetTypes.map((type) => {
                const Icon = type.icon;
                const count = assets.filter((a) => a.assetType === type.value).length;
                return (
                  <TabsTrigger key={type.value} value={type.value} data-testid={`tab-${type.value}`}>
                    <Icon className="w-4 h-4 mr-2" />
                    {type.label} ({count})
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {assetTypes.map((type) => (
              <TabsContent key={type.value} value={type.value}>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Caricamento...</div>
                ) : filteredAssets.length === 0 ? (
                  <div className="text-center py-12">
                    <type.icon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">Nessun {type.label.toLowerCase()} trovato</p>
                    <Button onClick={handleAddNew} className="mt-4" data-testid="button-add-first">
                      <Plus className="w-4 h-4 mr-2" />
                      Aggiungi primo {type.label.toLowerCase()}
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Codice</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Modello</TableHead>
                        <TableHead>Seriale</TableHead>
                        <TableHead>Assegnato a</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssets.map((asset) => (
                        <TableRow key={asset.id} data-testid={`row-asset-${asset.id}`}>
                          <TableCell className="font-medium">{asset.assetCode}</TableCell>
                          <TableCell>{asset.brand || "-"}</TableCell>
                          <TableCell>{asset.model || "-"}</TableCell>
                          <TableCell>{asset.serialNumber || "-"}</TableCell>
                          <TableCell>{getEmployeeName(asset.employeeId)}</TableCell>
                          <TableCell>{getStatusBadge(asset.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {asset.employeeId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-orange-600 border-orange-300 hover:text-orange-700 hover:bg-orange-50"
                                  onClick={() => handleUnassign(asset)}
                                  data-testid={`button-unassign-${asset.id}`}
                                >
                                  <UserX className="w-4 h-4 mr-1" />
                                  Riconsegna
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(asset)}
                                data-testid={`button-edit-${asset.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                onClick={() => handleDelete(asset.id)}
                                data-testid={`button-delete-${asset.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      </div>

      {/* Asset Form Dialog */}
      <Dialog open={showAssetDialog} onOpenChange={setShowAssetDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAsset ? "Modifica Asset" : "Nuovo Asset"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="assetCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codice Asset *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="es: PC-001, PHONE-001" data-testid="input-asset-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assetType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <FormControl>
                        <select {...field} className="w-full border rounded-md px-3 py-2" data-testid="select-asset-type">
                          {assetTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="es: Dell, Samsung" data-testid="input-brand" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modello</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="es: OptiPlex 7090" data-testid="input-model" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero Seriale</FormLabel>
                    <FormControl>
                      <div className="relative flex gap-2">
                        <Input 
                          {...field} 
                          ref={serialInputRef}
                          placeholder="Numero seriale o scansiona barcode" 
                          data-testid="input-serial"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            serialInputRef.current?.focus();
                            toast({
                              title: "Scanner barcode pronto",
                              description: "Scansiona il barcode del numero seriale",
                            });
                          }}
                          data-testid="button-scan-serial"
                          className="shrink-0"
                        >
                          <ScanBarcode className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Acquisto</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-purchase-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="warrantyExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scadenza Garanzia</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-warranty" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stato</FormLabel>
                      <FormControl>
                        <select {...field} className="w-full border rounded-md px-3 py-2" data-testid="select-status">
                          <option value="disponibile">Disponibile</option>
                          <option value="assegnato">Assegnato</option>
                          <option value="manutenzione">Manutenzione</option>
                          <option value="dismesso">Dismesso</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assegnato a</FormLabel>
                      <FormControl>
                        <select {...field} className="w-full border rounded-md px-3 py-2" data-testid="select-employee">
                          <option value="">Non assegnato</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        className="w-full border rounded-md px-3 py-2 min-h-[80px]"
                        placeholder="Note aggiuntive..."
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAssetDialog(false);
                    setEditingAsset(null);
                  }}
                  data-testid="button-cancel"
                >
                  Annulla
                </Button>
                <Button type="submit" data-testid="button-save">
                  {editingAsset ? "Aggiorna" : "Crea"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
