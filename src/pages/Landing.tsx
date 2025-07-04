import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Mail, Users, Calendar, Settings, Star, MessageCircle, Shield, Zap, TrendingUp, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { BrandAwareLogo } from "@/components/shared/BrandAwareLogo";

const Landing = () => {
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b border-border/40">
        <div className="container-custom">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <BrandAwareLogo />
            </div>
            <div className="flex items-center space-x-4">
              <a 
                href="https://wa.me/244933493788" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Contato
              </a>
              <a 
                href="https://wa.me/244933493788?text=Olá! Preciso de ajuda com a plataforma SMS Marketing Angola." 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Central de Ajuda
              </a>
              <Link to="/login">
                <Button variant="outline">Entrar</Button>
              </Link>
              <Link to="/register">
                <Button className="btn-gradient">Começar Grátis</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient section-padding">
        <div className="container-custom">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up">
              {settings.site_title}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto animate-fade-in-up">
              {settings.site_subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up">
              <Link to="/register">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6">
                  Começar Grátis - 50 SMS
                </Button>
              </Link>
              <a href="#pricing">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                  Ver Preços
                </Button>
              </a>
            </div>
            <p className="text-sm text-white/70 mt-4">Sem mensalidade • Pague apenas pelo que usar • Suporte em português</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up">
              🚀 Funcionalidades <span className="text-gradient">Poderosas</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up">
              Tudo que você precisa para suas campanhas de SMS marketing em uma plataforma completa e fácil de usar.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="feature-card card-elegant group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-card to-accent/10">
                <CardHeader>
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-8 w-8 text-primary group-hover:text-secondary transition-colors" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
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

      {/* Pricing Section */}
      <section id="pricing" className="section-padding bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up">
              💰 Preços <span className="text-gradient">Simples e Transparentes</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up">
              Sem mensalidade. Pague apenas pelos SMS que usar. Preços em Kwanzas para sua conveniência.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative transition-all duration-300 hover:scale-105 hover:shadow-xl card-elegant ${plan.popular ? 'ring-2 ring-primary scale-105 bg-gradient-to-br from-primary/5 to-secondary/5' : 'hover:shadow-lg'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary to-secondary text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg animate-pulse">
                      ⭐ Mais Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="text-5xl font-bold text-gradient mb-2">
                    {plan.price} <span className="text-lg font-normal text-muted-foreground">Kz</span>
                  </div>
                  <CardDescription className="text-lg">
                    <span className="font-semibold text-primary">{plan.sms} SMS</span> incluídos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-secondary mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="w-full block">
                    <Button className={`w-full text-lg py-6 transition-all duration-300 ${plan.popular ? 'btn-gradient shadow-lg hover:shadow-xl' : 'hover:scale-105'}`}>
                      🚀 Escolher Plano
                    </Button>
                  </Link>
                  <p className="text-center text-sm text-muted-foreground mt-3">
                    💳 Apenas {(parseInt(plan.price.replace('.', '')) / parseInt(plan.sms)).toFixed(0)} Kz por SMS
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding bg-primary/5">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
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