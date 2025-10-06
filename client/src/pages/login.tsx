import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, User, Lock, Shield, KeyRound } from "lucide-react";
import logoUrl from "@/assets/IMG_4622_1755594689547.jpeg";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Schema di validazione per il login
const loginSchema = z.object({
  username: z.string().min(1, "Username richiesto"),
  password: z.string().min(1, "Password richiesta"),
  twoFactorCode: z.string().optional(),
});

type LoginData = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [usingBackupCode, setUsingBackupCode] = useState(false);
  const { toast } = useToast();

  // Setup del form con validazione condizionale
  const form = useForm<LoginData>({
    resolver: zodResolver(
      requires2FA 
        ? loginSchema.extend({
            twoFactorCode: z.string().min(1, "Codice richiesto")
          })
        : loginSchema
    ),
    defaultValues: {
      username: "",
      password: "",
      twoFactorCode: "",
    },
  });

  // Mutation per il login
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      try {
        const response = await apiRequest("POST", "/api/auth/login", data);
        return response.json();
      } catch (error: any) {
        // apiRequest lancia errore se non 200 - parsarlo dal messaggio
        if (error.message?.includes("200:") && error.message?.includes("requires2FA")) {
          throw new Error("2FA_REQUIRED");
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      // Salva il sessionId per l'autenticazione
      if (data.sessionId) {
        localStorage.setItem('sessionId', data.sessionId);
      }
      
      toast({
        title: "Accesso completato",
        description: "Benvenuto nel sistema PC Manager",
        variant: "default",
      });
      
      // Redirect to dashboard
      window.location.href = "/";
    },
    onError: (error: Error) => {
      if (error.message === "2FA_REQUIRED") {
        setRequires2FA(true);
        setCredentials({
          username: form.getValues("username"),
          password: form.getValues("password"),
        });
        
        // Reset del form per il codice 2FA
        form.reset({
          username: form.getValues("username"),
          password: form.getValues("password"),
          twoFactorCode: "",
        });
        
        toast({
          title: "Autenticazione a due fattori richiesta",
          description: "Inserisci il codice dal tuo Google Authenticator",
          variant: "default",
        });
        return;
      }

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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo sempre visibile in alto */}
        <div className="text-center mb-12">
          <img 
            src={logoUrl} 
            alt="Maori Group Logo" 
            className="h-32 w-auto object-contain mx-auto"
            style={{
              mixBlendMode: 'multiply',
              filter: 'contrast(1.1)',
              backgroundColor: 'transparent'
            }}
          />
        </div>

        {/* Form Header - solo per 2FA */}
        {requires2FA && (
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Autenticazione 2FA</h2>
            <p className="text-slate-600">Inserisci il codice di autenticazione</p>
          </div>
        )}

        {/* Form di Login */}
        <div className="space-y-6">
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
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
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
                              autoComplete="one-time-code"
                              autoFocus
                              maxLength={usingBackupCode ? 10 : 6}
                              className="pl-10 h-12 text-center font-mono text-lg tracking-widest border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                              placeholder={usingBackupCode ? "10 cifre" : "6 cifre"}
                              data-testid="input-2fa-code"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Toggle per codici di backup */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setUsingBackupCode(!usingBackupCode);
                        form.setValue("twoFactorCode", "");
                      }}
                      className="text-sm text-blue-600 underline"
                      data-testid="button-toggle-backup-code"
                    >
                      {usingBackupCode 
                        ? "Usa codice Google Authenticator" 
                        : "Non hai accesso all'app? Usa codice di backup"
                      }
                    </button>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-12 bg-blue-600 text-white text-lg font-medium rounded-lg shadow-md transition-all"
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Accesso...
                  </div>
                ) : requires2FA ? (
                  "Verifica Codice"
                ) : (
                  "Accedi al Sistema"
                )}
              </Button>

              {/* Torna indietro per 2FA */}
              {requires2FA && (
                <button
                  type="button"
                  onClick={() => {
                    setRequires2FA(false);
                    setCredentials(null);
                    setUsingBackupCode(false);
                    form.reset({ username: "", password: "", twoFactorCode: "" });
                  }}
                  className="w-full text-center text-sm text-slate-600 underline"
                  data-testid="button-back-to-login"
                >
                  Torna al login
                </button>
              )}
            </form>
          </Form>

          {/* Footer Privacy Notice */}
          {!requires2FA && (
            <div className="text-center pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-400">Accesso riservato al personale autorizzato</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}