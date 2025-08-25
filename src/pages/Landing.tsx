import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MessageSquare, Users, BarChart3, Shield, Clock, Zap, Star, CheckCircle } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Testimonials } from "@/components/ui/testimonials-columns-1";
import { Pricing } from "@/components/ui/pricing";
import { Link } from "react-router-dom";

const smsPlans = [
  {
    name: "BÁSICO",
    price: "10000",
    yearlyPrice: "8000",
    period: "por pacote",
    features: [
      "100 SMS incluídos",
      "Dashboard básico",
      "Suporte por email",
      "Validade: 90 dias",
      "Relatórios básicos",
    ],
    description: "Perfeito para pequenos negócios e testes",
    buttonText: "Começar Agora",
    href: "/register",
    isPopular: false,
  },
  {
    name: "INTERMEDIÁRIO",
    price: "38000",
    yearlyPrice: "30000",
    period: "por pacote",
    features: [
      "400 SMS incluídos",
      "Dashboard avançado",
      "Suporte prioritário",
      "Validade: 120 dias",
      "Relatórios detalhados",
      "API de integração",
      "Agenda de contatos",
    ],
    description: "Ideal para empresas em crescimento",
    buttonText: "Mais Popular",
    href: "/register",
    isPopular: true,
  },
  {
    name: "PROFISSIONAL",
    price: "80000",
    yearlyPrice: "64000",
    period: "por pacote",
    features: [
      "1000 SMS incluídos",
      "Dashboard completo",
      "Suporte dedicado",
      "Validade: 180 dias",
      "Relatórios avançados",
      "API completa",
      "Campanhas programadas",
      "Múltiplos usuários",
    ],
    description: "Para grandes empresas e alta demanda",
    buttonText: "Contactar Vendas",
    href: "/register",
    isPopular: false,
  },
];
const Landing = () => {
  return <div className="min-h-screen bg-gradient-hero">
      {/* Advanced Header with Glassmorphism */}
      <header className="fixed top-0 w-full glass backdrop-blur-glass border-b border-glass-border z-50 transition-all duration-300">
        <div className="container-futuristic">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3 animate-slide-in">
              <div className="p-3 rounded-3xl bg-gradient-primary shadow-glow">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-semibold gradient-text">SMS.AO</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 hover:gradient-text">
                Funcionalidades
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 hover:gradient-text">
                Preços
              </a>
              <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 hover:gradient-text">
                Contato
              </a>
            </nav>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button asChild variant="outline" size="sm" className="rounded-3xl glass-card border-glass-border hover:scale-105 transition-all duration-300">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild size="sm" className="button-futuristic">
                <Link to="/register">Criar conta grátis</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Revolutionary Hero Section */}
      <section className="pt-40 pb-32 section-padding relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent animate-float"></div>
        <div className="container-futuristic relative">
          <div className="text-center max-w-6xl mx-auto py-[50px]">
            <h1 className="text-6xl md:text-8xl font-light mb-12 tracking-tighter animate-slide-up">
              <span className="gradient-text">SMS.AO</span>
            </h1>
            <p className="text-2xl md:text-3xl text-muted-foreground mb-16 max-w-4xl mx-auto font-light leading-relaxed animate-fade-in">
              Conectando empresas aos seus clientes através de SMS
              <br className="hidden md:block" />
              marketing eficiente e profissional.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up mb-12">
              <Button asChild size="lg" className="text-lg px-12 py-8 rounded-3xl button-futuristic hover:shadow-elevated w-48">
                <Link to="/register">
                  Começar Grátis
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-12 py-8 rounded-3xl border border-white/20 bg-transparent text-white hover:bg-white/5 hover:border-white/30 transition-all duration-300 w-48">
                <a href="#pricing" className="px-0">Ver Preços</a>
              </Button>
            </div>
            <p className="text-muted-foreground text-sm font-light">
              Comece com 50 SMS grátis • Sem mensalidade • Preços em Kwanzas
            </p>
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section id="features" className="section-padding bg-muted/10 relative">
        <div className="absolute inset-0 bg-gradient-subtle opacity-50"></div>
        <div className="container-futuristic relative">
          <div className="text-center mb-24">
            <h2 className="text-5xl mb-8 tracking-tight md:text-4xl font-normal">
              🚀 <span className="gradient-text">Funcionalidades</span> Poderosas
            </h2>
            <p className="text-muted-foreground max-w-4xl mx-auto leading-relaxed font-light text-xl">
              Tudo que você precisa para suas campanhas de SMS marketing
              <br />em uma plataforma completa e fácil de usar
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[{
            icon: <Zap className="h-10 w-10" />,
            title: "Envio em Massa",
            description: "Envie para milhares de contatos simultaneamente com alta taxa de entrega garantida e velocidade impressionante.",
            gradient: "from-blue-500 to-purple-600"
          }, {
            icon: <MessageSquare className="h-10 w-10" />,
            title: "Personalização Avançada",
            description: "Mensagens personalizadas com nome e dados do cliente para maior engajamento e conversão.",
            gradient: "from-green-500 to-emerald-600"
          }, {
            icon: <Clock className="h-10 w-10" />,
            title: "Agendamento Inteligente",
            description: "Programe campanhas para o melhor momento e configure envios recorrentes automatizados.",
            gradient: "from-orange-500 to-red-600"
          }, {
            icon: <BarChart3 className="h-10 w-10" />,
            title: "Relatórios em Tempo Real",
            description: "Acompanhe entregas, taxa de sucesso e engajamento com dashboards interativos e insights poderosos.",
            gradient: "from-purple-500 to-indigo-600"
          }, {
            icon: <Shield className="h-10 w-10" />,
            title: "API Completa",
            description: "Integre facilmente com seus sistemas existentes usando nossa API REST robusta e bem documentada.",
            gradient: "from-indigo-500 to-blue-600"
          }, {
            icon: <Users className="h-10 w-10" />,
            title: "Suporte Premium",
            description: "Atendimento especializado em português com conhecimento profundo do mercado angolano.",
            gradient: "from-pink-500 to-red-600"
          }].map((feature, index) => <Card key={index} className="card-futuristic group animate-slide-up-stagger cursor-default relative overflow-hidden" style={{
            animationDelay: `${index * 0.1}s`
          }}>
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-all duration-300`}></div>
                <CardHeader className="text-center pb-6 relative">
                  <div className={`mx-auto mb-8 p-6 bg-gradient-to-br ${feature.gradient} rounded-3xl w-fit group-hover:shadow-glow transition-all duration-500 group-hover:scale-110`}>
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="gradient-text text-xl font-medium">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center relative">
                  <CardDescription className="leading-relaxed text-base font-light">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* Revolutionary Pricing Section */}
      <Pricing 
        plans={smsPlans}
        title="Preços Simples e Transparentes"
        description="Sem mensalidade. Pague apenas pelos SMS que usar. Preços em Kwanzas para sua conveniência."
      />

      {/* Stats Section */}
      <section className="section-padding relative">
        <div className="container-futuristic">
          <div className="grid md:grid-cols-4 gap-12 text-center">
            {[{
            number: "99.9%",
            label: "Uptime Garantido"
          }, {
            number: "95%+",
            label: "Taxa de Entrega"
          }, {
            number: "500+",
            label: "Empresas Confiam"
          }, {
            number: "24/7",
            label: "Monitoramento"
          }].map((stat, index) => <div key={index} className="group cursor-default">
                <div className="text-5xl md:text-6xl font-light text-primary mb-4 transition-all duration-300 group-hover:scale-110">
                  {stat.number}
                </div>
                <div className="text-muted-foreground text-lg">{stat.label}</div>
              </div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-white/10 to-transparent"></div>
        <div className="container-futuristic text-center text-white relative">
          <h2 className="text-5xl md:text-6xl font-light mb-8 tracking-tight">
            Pronto para Começar?
          </h2>
          <p className="text-2xl mb-12 text-white/90 max-w-4xl mx-auto leading-relaxed">
            Junte-se a centenas de empresas angolanas que já confiam na 
            nossa plataforma para suas campanhas de SMS.
          </p>
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 text-xl px-12 py-8 rounded-3xl hover:scale-105 transition-all duration-300 shadow-elevated">
            <Link to="/register">
              Começar Grátis
            </Link>
          </Button>
        </div>
      </section>

      {/* Futuristic Footer */}
      <footer className="py-20 px-6 border-t border-glass-border glass relative">
        <div className="container-futuristic">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-3 rounded-3xl bg-gradient-primary shadow-glow">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <span className="font-bold text-2xl gradient-text">SMS.AO</span>
              </div>
              <p className="text-muted-foreground mb-6 max-w-md text-lg leading-relaxed">
                Conectando empresas aos seus clientes através de SMS marketing eficiente e profissional.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-lg gradient-text">Suporte</h4>
              <div className="space-y-4">
                <a href="https://wa.me/244933493788" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105">
                  Contato WhatsApp
                </a>
                <a href="mailto:suporte@sms.ao" className="block text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105">
                  Email Suporte
                </a>
                <a href="https://wa.me/244933493788?text=Olá! Preciso de ajuda com a plataforma SMS.AO." target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105">
                  Central de Ajuda
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-lg gradient-text">Links Rápidos</h4>
              <div className="space-y-4">
                <Link to="/register" className="block text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105">
                  Criar Conta
                </Link>
                <Link to="/login" className="block text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105">
                  Fazer Login
                </Link>
                <a href="#pricing" className="block text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105">
                  Ver Preços
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-glass-border pt-8 text-center">
            <p className="text-muted-foreground text-base font-normal"> KB Agency © 2025 Todos os direitos reservados</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;