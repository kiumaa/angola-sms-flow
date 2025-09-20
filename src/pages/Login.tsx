import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import OTPLoginModal from "@/components/auth/OTPLoginModal";
import loginHeroImage from "@/assets/login-hero.jpg";

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

  return (
    <div className="relative">
      <SignInPage
        title="Seja Bem-vindo(a) ao SMS AO"
        description="Acesse sua conta e continue sua jornada conosco"
        heroImageSrc={loginHeroImage}
        onSignIn={handleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
        onPhoneLogin={() => setShowOTPModal(true)}
      />
      
      {/* OTP Login Modal */}
      <OTPLoginModal 
        open={showOTPModal} 
        onOpenChange={setShowOTPModal} 
      />
    </div>
  );
};


export default Login;