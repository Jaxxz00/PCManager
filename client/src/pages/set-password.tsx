import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import logoImg from "@assets/IMG_4622_1755594689547.jpeg";

// Schema per impostare la password
const setPasswordSchema = z.object({
  password: z.string().min(6, "La password deve essere di almeno 6 caratteri"),
  confirmPassword: z.string().min(6, "Conferma password richiesta"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

type SetPasswordData = z.infer<typeof setPasswordSchema>;

interface InviteInfo {
  valid: boolean;
  userInfo: {
    firstName: string;
    lastName: string;
    email: string;
    expiresAt: string;
  };
}

export default function SetPasswordPage() {
  const [, params] = useRoute("/invite/:token");
  const [, setLocation] = useLocation();
  const token = params?.token;
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form per impostare password
  const form = useForm<SetPasswordData>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Query per validare il token di invito
  const { data: inviteInfo, isLoading, error } = useQuery<InviteInfo>({
    queryKey: [`/api/invite/${token}`],
    enabled: !!token,
    retry: false,
  });

  // Mutation per impostare la password
  const setPasswordMutation = useMutation({
    mutationFn: async (data: SetPasswordData) => {
      const response = await fetch(`/api/invite/${token}/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: data.password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante l\'impostazione della password');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password impostata!",
        description: "La tua password è stata impostata con successo. Ora puoi accedere al sistema.",
      });
      // Redirect al login dopo 2 secondi
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile impostare la password",
        variant: "destructive",
      });
    },
  });

  // Se non c'è token, mostra errore
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Token non valido</h2>
            <p className="text-gray-600">Il link di invito non è valido o è malformato.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Validazione invito in corso...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error or invalid token
  if (error || !inviteInfo?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Invito non valido</h2>
            <p className="text-gray-600">
              Il link di invito non è valido, è scaduto o è già stato utilizzato.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setLocation("/login")}
            >
              Torna al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state dopo impostazione password
  if (setPasswordMutation.isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Password impostata!</h2>
            <p className="text-gray-600 mb-4">
              La tua password è stata impostata con successo. Verrai reindirizzato al login.
            </p>
            <Button onClick={() => setLocation("/login")}>
              Vai al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div 
            className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white shadow-lg flex items-center justify-center overflow-hidden"
            style={{ mixBlendMode: 'multiply' }}
          >
            <img 
              src={logoImg} 
              alt="Maori Group Logo" 
              className="w-20 h-20 object-contain"
              style={{ mixBlendMode: 'multiply' }}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Imposta Password
          </h1>
          <p className="text-gray-600">
            PC Manager - Maori Group
          </p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">
              Benvenuto, {inviteInfo.userInfo.firstName} {inviteInfo.userInfo.lastName}
            </CardTitle>
            <CardDescription className="space-y-1">
              <div>Email: {inviteInfo.userInfo.email}</div>
              <div className="text-xs text-orange-600">
                Scade: {new Date(inviteInfo.userInfo.expiresAt).toLocaleDateString('it-IT', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => setPasswordMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nuova Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            type={showPassword ? "text" : "password"}
                            placeholder="Almeno 6 caratteri"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conferma Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Ripeti la password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600"
                    disabled={setPasswordMutation.isPending}
                  >
                    {setPasswordMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Impostazione...
                      </>
                    ) : (
                      "Imposta Password"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500">
          <p>© 2025 Maori Group - Sistema Gestionale PC</p>
        </div>
      </div>
    </div>
  );
}