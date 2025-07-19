import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Check, Eye, EyeOff, User, Phone, Building, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const Register = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Basic validation
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Erro na validação",
          description: "As senhas não coincidem.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        toast({
          title: "Senha muito fraca",
          description: "A senha deve ter pelo menos 6 caracteres.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.companyName,
            phone: formData.phone,
            company_name: formData.companyName
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Send confirmation email
        const { error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
          body: {
            email: formData.email,
            userId: authData.user.id
          }
        });

        if (emailError) {
          console.error('Error sending confirmation email:', emailError);
        }

        // Give initial credits (50 SMS)
        await supabase.rpc('add_user_credits', {
          user_id: authData.user.id,
          credit_amount: 50
        });

        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email para confirmar a conta. Você ganhou 50 SMS grátis!",
        });
        
        navigate("/login");
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Tente novamente mais tarde.",
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
          {/* Advanced Register Card */}
          <Card className="card-futuristic relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
            <CardHeader className="text-center relative">
              <div className="p-4 rounded-3xl bg-gradient-primary shadow-glow w-fit mx-auto mb-6 animate-glow">
                <User className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-light gradient-text">Criar sua conta</CardTitle>
              <CardDescription className="text-lg">
                Comece com 50 SMS grátis • Sem mensalidade • Cancele quando quiser
              </CardDescription>
            </CardHeader>
            
            <CardContent className="relative">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-base flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Nome da Empresa
                  </Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    placeholder="Sua Empresa Lda"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="rounded-2xl h-14 text-base glass-card border-glass-border"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="rounded-2xl h-14 text-base glass-card border-glass-border"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+244 900 000 000"
                    value={formData.phone}
                    onChange={handleChange}
                    className="rounded-2xl h-14 text-base glass-card border-glass-border"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="rounded-2xl h-14 text-base glass-card border-glass-border pr-12"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-base">Confirmar Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="rounded-2xl h-14 text-base glass-card border-glass-border pr-12"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
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
            <p className="text-muted-foreground mb-6 text-lg">O que você ganha ao se registrar:</p>
            <div className="space-y-4">
              {registerBenefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-center text-base glass-card p-4 rounded-2xl hover-lift animate-slide-up-stagger"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="p-2 rounded-full bg-gradient-primary shadow-glow mr-4">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const registerBenefits = [
  "50 SMS grátis para começar",
  "Dashboard com IA integrada",
  "Suporte técnico especializado",
  "Sem compromisso de permanência"
];

export default Register;