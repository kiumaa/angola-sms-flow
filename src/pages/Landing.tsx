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

  return <div className="min-h-screen bg-background">
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

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground relative">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Comece a Enviar SMS Hoje
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Junte-se às empresas angolanas que confiam na nossa plataforma 
            para comunicação via SMS.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg px-8">
              <Link to="/register">
                Criar Conta Grátis
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link to="/quick-send">
                Testar Envio
              </Link>
            </Button>
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
    </div>;
};

export default Landing;