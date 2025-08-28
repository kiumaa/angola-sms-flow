import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, MessageSquare, Users, BarChart3, Shield, Clock, Zap } from "lucide-react";
import { Testimonials } from "@/components/ui/testimonials-columns-1";
import { Pricing1 } from "@/components/ui/pricing-1";
import { HeroSection } from "@/components/ui/hero-section-1";
import { Link } from "react-router-dom";
import { useDynamicBranding } from "@/hooks/useDynamicBranding";

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

      {/* Simple Footer */}
      <footer className="py-12 px-6 border-t border-border bg-muted/20">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl text-foreground">SMS.AO</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Plataforma profissional de SMS para Angola.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Suporte</h4>
              <div className="space-y-2 text-sm">
                <a href="https://wa.me/244933493788" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-primary transition-colors">
                  WhatsApp: +244 933 493 788
                </a>
                <a href="mailto:suporte@sms.ao" className="block text-muted-foreground hover:text-primary transition-colors">
                  suporte@sms.ao
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Acesso Rápido</h4>
              <div className="space-y-2 text-sm">
                <Link to="/register" className="block text-muted-foreground hover:text-primary transition-colors">
                  Criar Conta
                </Link>
                <Link to="/login" className="block text-muted-foreground hover:text-primary transition-colors">
                  Entrar
                </Link>
                <Link to="/quick-send" className="block text-muted-foreground hover:text-primary transition-colors">
                  Envio Rápido
                </Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-6 text-center">
            <p className="text-muted-foreground text-sm">© 2025 SMS.AO - Todos os direitos reservados</p>
          </div>
        </div>
      </footer>
    </div>;
};

export default Landing;