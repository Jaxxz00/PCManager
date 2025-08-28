import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff, User, Lock, KeyRound, HelpCircle } from "lucide-react";
import { loginSchema, type LoginData } from "@shared/schema";
import logoUrl from "@assets/IMG_4622_1755594689547.jpeg";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showBackupCode, setShowBackupCode] = useState(false);
  const { toast } = useToast();

  const [requires2FA, setRequires2FA] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      twoFactorCode: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore durante l'accesso");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.requires2FA) {
        setRequires2FA(true);
        setCredentials({ username: form.getValues('username'), password: form.getValues('password') });
        toast({
          title: "Autenticazione 2FA richiesta",
          description: data.message,
        });
        return;
      }
      
      // Salvo il sessionId nel localStorage (con opzione remember me)
      if (rememberMe) {
        localStorage.setItem('sessionId', data.sessionId);
        localStorage.setItem('rememberLogin', 'true');
      } else {
        sessionStorage.setItem('sessionId', data.sessionId);
      }
      
      toast({
        title: "Accesso effettuato",
        description: "Benvenuto nel gestionale Maori Group",
      });
      
      // Redirect to dashboard
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Errore di accesso",
        description: error.message || "Credenziali non valide",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginData) => {
    // Se siamo nella fase 2FA, aggiungo le credenziali salvate
    if (requires2FA && credentials) {
      loginMutation.mutate({
        ...credentials,
        twoFactorCode: data.twoFactorCode,
      });
    } else {
      loginMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo e Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-2xl shadow-lg">
              <img 
                src={logoUrl} 
                alt="Maori Group Logo" 
                className="h-16 w-auto object-contain"
              />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Gestionale PC Maori Group</h1>
            <p className="text-gray-600">Accedi al sistema di gestione aziendale</p>
          </div>
        </div>

        {/* Form di Login */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-900 text-white rounded-t-lg">
            <div className="flex items-center justify-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Shield className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-bold">Accesso Sicuro</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {!requires2FA && (
                  <>
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                              <Input
                                placeholder="Inserisci username"
                                className="pl-10 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                data-testid="input-username"
                                autoComplete="username"
                                autoFocus
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Inserisci password"
                                className="pl-10 pr-10 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                data-testid="input-password"
                                autoComplete="current-password"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                data-testid="button-toggle-password"
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {requires2FA && (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-blue-900 mb-1">Autenticazione a Due Fattori</h3>
                      <p className="text-sm text-blue-700">Inserisci il codice di 6 cifre dalla tua app di autenticazione</p>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="twoFactorCode"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-gray-700 font-medium">
                              {showBackupCode ? "Codice di Backup" : "Codice 2FA"}
                            </FormLabel>
                            <button
                              type="button"
                              onClick={() => setShowBackupCode(!showBackupCode)}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <KeyRound className="h-3 w-3" />
                              {showBackupCode ? "Usa codice 2FA" : "Usa backup code"}
                            </button>
                          </div>
                          <FormControl>
                            <div className="relative">
                              {showBackupCode ? (
                                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                              ) : (
                                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                              )}
                              <Input
                                {...field}
                                type="text"
                                maxLength={showBackupCode ? 10 : 8}
                                className="pl-10 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-center tracking-widest font-mono"
                                placeholder={showBackupCode ? "0000000000" : "000000"}
                                data-testid={showBackupCode ? "input-backup-code" : "input-2fa-code"}
                                autoFocus
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setRequires2FA(false);
                          setCredentials(null);
                          form.reset();
                        }}
                        className="text-sm text-gray-600 hover:text-gray-800 underline"
                      >
                        Torna al login
                      </button>
                    </div>
                  </div>
                )}

                {!requires2FA && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                        data-testid="checkbox-remember-me"
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        Ricordami
                      </label>
                    </div>
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                      data-testid="button-forgot-password"
                    >
                      <HelpCircle className="h-4 w-4" />
                      Password dimenticata?
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      {requires2FA ? "Verifica in corso..." : "Accesso in corso..."}
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-5 w-5" />
                      {requires2FA ? "Verifica Codice 2FA" : "Accedi al Sistema"}
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Per richiedere un nuovo account contatta l'amministratore di sistema
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Accesso riservato al personale autorizzato</p>
        </div>
      </div>
    </div>
  );
}