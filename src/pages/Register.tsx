import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Register = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: ""
  });
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center">
            <Mail className="h-8 w-8 text-primary mr-2" />
            <span className="text-2xl font-bold text-gradient">SMS Marketing Angola</span>
          </Link>
        </div>

        <Card className="card-elegant">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Criar sua conta</CardTitle>
            <CardDescription>
              Comece com 50 SMS grátis • Sem mensalidade • Cancele quando quiser
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Empresa</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  placeholder="Sua Empresa Lda"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+244 900 000 000"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full btn-gradient" disabled={isLoading}>
                {isLoading ? "Criando conta..." : "Criar Conta Grátis"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Fazer login
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">O que você ganha ao se registrar:</p>
          <div className="space-y-2">
            {registerBenefits.map((benefit, index) => (
              <div key={index} className="flex items-center justify-center text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-secondary mr-2" />
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const registerBenefits = [
  "50 SMS grátis para começar",
  "Dashboard completo incluído",
  "Suporte técnico gratuito",
  "Sem compromisso de permanência"
];

export default Register;