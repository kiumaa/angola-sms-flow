import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Erro ao enviar email",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setEmailSent(true);
        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada para redefinir sua senha.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent animate-float"></div>
      
      {/* Header with Theme Toggle */}
      <header className="absolute top-0 w-full glass backdrop-blur-glass border-b border-glass-border z-50">
        <div className="container-futuristic py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="p-2 rounded-2xl bg-gradient-primary shadow-glow">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold gradient-text">SMS Marketing Angola</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-screen pt-20 px-6">
        <div className="w-full max-w-md">
          <Card className="card-futuristic relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
            
            {!emailSent ? (
              <>
                <CardHeader className="text-center relative">
                  <div className="p-4 rounded-3xl bg-gradient-primary shadow-glow w-fit mx-auto mb-6">
                    <Mail className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-light gradient-text">Esqueceu sua senha?</CardTitle>
                  <CardDescription className="text-base">
                    Digite seu email para receber instruções de redefinição
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="relative">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-base">Email</Label>
                      <Input 
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="rounded-2xl h-14 text-base glass-card border-glass-border"
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full button-futuristic text-lg py-6" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Enviando..." : "Enviar Instruções"}
                    </Button>
                  </form>

                  <div className="mt-8 text-center">
                    <Link 
                      to="/login" 
                      className="inline-flex items-center text-primary hover:underline transition-all duration-300 hover:scale-105"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar ao login
                    </Link>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="relative text-center py-12">
                <div className="p-4 rounded-3xl bg-gradient-primary shadow-glow w-fit mx-auto mb-6">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-light gradient-text mb-4">Email Enviado!</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Enviamos as instruções para redefinir sua senha para <strong>{email}</strong>. 
                  Verifique sua caixa de entrada e spam.
                </p>
                <div className="space-y-4">
                  <Button 
                    onClick={() => setEmailSent(false)}
                    variant="outline"
                    className="w-full rounded-2xl h-12"
                  >
                    Enviar novamente
                  </Button>
                  <Link 
                    to="/login"
                    className="inline-flex items-center text-primary hover:underline transition-all duration-300"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar ao login
                  </Link>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;