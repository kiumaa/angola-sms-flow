import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Mail, Users, Calendar, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Landing = () => {
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b border-border/40">
        <div className="container-custom">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-primary mr-2" />
              <span className="text-xl font-bold text-gradient">SMS Marketing Angola</span>
            </div>
            <div className="flex items-center space-x-4">
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
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                Ver Preços
              </Button>
            </div>
            <p className="text-sm text-white/70 mt-4">Sem mensalidade • Pague apenas pelo que usar • Suporte em português</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Funcionalidades Principais</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para suas campanhas de SMS marketing em uma plataforma completa e fácil de usar.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="feature-card">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Preços Simples e Transparentes</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Sem mensalidade. Pague apenas pelos SMS que usar. Preços em Kwanzas para sua conveniência.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-primary scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                      Mais Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-primary">
                    {plan.price} <span className="text-lg font-normal text-muted-foreground">Kz</span>
                  </div>
                  <CardDescription>{plan.sms} SMS incluídos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="h-4 w-4 text-secondary mr-2" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="w-full block mt-6">
                    <Button className={`w-full ${plan.popular ? 'btn-gradient' : ''}`}>
                      Escolher Plano
                    </Button>
                  </Link>
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
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-primary mr-2" />
              <span className="font-bold text-lg">SMS Marketing Angola</span>
            </div>
            <p className="text-muted-foreground mb-4">
              Conectando empresas aos seus clientes através de SMS marketing eficiente e profissional.
            </p>
            <div className="text-sm text-muted-foreground">
              © 2024 SMS Marketing Angola. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const features = [
  {
    icon: Users,
    title: "Envio em Massa",
    description: "Envie para milhares de contatos simultaneamente com alta taxa de entrega garantida."
  },
  {
    icon: Mail,
    title: "Personalização",
    description: "Mensagens personalizadas com nome e dados do cliente para maior engajamento."
  },
  {
    icon: Calendar,
    title: "Agendamento",
    description: "Programe campanhas para o melhor momento e configure envios recorrentes."
  },
  {
    icon: Settings,
    title: "Relatórios Detalhados",
    description: "Acompanhe entregas, taxa de sucesso e engajamento em tempo real."
  },
  {
    icon: Check,
    title: "API Integration",
    description: "Integre facilmente com seus sistemas existentes usando nossa API REST."
  },
  {
    icon: Users,
    title: "Suporte Local",
    description: "Atendimento em português com conhecimento profundo do mercado angolano."
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