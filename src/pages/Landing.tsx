import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, MessageCircle, Shield, Zap, TrendingUp, Calendar, Settings, ChevronRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { BrandAwareLogo } from "@/components/shared/BrandAwareLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { usePerformanceMonitor } from "@/hooks/usePerformance";

const Landing = () => {
  const { settings, loading } = useSiteSettings();
  
  // Monitor performance for optimization
  usePerformanceMonitor();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-2 h-2 bg-foreground rounded-full animate-pulse-soft"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Futuristic Header */}
      <header className="fixed top-0 w-full bg-background/95 backdrop-blur-xl border-b border-border z-50">
        <div className="container-futuristic">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <BrandAwareLogo className="h-6 w-auto" />
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button variant="ghost" size="sm" className="btn-ghost font-light" asChild>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button size="sm" className="btn-minimal" asChild>
                <Link to="/register">Começar</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Futuristic Hero Section */}
      <section className="hero-futuristic section-modern pt-32">
        <div className="container-futuristic">
          <div className="text-center">
            <h1 className="text-h1 md:text-6xl mb-8 animate-slide-up">
              {settings.site_title || "SMS Marketing Angola"}
            </h1>
            <p className="text-body md:text-lg mb-12 text-muted-foreground max-w-2xl mx-auto animate-slide-up text-balance">
              {settings.site_subtitle || "Conecte-se aos seus clientes através de SMS marketing eficiente e profissional."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up">
              <Link to="/register">
                <Button size="lg" className="btn-minimal px-8 py-3 hover-scale">
                  Começar Agora
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="ghost" className="btn-ghost px-8 py-3">
                  Explorar Funcionalidades
                </Button>
              </a>
            </div>
            <div className="text-xs text-muted-foreground">
              Sem mensalidade • Pague apenas pelo que usar
            </div>
          </div>
        </div>
      </section>

      {/* Modern Features Section */}
      <section id="features" className="section-modern">
        <div className="container-futuristic">
          <div className="text-center mb-20">
            <h2 className="text-h2 mb-6 animate-slide-up">
              Funcionalidades Avançadas
            </h2>
            <p className="text-body text-muted-foreground max-w-xl mx-auto animate-slide-up">
              Tudo que você precisa para campanhas de SMS marketing eficientes.
            </p>
          </div>

          <div className="grid-responsive">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="card-modern p-8 hover-lift group animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-h3 mb-4">{feature.title}</h3>
                <p className="text-body text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ⭐ O que nossos <span className="text-gradient">clientes dizem</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Empresas angolanas que confiam na nossa plataforma para crescer seus negócios
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="card-elegant bg-gradient-to-br from-card to-primary/5 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-base italic leading-relaxed">
                    "{testimonial.text}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{testimonial.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Pricing Section */}
      <section id="pricing" className="section-modern bg-muted/20">
        <div className="container-futuristic">
          <div className="text-center mb-20">
            <h2 className="text-h2 mb-6 animate-slide-up">
              Preços Simples e Transparentes
            </h2>
            <p className="text-body text-muted-foreground max-w-xl mx-auto animate-slide-up">
              Sem mensalidade. Pague apenas pelos SMS que usar.
            </p>
          </div>

          <div className="grid-responsive max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`card-modern p-8 text-center hover-lift relative ${plan.popular ? 'border-primary' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                      Mais Popular
                    </span>
                  </div>
                )}
                <h3 className="text-h3 mb-4">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-light">{plan.price}</span>
                  <span className="text-body text-muted-foreground ml-1">Kz</span>
                </div>
                <p className="text-body text-muted-foreground mb-8">
                  {plan.sms} SMS incluídos
                </p>
                <ul className="space-y-3 mb-8 text-left">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="w-full block">
                  <Button 
                    className={`w-full ${plan.popular ? 'btn-minimal' : 'btn-ghost'} hover-scale`}
                  >
                    Escolher Plano
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Stats Section */}
      <section className="section-modern">
        <div className="container-futuristic">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-light mb-2">{stat.value}</div>
                <div className="text-body text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="hero-gradient section-padding">
        <div className="container-custom text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para Começar?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Junte-se a centenas de empresas angolanas que já confiam na nossa plataforma para suas campanhas de SMS.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6">
              Criar Conta Grátis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center mb-4">
                <BrandAwareLogo textClassName="font-bold text-lg" />
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                Conectando empresas aos seus clientes através de SMS marketing eficiente e profissional.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <div className="space-y-2">
                <a 
                  href="https://wa.me/244933493788" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  📞 Contato WhatsApp
                </a>
                <a 
                  href="https://wa.me/244933493788?text=Olá! Preciso de ajuda com a plataforma SMS Marketing Angola." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  🎯 Central de Ajuda
                </a>
                <a 
                  href="mailto:suporte@smsmarketing.ao" 
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  ✉️ Email Suporte
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Links Rápidos</h4>
              <div className="space-y-2">
                <Link to="/register" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  🚀 Criar Conta
                </Link>
                <Link to="/login" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  🔐 Fazer Login
                </Link>
                <a href="#pricing" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  💰 Ver Preços
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 text-center">
            <div className="text-sm text-muted-foreground">
              © 2024 SMS Marketing Angola. Todos os direitos reservados. | 
              <a href="mailto:legal@smsmarketing.ao" className="hover:text-primary ml-1">Termos de Uso</a> | 
              <a href="mailto:legal@smsmarketing.ao" className="hover:text-primary ml-1">Política de Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const features = [
  {
    icon: Zap,
    title: "Envio em Massa",
    description: "Envie para milhares de contatos simultaneamente com alta taxa de entrega garantida e velocidade impressionante."
  },
  {
    icon: MessageCircle,
    title: "Personalização Avançada",
    description: "Mensagens personalizadas com nome e dados do cliente para maior engajamento e conversão."
  },
  {
    icon: Calendar,
    title: "Agendamento Inteligente",
    description: "Programe campanhas para o melhor momento e configure envios recorrentes automatizados."
  },
  {
    icon: TrendingUp,
    title: "Relatórios em Tempo Real",
    description: "Acompanhe entregas, taxa de sucesso e engajamento com dashboards interativos e insights poderosos."
  },
  {
    icon: Settings,
    title: "API Completa",
    description: "Integre facilmente com seus sistemas existentes usando nossa API REST robusta e bem documentada."
  },
  {
    icon: Shield,
    title: "Suporte Premium",
    description: "Atendimento especializado em português com conhecimento profundo do mercado angolano."
  }
];

