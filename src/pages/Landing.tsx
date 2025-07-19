import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MessageSquare, Users, BarChart3, Shield, Clock, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full bg-background/90 backdrop-blur-lg border-b border-border z-50 transition-all duration-300">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 animate-slide-in">
              <div className="p-2 rounded-2xl bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-semibold">SMS Marketing Angola</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105">
                Features
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105">
                Pricing
              </a>
              <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105">
                Contact
              </a>
            </nav>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="outline" size="sm" className="rounded-2xl transition-all duration-200 hover:scale-105">
                Login
              </Button>
              <Button size="sm" className="rounded-2xl transition-all duration-200 hover:scale-105">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-5xl">
          <Badge className="mb-8 bg-primary/10 text-primary hover:bg-primary/20 rounded-full animate-scale-in">
            Nova plataforma de SMS Marketing
          </Badge>
          <h1 className="text-5xl md:text-7xl font-light mb-8 tracking-tight animate-slide-up">
            SMS Marketing para
            <span className="block text-primary font-normal mt-2">Angola</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto font-light leading-relaxed animate-fade-in">
            Conecte-se com seus clientes através de SMS profissional. 
            Plataforma completa com múltiplos gateways e relatórios avançados.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-slide-up">
            <Button size="lg" className="text-base px-10 py-7 rounded-3xl transition-all duration-300 hover:scale-105 hover:shadow-lg">
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-base px-10 py-7 rounded-3xl transition-all duration-300 hover:scale-105">
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-muted/20">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light mb-6 tracking-tight">
              Por que escolher nossa plataforma?
            </h2>
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed">
              Tecnologia avançada para suas campanhas de SMS
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <MessageSquare className="h-8 w-8" />,
                title: "Múltiplos Gateways",
                description: "BulkSMS e BulkGate integrados para máxima confiabilidade"
              },
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: "Relatórios Avançados",
                description: "Analytics completos sobre suas campanhas e resultados"
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Segurança Total",
                description: "Dados protegidos com criptografia de ponta a ponta"
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: "Gestão de Contactos",
                description: "Organize e segmente sua base de clientes facilmente"
              },
              {
                icon: <Clock className="h-8 w-8" />,
                title: "Envio Agendado",
                description: "Programe suas campanhas para o momento ideal"
              },
              {
                icon: <Zap className="h-8 w-8" />,
                title: "API Rápida",
                description: "Integração simples e rápida com seus sistemas"
              }
            ].map((feature, index) => (
              <Card key={index} className="border-0 shadow-minimal hover:shadow-hover transition-all duration-300 hover:scale-105 rounded-3xl group">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-6 p-4 bg-primary/10 rounded-3xl w-fit group-hover:bg-primary/20 transition-all duration-300">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-normal">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light mb-6 tracking-tight">
              Preços Transparentes
            </h2>
            <p className="text-muted-foreground text-xl leading-relaxed">
              Sem taxas ocultas. Pague apenas pelo que usar.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Starter",
                price: "15.000",
                description: "Perfeito para começar",
                features: ["1.000 SMS", "1 Gateway", "Suporte básico", "Relatórios simples"]
              },
              {
                name: "Professional",
                price: "45.000",
                description: "Para empresas em crescimento",
                features: ["5.000 SMS", "2 Gateways", "Suporte prioritário", "Relatórios avançados", "API Access"],
                popular: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "Para grandes volumes",
                features: ["SMS ilimitados", "Todos os Gateways", "Suporte 24/7", "Relatórios personalizados", "API Premium", "Manager dedicado"]
              }
            ].map((plan, index) => (
              <Card key={index} className={`relative border-2 transition-all duration-300 hover:shadow-hover hover:scale-105 rounded-3xl ${
                plan.popular ? 'border-primary scale-105' : 'border-border'
              }`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground rounded-full px-4 py-1">
                    Mais Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-light">{plan.name}</CardTitle>
                  <div className="mt-6">
                    <span className="text-5xl font-light">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-muted-foreground"> AOA</span>}
                  </div>
                  <CardDescription className="mt-3 text-base">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-primary rounded-full mr-4"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full rounded-3xl transition-all duration-300 hover:scale-105 ${plan.popular ? '' : 'variant-outline'}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    {plan.price === "Custom" ? "Contactar" : "Escolher Plano"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-12 text-center">
            {[
              { number: "50K+", label: "SMS Enviados" },
              { number: "500+", label: "Clientes Ativos" },
              { number: "99.9%", label: "Uptime" },
              { number: "24/7", label: "Suporte" }
            ].map((stat, index) => (
              <div key={index} className="group cursor-default">
                <div className="text-5xl md:text-6xl font-light text-primary mb-4 transition-all duration-300 group-hover:scale-110">{stat.number}</div>
                <div className="text-muted-foreground text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="p-2 rounded-2xl bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-lg">SMS Marketing Angola</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 SMS Marketing Angola. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;