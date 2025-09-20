import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, MessageSquare, Users, BarChart3, Shield, Clock, Zap } from "lucide-react";
import { Testimonials } from "@/components/ui/testimonials-columns-1";
import { Pricing1 } from "@/components/ui/pricing-1";
import { HeroSection } from "@/components/ui/hero-section-1";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { Link } from "react-router-dom";
import { useDynamicBranding } from "@/hooks/useDynamicBranding";
import { Footer7 } from "@/components/ui/footer-7";
import { FaWhatsapp, FaEnvelope } from "react-icons/fa";
import { AnimatedPalopText } from "@/components/ui/animated-palop-text";
const Landing = () => {
  // Apply dynamic branding
  useDynamicBranding();
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 lg:py-24 bg-muted/5 relative -mt-8 sm:-mt-12 pt-24 sm:pt-32 lg:pt-36">
        <div className="container mx-auto px-4 sm:px-6 relative">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-foreground">
              Funcionalidades Essenciais
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg lg:text-xl">Envio de SMS simples, rápido e profissional</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[{
            icon: <Zap className="h-8 w-8" />,
            title: "Envio Rápido",
            description: "Envie SMS para um ou múltiplos contactos de forma instantânea e confiável."
          }, {
            icon: <Users className="h-8 w-8" />,
            title: "Gestão de Contactos",
            description: "Importe contactos via CSV, organize por tags e mantenha sua base atualizada."
          }, {
            icon: <BarChart3 className="h-8 w-8" />,
            title: "Relatórios Detalhados",
            description: "Acompanhe status de entrega e histórico completo dos seus envios."
          }, {
            icon: <Shield className="h-8 w-8" />,
            title: "Sender ID Personalizado",
            description: "Use SMSAO como remetente padrão ou configure seu próprio Sender ID."
          }, {
            icon: <MessageSquare className="h-8 w-8" />,
            title: "Interface Simples",
            description: "Plataforma intuitiva e responsiva, otimizada para o mercado angolano."
          }, {
            icon: <Clock className="h-8 w-8" />,
              title: "Suporte 24/7",
              description: "Atendimento dedicado via WhatsApp e email para resolver suas dúvidas."
            }].map((feature, index) => <Card key={index} className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20">
                <div className="text-primary mb-3 sm:mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-foreground">{feature.title}</CardTitle>
                <CardDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* Simple Pricing Section */}
      <Pricing1 />

      {/* Stats Section */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            {[{
            number: "99.9%",
            label: "Disponibilidade"
          }, {
            number: "95%+",
            label: "Taxa de Entrega"
          }, {
            number: <AnimatedPalopText />,
            label: "Cobertura PALOP"
          }, {
            number: "24/7",
            label: "Suporte Ativo"
          }].map((stat, index) => <div key={index} className="group">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2 transition-all duration-300 group-hover:scale-105 h-[32px] sm:h-[40px] lg:h-[48px] flex items-center justify-center">
                  {stat.number}
                </div>
                <div className="text-sm sm:text-base text-muted-foreground text-center">{stat.label}</div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground relative overflow-hidden">
        {/* Background Pattern - Responsivo */}
        <div className="absolute inset-0 opacity-10 md:opacity-20">
          <div className="w-full h-full bg-repeat bg-[length:30px_30px] md:bg-[length:60px_60px]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 animate-fade-in">
              Transforme a Comunicação da Sua Empresa
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-primary-foreground/90 max-w-3xl mx-auto leading-relaxed animate-fade-in">
              Junte-se a <span className="font-semibold text-primary-foreground">centenas de empresas</span> que já confiam na nossa plataforma para alcançar seus clientes de forma eficaz.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center animate-scale-in">
              <Button asChild size="lg" className="w-full sm:w-auto text-base sm:text-lg lg:text-xl px-8 sm:px-12 py-4 sm:py-6 font-bold bg-white text-primary border-2 border-white hover:bg-white/90 hover:scale-105 shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-xl">
                <Link to="/register" className="flex items-center justify-center gap-3">
                  <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                  Começar Agora - Grátis
                </Link>
              </Button>
            </div>
            
            <div className="mt-6 sm:mt-8 text-xs sm:text-sm text-primary-foreground/70 animate-fade-in">
              <p>🔒 Seus dados estão seguros conosco • 🚀 Configuração em menos de 2 minutos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <Footer7 logo={{
      url: "/",
      src: "",
      // BrandLogo will be used instead
      alt: "SMS.AO Logo",
      title: "SMS.AO"
    }} sections={[{
      title: "Produto",
      links: [{
        name: "Funcionalidades",
        href: "/#features"
      }, {
        name: "Preços",
        href: "/#pricing"
      }, {
        name: "Envio Rápido",
        href: "/quick-send"
      }, {
        name: "Status do Sistema",
        href: "/system-status"
      }]
    }, {
      title: "Suporte",
      links: [{
        name: <span className="inline-flex items-center gap-2"><FaWhatsapp className="size-4" /> +244 933 493 788</span>,
        href: "https://wa.me/244933493788"
      }, {
        name: "Email: suporte@sms.ao",
        href: "mailto:suporte@sms.ao"
      }, {
        name: "Central de Ajuda",
        href: "#"
      }, {
        name: "Documentação",
        href: "#"
      }]
    }, {
      title: "Legal",
      links: [{
        name: "Termos de Uso",
        href: "/legal/terms"
      }, {
        name: "Política de Privacidade",
        href: "/legal/privacy"
      }, {
        name: "Política de Cookies",
        href: "#"
      }, {
        name: "Conformidade",
        href: "#"
      }]
    }]} description="Plataforma profissional de SMS para Angola. Envie mensagens de forma rápida, segura e confiável para todo o território angolano." socialLinks={[{
      icon: <FaWhatsapp className="size-5" />,
      href: "https://wa.me/244933493788",
      label: "WhatsApp"
    }, {
      icon: <FaEnvelope className="size-5" />,
      href: "mailto:suporte@sms.ao",
      label: "Email"
    }]} copyright="© 2025 SMS.AO - Todos os direitos reservados." legalLinks={[{
      name: "Termos de Uso",
      href: "/legal/terms"
    }, {
      name: "Política de Privacidade",
      href: "/legal/privacy"
    }]} />
    </div>;
};
export default Landing;