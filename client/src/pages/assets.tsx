import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Smartphone, CreditCard, Keyboard, Monitor, Box, Tablet, Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Asset } from "@shared/schema";

// Asset types con icone
const assetTypes = [
  { value: "computer", label: "Computer", icon: Keyboard },
  { value: "altro", label: "Altro", icon: Box },
  { value: "monitor", label: "Monitor", icon: Monitor },
  { value: "sim", label: "SIM", icon: CreditCard },
  { value: "smartphone", label: "Smartphone", icon: Smartphone },
  { value: "tablet", label: "Tablet", icon: Tablet },
] as const;

// Schema form per asset con validazione condizionale
const assetFormSchema = z.object({
  // assetCode generato automaticamente lato server
  assetCode: z.string().optional(),
  assetType: z.string().min(1, "Tipo asset richiesto"),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().min(1, "Seriale richiesto"),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  status: z.string().default("disponibile"),
  specs: z.record(z.any()).optional(),
  notes: z.string().optional(),
  // Campi specifici per SIM
  carrier: z.string().optional(),
  phoneNumber: z.string().optional(),
  holder: z.string().optional(),
}).refine((data) => {
  // Per tutti i tipi tranne SIM, brand e model sono obbligatori
  if (data.assetType !== "sim") {
    return data.brand && data.brand.length > 0 && data.model && data.model.length > 0;
  }
  return true;
}, {
  message: "Marca e modello sono obbligatori per questo tipo di asset",
  path: ["brand"]
});

type AssetFormData = z.infer<typeof assetFormSchema>;

