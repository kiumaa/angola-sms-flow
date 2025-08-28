import { Zap, Gift, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useRegistrationSettings } from "@/hooks/useRegistrationSettings";
import { ModernSignupForm } from "@/components/auth/ModernSignupForm";

const Register = () => {
  const { settings } = useRegistrationSettings();

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
          {/* Modern Signup Form */}
          <ModernSignupForm />

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
                  <div className="p-3 rounded-2xl bg-gradient-primary shadow-glow w-fit mx-auto mb-4 group-hover:animate-glow">
                    <benefit.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-medium mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
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
    icon: Gift,
    title: "10 SMS Grátis",
    description: "Comece testando nossa plataforma sem custos e veja a qualidade do nosso serviço"
  },
  {
    icon: Zap,
    title: "Setup em 5 Minutos",
    description: "Interface intuitiva que permite começar a enviar campanhas imediatamente"
  },
  {
    icon: Check,
    title: "Suporte Especializado",
    description: "Equipe técnica em português para ajudá-lo em todas as etapas do processo"
  }
];

export default Register;