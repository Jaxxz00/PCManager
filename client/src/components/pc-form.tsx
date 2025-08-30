import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertPcSchema, type Employee } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { z } from "zod";

type PcFormData = z.infer<typeof insertPcSchema>;

interface PcFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PcForm({ open, onOpenChange }: PcFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const form = useForm<PcFormData>({
    resolver: zodResolver(insertPcSchema),
    defaultValues: {
      pcId: "",
      employeeId: "",
      brand: "",
      model: "",
      cpu: "",
      ram: 8,
      storage: "",
      operatingSystem: "",
      serialNumber: "",
      purchaseDate: "",
      warrantyExpiry: "",
      status: "active",
      notes: null,
    },
  });

  const createPcMutation = useMutation({
    mutationFn: async (data: PcFormData) => {
      const response = await apiRequest("POST", "/api/pcs", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pcs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "PC aggiunto con successo",
        description: "Il nuovo PC è stato registrato nel sistema.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiungere il PC.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PcFormData) => {
    createPcMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl" style={{ zIndex: 9999 }}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Aggiungi Nuovo PC</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Inserisci i dettagli per registrare un nuovo computer nel sistema di inventario.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="pcId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID PC</FormLabel>
                    <FormControl>
                      <Input placeholder="PC-XXX" {...field} />
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
                    <FormLabel>Dipendente Assegnato</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "unassigned" ? null : value)} 
                      value={field.value || "unassigned"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona dipendente..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Nessuno</SelectItem>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input placeholder="Dell, HP, Lenovo..." {...field} />
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
                      <Input placeholder="OptiPlex 7090" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPU</FormLabel>
                    <FormControl>
                      <Input placeholder="Intel i7-11700" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RAM (GB)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="8">8 GB</SelectItem>
                        <SelectItem value="16">16 GB</SelectItem>
                        <SelectItem value="32">32 GB</SelectItem>
                        <SelectItem value="64">64 GB</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage</FormLabel>
                    <FormControl>
                      <Input placeholder="512GB SSD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operatingSystem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sistema Operativo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Windows 11 Pro">Windows 11 Pro</SelectItem>
                        <SelectItem value="Windows 10 Pro">Windows 10 Pro</SelectItem>
                        <SelectItem value="Ubuntu Linux">Ubuntu Linux</SelectItem>
                        <SelectItem value="macOS">macOS</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Acquisto</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Attivo</SelectItem>
                        <SelectItem value="maintenance">Manutenzione</SelectItem>
                        <SelectItem value="retired">Dismesso</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero Seriale</FormLabel>
                    <FormControl>
                      <Input placeholder="Serial number" {...field} />
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
                    <Textarea placeholder="Note aggiuntive..." {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={createPcMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {createPcMutation.isPending ? "Salvataggio..." : "Salva PC"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
