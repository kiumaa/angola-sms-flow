import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Check, Eye, EyeOff, Zap, Gift } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    company: "",
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp, user, loading } = useAuth();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (!formData.acceptTerms) {
      toast({
        title: "Erro",
        description: "Você deve aceitar os termos de uso",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        company_name: formData.company
      });
      
      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Conta criada com sucesso! 🎉",
          description: "Bem-vindo à plataforma SMS.AO. Você ganhou 50 SMS grátis!",
        });
      }
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
        <div className="w-full max-w-2xl">
          {/* Revolutionary Register Card */}
          <Card className="card-futuristic relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
            <CardHeader className="text-center relative">
              <div className="p-4 rounded-3xl bg-gradient-primary shadow-glow w-fit mx-auto mb-6 animate-glow">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-4xl font-light gradient-text">Criar Conta Grátis</CardTitle>
              <CardDescription className="text-lg">
                Junte-se a centenas de empresas angolanas que confiam na nossa plataforma
              </CardDescription>
              
              {/* Offer Banner */}
              <div className="glass-card p-4 rounded-2xl bg-gradient-primary/10 border border-primary/20 mt-6">
                <div className="flex items-center justify-center space-x-3">
                  <div className="p-2 rounded-xl bg-gradient-primary shadow-glow">
                    <Gift className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-semibold gradient-text">🎉 50 SMS Grátis + Dashboard Premium</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="relative">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-base">Nome Completo</Label>
                    <Input
                      id="fullName"
                      placeholder="Seu nome completo"
                      value={formData.fullName}
                      onChange={(e) => updateFormData('fullName', e.target.value)}
                      className="rounded-2xl h-14 text-base glass-card border-glass-border"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-base">Empresa (Opcional)</Label>
                    <Input
                      id="company"
                      placeholder="Nome da sua empresa"
                      value={formData.company}
                      onChange={(e) => updateFormData('company', e.target.value)}
                      className="rounded-2xl h-14 text-base glass-card border-glass-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className="rounded-2xl h-14 text-base glass-card border-glass-border"
                    required
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-base">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword.password ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={formData.password}
                        onChange={(e) => updateFormData('password', e.target.value)}
                        className="rounded-2xl h-14 text-base glass-card border-glass-border pr-12"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({...showPassword, password: !showPassword.password})}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword.password ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-base">Confirmar Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPassword.confirm ? "text" : "password"}
                        placeholder="Repita sua senha"
                        value={formData.confirmPassword}
                        onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                        className="rounded-2xl h-14 text-base glass-card border-glass-border pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 glass-card p-4 rounded-2xl">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => updateFormData('acceptTerms', checked)}
                    className="rounded-lg"
                  />
                  <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    Aceito os{" "}
                    <Link to="/terms" className="text-primary hover:underline gradient-text">
                      termos de uso
                    </Link>{" "}
                    e{" "}
                    <Link to="/privacy" className="text-primary hover:underline gradient-text">
                      política de privacidade
                    </Link>
                  </label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full button-futuristic text-lg py-6" 
                  disabled={isLoading}
                >
                  {isLoading ? "Criando conta..." : "Criar Conta Grátis"}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <span className="text-muted-foreground">Já tem uma conta? </span>
                <Link 
                  to="/login" 
                  className="text-primary hover:underline font-medium gradient-text transition-all duration-300 hover:scale-105"
                >
                  Fazer login
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Benefits */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-8 text-lg">🎯 Por que escolher SMS.AO?</p>
            <div className="grid md:grid-cols-3 gap-6">
              {registrationBenefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="glass-card p-6 rounded-3xl hover-lift animate-slide-up-stagger group cursor-default"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="p-3 rounded-2xl bg-gradient-primary shadow-glow mx-auto w-fit mb-4 group-hover:scale-110 transition-all duration-300">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-lg gradient-text mb-2">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const registrationBenefits = [
  {
    title: "50 SMS Grátis",
    description: "Comece testando nossa plataforma sem custos e veja a qualidade do nosso serviço"
  },
  {
    title: "Setup em 5 Minutos",
    description: "Interface intuitiva que permite começar a enviar campanhas imediatamente"
  },
  {
    title: "Suporte Especializado",
    description: "Equipe técnica em português para ajudá-lo em todas as etapas do processo"
  }
];

export default Register;