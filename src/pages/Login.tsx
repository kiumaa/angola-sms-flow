import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import OTPLoginModal from "@/components/auth/OTPLoginModal";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const navigate = useNavigate();
  const { signIn, user, isAdmin, loading } = useAuth();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate(isAdmin ? "/admin" : "/dashboard");
    }
  }, [user, isAdmin, loading, navigate]);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        let errorMessage = "Credenciais inválidas";
        
        if (error.message?.includes("Invalid login credentials")) {
          errorMessage = "Email ou senha incorretos";
        } else if (error.message?.includes("Email not confirmed")) {
          errorMessage = "Por favor, confirme seu email antes de fazer login";
        } else if (error.message?.includes("Too many requests")) {
          errorMessage = "Muitas tentativas. Tente novamente em alguns minutos";
        }
        
        toast({
          title: "Erro no login",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Erro no login",
        description: "Erro de conexão. Verifique sua internet e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = () => {
    navigate("/forgot-password");
  };

  const handleCreateAccount = () => {
    navigate("/register");
  };

  const testimonials: Testimonial[] = [
    {
      avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      name: "Carlos Silva",
      handle: "@carlostech",
      text: "Plataforma incrível! A experiência do usuário é perfeita e as funcionalidades são exatamente o que precisava."
    },
    {
      avatarSrc: "https://images.unsplash.com/photo-1494790108755-2616b612b882?w=100&h=100&fit=crop&crop=face",
      name: "Ana Costa",
      handle: "@anamarketing",
      text: "Este serviço transformou como trabalho. Design limpo, recursos poderosos e excelente suporte."
    },
    {
      avatarSrc: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      name: "Miguel Santos",
      handle: "@miguelsms",
      text: "Já experimentei muitas plataformas, mas esta se destaca. Intuitiva, confiável e genuinamente útil."
    }
  ];

  return (
    <div className="relative">
      <SignInPage
        title={
          <span className="font-light text-foreground tracking-tighter">
            Bem-vindo ao<br />
            <span className="font-semibold gradient-text">SMS Marketing Angola</span>
          </span>
        }
        description="Acesse sua conta e continue sua jornada conosco"
        heroImageSrc="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=2160&q=80"
        testimonials={testimonials}
        onSignIn={handleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
      />
      
      {/* OTP Login Modal */}
      <OTPLoginModal 
        open={showOTPModal} 
        onOpenChange={setShowOTPModal} 
      />
      
      {/* Floating OTP Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => setShowOTPModal(true)}
          className="p-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          title="Entrar com Telefone"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};


export default Login;