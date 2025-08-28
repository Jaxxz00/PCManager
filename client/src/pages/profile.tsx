import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { type User } from "@shared/schema";
import { 
  User as UserIcon, 
  Mail, 
  Shield,
  Calendar,
  Edit,
  Save,
  X
} from "lucide-react";

const profileUpdateSchema = z.object({
  firstName: z.string().min(1, "Nome richiesto"),
  lastName: z.string().min(1, "Cognome richiesto"),
  email: z.string().email("Email non valida"),
});

type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Query per i dati utente
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const form = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  // Reset form quando cambiano i dati utente
  React.useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      });
    }
  }, [user, form]);

  // Mutation per aggiornamento profilo
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateData) => {
      const response = await apiRequest("PUT", "/api/auth/profile", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profilo aggiornato",
        description: "Le modifiche sono state salvate con successo",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il profilo",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-600">Caricamento profilo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-900 rounded-xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
            <UserIcon className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Profilo Utente</h1>
            <p className="text-blue-100 text-lg">Gestione informazioni personali</p>
            <div className="flex items-center gap-6 mt-2 text-sm text-blue-200">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Account verificato</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Ultimo accesso: {new Date().toLocaleDateString('it-IT')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informazioni profilo */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <UserIcon className="mr-2 h-5 w-5" />
                  Informazioni Personali
                </CardTitle>
                {!isEditing ? (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifica
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        form.reset();
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Annulla
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Nome</Label>
                      <p className="text-lg">{user?.firstName || "Non specificato"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Cognome</Label>
                      <p className="text-lg">{user?.lastName || "Non specificato"}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="text-lg">{user?.email || "Non specificato"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Username</Label>
                    <p className="text-lg">{user?.username}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Ruolo</Label>
                    <Badge variant="outline" className="mt-1">
                      {user?.role || "User"}
                    </Badge>
                  </div>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Il tuo nome" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cognome</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Il tuo cognome" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="la-tua-email@esempio.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                        className="min-w-[120px]"
                      >
                        {updateProfileMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Salva
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar informazioni */}
        <div className="space-y-6">
          {/* Avatar e info rapide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Avatar</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <Avatar className="w-24 h-24 mx-auto">
                <AvatarFallback className="text-2xl font-bold bg-blue-100 text-blue-600">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-gray-600">@{user?.username}</p>
              </div>
            </CardContent>
          </Card>

          {/* Statistiche account */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Sicurezza Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">2FA Attivo</span>
                <Badge variant={user?.twoFactorEnabled ? "default" : "secondary"}>
                  {user?.twoFactorEnabled ? "Sì" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Account Attivo</span>
                <Badge variant={user?.isActive ? "default" : "destructive"}>
                  {user?.isActive ? "Attivo" : "Sospeso"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Ultimo Login</span>
                <span className="text-sm text-gray-600">Oggi</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}