export default function Assets() {
  const [selectedType, setSelectedType] = useState<string>("computer");
  const [showAssetDialog, setShowAssetDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all assets including PCs
  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets/all-including-pcs"],
  });

  // Filter assets by type - ottimizzato con useMemo
  const filteredAssets = useMemo(() => 
    assets.filter((asset) => asset.assetType === selectedType),
    [assets, selectedType]
  );

  // Create asset mutation
  const createAssetMutation = useMutation({
    mutationFn: async (data: AssetFormData) => {
      return await apiRequest("POST", "/api/assets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets/all-including-pcs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Successo",
        description: "Asset creato con successo",
      });
      setShowAssetDialog(false);
      form.reset();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Errore durante la creazione dell'asset";
      toast({
        title: "Errore",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Callback ottimizzato per la creazione
  const handleCreateAsset = useCallback((data: AssetFormData) => {
    createAssetMutation.mutate(data);
  }, [createAssetMutation]);

  // Update asset mutation
  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AssetFormData> }) => {
      return await apiRequest("PATCH", `/api/assets/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets/all-including-pcs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Successo",
        description: "Asset aggiornato con successo",
      });
      setShowAssetDialog(false);
      setEditingAsset(null);
      form.reset();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Errore durante l'aggiornamento dell'asset";
      toast({
        title: "Errore",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Callback ottimizzato per l'aggiornamento
  const handleUpdateAsset = useCallback((id: string, data: Partial<AssetFormData>) => {
    updateAssetMutation.mutate({ id, data });
  }, [updateAssetMutation]);

  // Delete asset mutation
  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets/all-including-pcs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Successo",
        description: "Asset eliminato con successo",
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Errore durante l'eliminazione dell'asset";
      toast({
        title: "Errore",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Callback ottimizzato per l'eliminazione
  const handleDeleteAsset = useCallback((id: string) => {
    if (window.confirm("Sei sicuro di voler eliminare questo asset?")) {
      deleteAssetMutation.mutate(id);
    }
  }, [deleteAssetMutation]);

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      assetType: selectedType,
      brand: "",
      model: "",
      serialNumber: "",
      purchaseDate: "",
      warrantyExpiry: "",
      status: "disponibile",
      notes: "",
    },
    mode: "onChange", // Validazione in tempo reale
  });

  // Callback ottimizzato per il submit
  const handleSubmit = useCallback((data: AssetFormData) => {
    if (editingAsset) {
      handleUpdateAsset(editingAsset.id, data);
    } else {
      handleCreateAsset(data);
    }
  }, [editingAsset, handleUpdateAsset, handleCreateAsset]);

  // Callback ottimizzato per l'edit
  const handleEdit = useCallback((asset: Asset) => {
    setEditingAsset(asset);
    form.reset({
      assetType: asset.assetType,
      brand: asset.brand || "",
      model: asset.model || "",
      serialNumber: asset.serialNumber || "",
      purchaseDate: asset.purchaseDate ? (typeof asset.purchaseDate === "string" ? asset.purchaseDate : asset.purchaseDate.toISOString().slice(0, 10)) : "",
      warrantyExpiry: asset.warrantyExpiry ? (typeof asset.warrantyExpiry === "string" ? asset.warrantyExpiry : asset.warrantyExpiry.toISOString().slice(0, 10)) : "",
      status: asset.status,
      notes: asset.notes || "",
    });
    setShowAssetDialog(true);
  }, [form]);

  // Usa il callback ottimizzato per delete
  const handleDelete = handleDeleteAsset;

  // Callback ottimizzato per aggiungere nuovo asset
  const handleAddNew = useCallback(() => {
    setEditingAsset(null);
    form.reset({
      assetCode: "",
      assetType: selectedType,
      brand: "",
      model: "",
      serialNumber: "",
      purchaseDate: "",
      warrantyExpiry: "",
      status: "disponibile",
      notes: "",
    });
    setShowAssetDialog(true);
  }, [form, selectedType]);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Asset</h1>
            <p className="text-sm text-gray-600 mt-1">Gestione computer, smartphone, SIM, tablet, monitor e altri dispositivi</p>
          </div>
          <Dialog open={showAssetDialog} onOpenChange={setShowAssetDialog}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-add-asset">
                <Plus className="w-4 h-4 mr-2" />
                Nuovo Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingAsset ? "Modifica Asset" : "Nuovo Asset"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Codice Asset rimosso: verrà generato automaticamente */}
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

                  {/* Campi Marca e Modello solo per asset non-SIM */}
                  {form.watch("assetType") !== "sim" && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="brand"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Marca</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder={
                                  form.watch("assetType") === "computer" ? "Dell" : 
                                  form.watch("assetType") === "altro" ? "Marca" : 
                                  form.watch("assetType") === "monitor" ? "Marca" : 
                                  form.watch("assetType") === "tablet" ? "Marca" : 
                                  "es: Samsung"
                                } 
                                className="placeholder:text-gray-400" 
                                data-testid="input-brand" 
                              />
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
                              <Input 
                                {...field} 
                                placeholder={
                                  form.watch("assetType") === "computer" ? "Modello" : 
                                  form.watch("assetType") === "altro" ? "Modello" : 
                                  form.watch("assetType") === "monitor" ? "Modello" : 
                                  form.watch("assetType") === "tablet" ? "Modello" : 
                                  "es: Galaxy S24"
                                } 
                                className="placeholder:text-gray-400" 
                                data-testid="input-model" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numero Seriale</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Numero seriale" className="placeholder:text-gray-400" data-testid="input-serial" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campi specifici per SIM */}
                  {form.watch("assetType") === "sim" ? (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="carrier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Carrier</FormLabel>
                            <FormControl>
                              <select {...field} className="w-full border rounded-md px-3 py-2" data-testid="select-carrier">
                                <option value="">Seleziona carrier</option>
                                <option value="TIM">TIM</option>
                                <option value="Vodafone">Vodafone</option>
                                <option value="Wind Tre">Wind Tre</option>
                                <option value="Iliad">Iliad</option>
                                <option value="Fastweb">Fastweb</option>
                                <option value="PosteMobile">PosteMobile</option>
                                <option value="CoopVoce">CoopVoce</option>
                                <option value="Altro">Altro</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Numero</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="es: +39 123 456 7890" className="placeholder:text-gray-400" data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="purchaseDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Acquisto</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} className="placeholder:text-gray-400" data-testid="input-purchase-date" />
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
                              <Input type="date" {...field} className="placeholder:text-gray-400" data-testid="input-warranty" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Campo Intestazione per SIM */}
                  {form.watch("assetType") === "sim" && (
                    <FormField
                      control={form.control}
                      name="holder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Intestazione</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome intestatario SIM" className="placeholder:text-gray-400" data-testid="input-holder" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Campo stato rimosso su richiesta */}

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Note</FormLabel>
                        <FormControl>
                          <textarea
                            {...field}
                            className="w-full border rounded-md px-3 py-2 min-h-[80px] placeholder:text-gray-400"
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
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-save">
                      {editingAsset ? "Aggiorna" : "Crea"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-8">
        <Card className="p-6">
          <Tabs value={selectedType} onValueChange={setSelectedType}>
            <TabsList className="mb-6">
              {assetTypes.map((type) => {
                const Icon = type.icon;
                const count = assets.filter((a) => a.assetType === type.value).length;
                return (
                  <TabsTrigger
                    key={type.value}
                    value={type.value}
                    className="data-[state=active]:font-bold data-[state=active]:text-blue-600"
                    data-testid={`tab-${type.value}`}
                  >
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
                    <p className="text-gray-500">Nessun {type.label.toLowerCase()} disponibile</p>
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
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                asset.status === "disponibile"
                                  ? "bg-green-100 text-green-800"
                                  : asset.status === "assegnato"
                                  ? "bg-blue-100 text-blue-800"
                                  : asset.status === "manutenzione"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {asset.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(asset)}
                                data-testid={`button-edit-${asset.id}`}
                              >
                                <Pencil className="w-4 h-4" />
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
    </div>
  );
}
