import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff, Lock, User, HelpCircle, KeyRound } from "lucide-react";
import logoUrl from "@assets/IMG_4622_1755594689547.jpeg";

const loginSchema = z.object({
  username: z.string().min(1, "Username obbligatorio"),
  password: z.string().min(1, "Password obbligatoria"),
  twoFactorCode: z.string().optional(),
});

type LoginData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [requires2FA, setRequires2FA] = useState(false);
  const [credentials, setCredentials] = useState<{username: string, password: string} | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [usingBackupCode, setUsingBackupCode] = useState(false);
  const { toast } = useToast();

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
      
      // Salvo il sessionId nel sessionStorage
      sessionStorage.setItem('sessionId', data.sessionId);
      
      toast({
        title: "Accesso effettuato",
        description: "Benvenuto nel sistema Maori Group",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-slate-900/40"></div>
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
          <div className="w-full h-full flex items-center justify-center">
            <img 
              src={logoUrl} 
              alt="Maori Group Logo" 
              className="max-w-[80%] max-h-[60%] w-auto h-auto object-contain opacity-90 filter drop-shadow-2xl"
            />
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-400/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-32 right-16 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl"></div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img 
              src={logoUrl} 
              alt="Maori Group Logo" 
              className="h-24 w-auto object-contain mx-auto filter drop-shadow-lg"
            />
          </div>

          {/* Form Header */}
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold text-slate-900">
              {requires2FA ? "Autenticazione 2FA" : ""}
            </h2>
            <p className="text-slate-600 text-lg">
              {requires2FA && "Inserisci il codice di autenticazione"}
            </p>
          </div>



          {/* Form di Login */}
          <Card className="border-0 shadow-xl bg-white">
            <CardHeader className="text-center pb-6">
            </CardHeader>

            <CardContent className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {!requires2FA ? (
                    <>
                      {/* Username */}
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-medium">Username</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                  {...field}
                                  type="text"
                                  autoComplete="username"
                                  autoFocus
                                  className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                  placeholder="Inserisci il tuo username"
                                  data-testid="input-username"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Password */}
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-medium">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  autoComplete="current-password"
                                  className="pl-10 pr-12 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                  placeholder="Inserisci la tua password"
                                  data-testid="input-password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                  ) : (
                    <>
                      {/* 2FA Code */}
                      <FormField
                        control={form.control}
                        name="twoFactorCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-medium flex items-center gap-2">
                              {usingBackupCode ? (
                                <>
                                  <KeyRound className="h-4 w-4" />
                                  Codice di Backup
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4" />
                                  Codice 2FA
                                </>
                              )}
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                {usingBackupCode ? (
                                  <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                ) : (
                                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                )}
                                <Input
                                  {...field}
                                  type="text"
                                  autoFocus
                                  className="pl-10 h-12 text-center text-xl tracking-widest border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                  placeholder={usingBackupCode ? "0000000000" : "000000"}
                                  maxLength={usingBackupCode ? 10 : 6}
                                  data-testid={usingBackupCode ? "input-backup-code" : "input-2fa-code"}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                            <div className="text-center mt-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setUsingBackupCode(!usingBackupCode);
                                  form.setValue('twoFactorCode', '');
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800 underline"
                              >
                                {usingBackupCode ? "Usa codice 2FA" : "Usa codice di backup"}
                              </button>
                            </div>
                          </FormItem>
                        )}
                      />
                    </>
                  )}



                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Accesso in corso...
                      </div>
                    ) : requires2FA ? (
                      "Verifica e Accedi"
                    ) : (
                      "Accedi al Sistema"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center">
            <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
              <Shield className="h-4 w-4 mx-auto mb-1 text-slate-400" />
              <p>Accesso riservato al personale autorizzato</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}