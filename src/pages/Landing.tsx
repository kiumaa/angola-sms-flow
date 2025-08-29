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

const Landing = () => {
  // Apply dynamic branding
  useDynamicBranding();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/5 relative">
        <div className="container mx-auto px-6 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Funcionalidades Essenciais
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Envio de SMS simples, rápido e profissional para Angola
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
          }].map((feature, index) => <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20">
                <div className="text-primary mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-semibold mb-3 text-foreground">{feature.title}</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
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
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[{
            number: "99.9%",
            label: "Disponibilidade"
          }, {
            number: "95%+",
            label: "Taxa de Entrega"
          }, {
            number: "Angola",
            label: "Cobertura Nacional"
          }, {
            number: "24/7",
            label: "Suporte Ativo"
          }].map((stat, index) => <div key={index} className="group">
                <div className="text-4xl font-bold text-primary mb-2 transition-all duration-300 group-hover:scale-105">
                  {stat.number}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              Transforme a Comunicação da Sua Empresa
            </h2>
            <p className="text-xl md:text-2xl mb-4 text-primary-foreground/90 max-w-3xl mx-auto leading-relaxed animate-fade-in">
              Junte-se a <span className="font-semibold text-primary-foreground">centenas de empresas angolanas</span> que já confiam na nossa plataforma para alcançar seus clientes de forma eficaz.
            </p>
            <p className="text-lg mb-12 text-primary-foreground/80 max-w-2xl mx-auto animate-fade-in">
              ✓ Entrega garantida em todo Angola &nbsp;&nbsp; ✓ Suporte especializado 24/7 &nbsp;&nbsp; ✓ Sem compromisso inicial
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-scale-in">
              <Button asChild size="lg" variant="secondary" className="text-lg px-10 py-4 font-semibold hover-scale shadow-lg hover:shadow-xl transition-all duration-300">
                <Link to="/register" className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Começar Agora - Grátis
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-10 py-4 font-semibold border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary hover-scale shadow-lg hover:shadow-xl transition-all duration-300">
                <Link to="/quick-send" className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Testar Envio Rápido
                </Link>
              </Button>
            </div>
            
            <div className="mt-8 text-sm text-primary-foreground/70 animate-fade-in">
              <p>🔒 Seus dados estão seguros conosco • 🚀 Configuração em menos de 2 minutos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <Footer7 
        logo={{
          url: "/",
          src: "", // BrandLogo will be used instead
          alt: "SMS.AO Logo",
          title: "SMS.AO"
        }}
        sections={[
          {
            title: "Produto",
            links: [
              { name: "Funcionalidades", href: "/#features" },
              { name: "Preços", href: "/#pricing" },
              { name: "Envio Rápido", href: "/quick-send" },
              { name: "Status do Sistema", href: "/system-status" }
            ]
          },
          {
            title: "Suporte",
            links: [
              { name: "WhatsApp: +244 933 493 788", href: "https://wa.me/244933493788" },
              { name: "Email: suporte@sms.ao", href: "mailto:suporte@sms.ao" },
              { name: "Central de Ajuda", href: "#" },
              { name: "Documentação", href: "#" }
            ]
          },
          {
            title: "Legal",
            links: [
              { name: "Termos de Uso", href: "/legal/terms" },
              { name: "Política de Privacidade", href: "/legal/privacy" },
              { name: "Política de Cookies", href: "#" },
              { name: "Conformidade", href: "#" }
            ]
          }
        ]}
        description="Plataforma profissional de SMS para Angola. Envie mensagens de forma rápida, segura e confiável para todo o território angolano."
        socialLinks={[
          { icon: <FaWhatsapp className="size-5" />, href: "https://wa.me/244933493788", label: "WhatsApp" },
          { icon: <FaEnvelope className="size-5" />, href: "mailto:suporte@sms.ao", label: "Email" }
        ]}
        copyright="© 2025 SMS.AO - Todos os direitos reservados."
        legalLinks={[
          { name: "Termos de Uso", href: "/legal/terms" },
          { name: "Política de Privacidade", href: "/legal/privacy" }
        ]}
      />
    </div>
  );
};

export default Landing;