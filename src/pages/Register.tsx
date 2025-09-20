import { Zap, Gift, Check, CheckCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useRegistrationSettings } from "@/hooks/useRegistrationSettings";
import { ModernSignupForm } from "@/components/auth/ModernSignupForm";
const Register = () => {
  const {
    settings
  } = useRegistrationSettings();
  return <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-radial from-primary/8 via-primary/4 to-transparent animate-float" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-primary/10 to-transparent rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-radial from-secondary/8 to-transparent rounded-full blur-3xl animate-float" style={{
        animationDelay: '2s'
      }} />
      </div>
      
      {/* Premium Header */}
      <header className="absolute top-0 w-full bg-background/40 backdrop-blur-2xl border-b border-border/20 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-4 group">
              <BrandLogo size="md" />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-screen pt-24 pb-12 px-6">
        <div className="w-full max-w-4xl">
          {/* Modern Signup Form */}
          <ModernSignupForm />

          {/* Premium Benefits Section */}
          <div className="mt-20 text-center">
            <div className="mb-12">
              
              
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {registrationBenefits.map((benefit, index) => <div key={index} style={{
              animationDelay: `${index * 0.2}s`
            }} className="group relative overflow-hidden my-0">
                  
                </div>)}
            </div>

            {/* Premium Trust Indicators */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-60 py-0 my-[34px]">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">SSL Certificado</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">Conformidade GDPR</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">99,9% Disponibilidade</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
const registrationBenefits = [{
  icon: Gift,
  title: "5 SMS Grátis",
  description: "Comece testando nossa plataforma sem custos e comprove a qualidade excepcional e velocidade de entrega dos seus SMS em Angola"
}, {
  icon: Zap,
  title: "Setup Instantâneo",
  description: "Interface moderna e intuitiva projetada para você começar a enviar campanhas profissionais em menos de 5 minutos, sem complicações"
}, {
  icon: Check,
  title: "Suporte Premium 24/7",
  description: "Equipe técnica especializada em português disponível 24 horas para ajudá-lo desde a configuração até a otimização de campanhas"
}];
export default Register;