const testimonials = [
  {
    name: "Carlos Mendes",
    company: "Tech Solutions Luanda",
    text: "Aumentamos nossa taxa de conversão em 300% após começar a usar a plataforma. O suporte é excepcional!"
  },
  {
    name: "Ana Silva",
    company: "Comercial Benguela",
    text: "Interface muito intuitiva e preços justos. Conseguimos alcançar mais clientes com o mesmo orçamento."
  },
  {
    name: "João Santos",
    company: "Startup Huambo",
    text: "A API é fantástica! Integramos em 2 dias e já estamos vendo resultados incríveis nas nossas campanhas."
  }
];

const pricingPlans = [
  {
    name: "Básico",
    price: "10.000",
    sms: "100",
    popular: false,
    features: [
      "100 SMS incluídos",
      "Dashboard básico",
      "Suporte por email",
      "Validade: 90 dias",
      "Relatórios básicos"
    ]
  },
  {
    name: "Intermediário",
    price: "38.000",
    sms: "400",
    popular: true,
    features: [
      "400 SMS incluídos",
      "Suporte prioritário",
      "Relatórios avançados",
      "Agendamento de campanhas",
      "Validade: 120 dias",
      "API básica"
    ]
  },
  {
    name: "Avançado",
    price: "90.000",
    sms: "1.000",
    popular: false,
    features: [
      "1.000 SMS incluídos",
      "API completa",
      "Webhooks personalizados",
      "Suporte por telefone",
      "Validade: 180 dias",
      "Relatórios premium"
    ]
  }
];

const stats = [
  { value: "99.9%", label: "Uptime Garantido" },
  { value: "95%+", label: "Taxa de Entrega" },
  { value: "500+", label: "Empresas Confiam" },
  { value: "24/7", label: "Monitoramento" }
];

export default Landing;