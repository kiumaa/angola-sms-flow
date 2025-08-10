import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Check, Eye, EyeOff, Zap, Smartphone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { BrandAwareLogo } from "@/components/shared/BrandAwareLogo";
import { useFormValidation, loginSchema } from "@/hooks/useFormValidation";
import OTPLoginModal from "@/components/auth/OTPLoginModal";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const navigate = useNavigate();
  const { signIn, user, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const { errors, validateField } = useFormValidation(loginSchema, formData);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate(isAdmin ? "/admin" : "/dashboard");
    }
  }, [user, isAdmin, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        toast({
          title: "Erro no login",
          description: error.message || "Credenciais inválidas",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta à sua conta."
        });
      }
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          {/* Advanced Login Card */}
          <Card className="card-futuristic relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-5 my-0 py-0"></div>
            
            {/* Login Logo */}
            <div className="flex justify-center pt-8 pb-4">
              <BrandAwareLogo 
                className="h-16 w-auto" 
                showText={false}
              />
            </div>
            
            <CardContent className="relative">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={formData.email} 
                    onChange={(e) => {
                      updateFormData('email', e.target.value);
                      validateField('email', e.target.value);
                    }}
                    className="rounded-2xl h-14 text-base glass-card border-glass-border" 
                    required 
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base">Senha</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={formData.password} 
                      onChange={(e) => {
                        updateFormData('password', e.target.value);
                        validateField('password', e.target.value);
                      }}
                      className="rounded-2xl h-14 text-base glass-card border-glass-border pr-12" 
                      required 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full button-futuristic text-lg py-6" 
                  disabled={isLoading}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-card px-4 text-muted-foreground text-sm">ou</span>
                </div>
              </div>

              {/* OTP Login Option */}
              <Button
                variant="outline"
                onClick={() => setShowOTPModal(true)}
                className="w-full h-14 rounded-2xl glass-card border-glass-border"
              >
                <Smartphone className="h-5 w-5 mr-2" />
                Entrar com Telefone
              </Button>

              <div className="mt-8 text-center">
                <Link to="/forgot-password" className="text-primary hover:underline transition-all duration-300 hover:scale-105">
                  Esqueceu sua senha?
                </Link>
              </div>

              <div className="mt-8 text-center">
                <span className="text-muted-foreground">Não tem uma conta? </span>
                <Link to="/register" className="text-primary hover:underline font-medium gradient-text transition-all duration-300 hover:scale-105">
                  Criar conta grátis
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Features */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-6 text-lg">Por que escolher nossa plataforma?</p>
            <div className="space-y-4">
              {loginFeatures.map((feature, index) => (
                <div 
                  key={index} 
                  style={{ animationDelay: `${index * 0.1}s` }} 
                  className="flex items-center justify-center text-base glass-card p-4 rounded-2xl hover-lift animate-slide-up-stagger my-[5px] py-[10px]"
                >
                  <div className="p-2 rounded-full bg-gradient-primary shadow-glow mr-4">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-normal">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* OTP Login Modal */}
      <OTPLoginModal 
        open={showOTPModal} 
        onOpenChange={setShowOTPModal} 
      />
    </div>
  );
};

const loginFeatures = [
  "99,9% de uptime garantido", 
  "Suporte especializado em português", 
  "Preços transparentes em Kwanzas", 
  "API completa com documentação"
];

export default Login;