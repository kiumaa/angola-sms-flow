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

          {/* Enhanced Benefits Section */}
          <div className="mt-16 text-center">
            <div className="mb-10">
              <h3 className="text-xl font-semibold mb-3 gradient-text">
                🎯 Por que escolher SMS.AO?
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Junte-se a centenas de empresas que confiam na nossa plataforma para comunicação profissional
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {registrationBenefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="group relative overflow-hidden"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className="glass-card p-8 rounded-3xl hover:shadow-elegant transition-all duration-500 
                                hover:scale-105 hover:-translate-y-2 cursor-default border border-white/5 
                                backdrop-blur-xl animate-slide-up-stagger">
                    <div className="relative">
                      <div className="p-4 rounded-2xl bg-gradient-primary shadow-glow w-fit mx-auto mb-6 
                                    group-hover:shadow-[0_0_40px_hsl(var(--primary)/0.6)] transition-all duration-500
                                    group-hover:scale-110">
                        <benefit.icon className="h-7 w-7 text-white" />
                      </div>
                      <h4 className="font-semibold text-lg mb-3 text-foreground group-hover:text-primary transition-colors">
                        {benefit.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                    
                    {/* Hover gradient effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
                  </div>
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
    description: "Comece testando nossa plataforma sem custos e comprove a qualidade e rapidez do nosso serviço de entrega"
  },
  {
    icon: Zap,
    title: "Setup Instantâneo",
    description: "Interface moderna e intuitiva que permite começar a enviar campanhas profissionais em poucos minutos"
  },
  {
    icon: Check,
    title: "Suporte Premium 24/7",
    description: "Equipe técnica especializada em português para ajudá-lo em todas as etapas, desde configuração até otimização"
  }
];

export default Register;