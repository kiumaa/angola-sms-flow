import { Zap, Gift, Check, CheckCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useRegistrationSettings } from "@/hooks/useRegistrationSettings";
import { ModernSignupForm } from "@/components/auth/ModernSignupForm";

const Register = () => {
  const { settings } = useRegistrationSettings();

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-radial from-primary/8 via-primary/4 to-transparent animate-float" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-primary/10 to-transparent rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-radial from-secondary/8 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>
      
      {/* Premium Header */}
      <header className="absolute top-0 w-full bg-background/40 backdrop-blur-2xl border-b border-border/20 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-4 group">
              <div className="p-3 rounded-2xl bg-gradient-primary shadow-premium group-hover:shadow-glow transition-all duration-500 group-hover:scale-110">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl bg-gradient-primary bg-clip-text text-transparent">SMS.AO</span>
                <span className="text-xs text-muted-foreground font-medium tracking-wide">Marketing Premium</span>
              </div>
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
              <div className="inline-flex items-center space-x-2 bg-background/40 backdrop-blur-xl rounded-full px-6 py-3 border border-border/20 shadow-elegant mb-6">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Por que escolher SMS.AO?
                </h3>
              </div>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                Junte-se a <span className="font-semibold text-primary">centenas de empresas</span> que confiam na nossa plataforma para comunicação profissional em Angola
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {registrationBenefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="group relative overflow-hidden"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="bg-background/50 backdrop-blur-2xl p-8 rounded-3xl hover:shadow-premium 
                                transition-all duration-700 hover:scale-105 hover:-translate-y-3 cursor-default 
                                border border-border/20 animate-slide-up-stagger relative overflow-hidden">
                    {/* Premium Icon Container */}
                    <div className="relative mb-6">
                      <div className="p-5 rounded-3xl bg-gradient-primary shadow-premium w-fit mx-auto 
                                    group-hover:shadow-glow transition-all duration-700
                                    group-hover:scale-125 group-hover:rotate-6">
                        <benefit.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-radial from-primary/20 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    </div>
                    
                    <h4 className="font-bold text-xl mb-4 text-foreground group-hover:text-primary transition-colors duration-500">
                      {benefit.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                    
                    {/* Premium Hover Effects */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl" />
                    <div className="absolute -inset-0.5 bg-gradient-border rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
                  </div>
                </div>
              ))}
            </div>

            {/* Premium Trust Indicators */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">SSL Certificado</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">GDPR Compliant</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">99.9% Uptime</span>
              </div>
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
    description: "Comece testando nossa plataforma sem custos e comprove a qualidade excepcional e velocidade de entrega dos seus SMS em Angola"
  },
  {
    icon: Zap,
    title: "Setup Instantâneo",
    description: "Interface moderna e intuitiva projetada para você começar a enviar campanhas profissionais em menos de 5 minutos, sem complicações"
  },
  {
    icon: Check,
    title: "Suporte Premium 24/7",
    description: "Equipe técnica especializada em português disponível 24 horas para ajudá-lo desde a configuração até a otimização de campanhas"
  }
];

export default Register;