import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MessageSquare, Users, BarChart3, Shield, Clock, Zap, Star, CheckCircle } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Advanced Header with Glassmorphism */}
      <header className="fixed top-0 w-full glass backdrop-blur-glass border-b border-glass-border z-50 transition-all duration-300">
        <div className="container-futuristic">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3 animate-slide-in">
              <div className="p-3 rounded-3xl bg-gradient-primary shadow-glow">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-semibold gradient-text">SMS Marketing Angola</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 hover:gradient-text">
                Features
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 hover:gradient-text">
                Pricing
              </a>
              <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 hover:gradient-text">
                Contact
              </a>
            </nav>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button asChild variant="outline" size="sm" className="rounded-3xl glass-card border-glass-border hover:scale-105 transition-all duration-300">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="button-futuristic">
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Revolutionary Hero Section */}
      <section className="pt-40 pb-32 section-padding relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent animate-float"></div>
        <div className="container-futuristic relative">
          <div className="text-center max-w-6xl mx-auto">
            <Badge className="mb-12 glass-card text-primary hover:bg-primary/20 rounded-full px-6 py-3 animate-scale-in shadow-glow">
              🚀 Nova Era do SMS Marketing
            </Badge>
            <h1 className="text-6xl md:text-8xl font-light mb-12 tracking-tighter animate-slide-up">
              <span className="gradient-text">SMS Marketing</span>
              <br />
              <span className="text-foreground font-normal">para Angola</span>
            </h1>
            <p className="text-2xl md:text-3xl text-muted-foreground mb-16 max-w-4xl mx-auto font-light leading-relaxed animate-fade-in">
              Conecte-se com seus clientes através de SMS profissional. 
              <br className="hidden md:block" />
              Plataforma completa com múltiplos gateways e IA integrada.
            </p>
            <div className="flex flex-col sm:flex-row gap-8 justify-center animate-slide-up mb-20">
              <Button asChild size="lg" className="text-lg px-12 py-8 rounded-3xl button-futuristic hover:shadow-elevated">
                <Link to="/register">
                  Começar Agora
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-12 py-8 rounded-3xl glass-card border-glass-border hover:scale-105 transition-all duration-300">
                Ver Demo Live
              </Button>
            </div>
            
            {/* Floating Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { number: "99.9%", label: "Uptime" },
                { number: "500K+", label: "SMS Enviados" },
                { number: "1000+", label: "Clientes" },
                { number: "24/7", label: "Suporte" }
              ].map((stat, index) => (
                <div 
                  key={index} 
                  className="card-futuristic text-center animate-float hover-glow cursor-default"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="text-3xl md:text-4xl font-light gradient-text mb-2">{stat.number}</div>
                  <div className="text-muted-foreground text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section id="features" className="section-padding bg-muted/10 relative">
        <div className="absolute inset-0 bg-gradient-subtle opacity-50"></div>
        <div className="container-futuristic relative">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-light mb-8 tracking-tight">
              <span className="gradient-text">Tecnologia</span> Avançada
            </h2>
            <p className="text-muted-foreground text-2xl max-w-4xl mx-auto leading-relaxed">
              Plataforma completa com IA, múltiplos gateways e analytics em tempo real
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              {
                icon: <MessageSquare className="h-10 w-10" />,
                title: "Múltiplos Gateways",
                description: "BulkSMS e BulkGate integrados com failover automático para 99.9% de entrega garantida"
              },
              {
                icon: <BarChart3 className="h-10 w-10" />,
                title: "Analytics com IA",
                description: "Relatórios inteligentes com machine learning para otimizar suas campanhas automaticamente"
              },
              {
                icon: <Shield className="h-10 w-10" />,
                title: "Segurança Enterprise",
                description: "Criptografia end-to-end, compliance GDPR e auditoria completa de todas as operações"
              },
              {
                icon: <Users className="h-10 w-10" />,
                title: "CRM Integrado",
                description: "Gestão avançada de contactos com segmentação automática e scoring de leads"
              },
              {
                icon: <Clock className="h-10 w-10" />,
                title: "Automação Inteligente",
                description: "Campanhas trigger-based com horários otimizados por machine learning"
              },
              {
                icon: <Zap className="h-10 w-10" />,
                title: "API GraphQL",
                description: "API moderna com webhooks real-time e SDK para todas as linguagens populares"
              }
            ].map((feature, index) => (
              <Card 
                key={index} 
                className="card-futuristic group animate-slide-up-stagger cursor-default"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto mb-8 p-6 bg-gradient-primary rounded-3xl w-fit group-hover:shadow-glow transition-all duration-500 group-hover:scale-110">
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-normal gradient-text">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-lg leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Revolutionary Pricing Section */}
      <section id="pricing" className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent"></div>
        <div className="container-futuristic relative">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-light mb-8 tracking-tight">
              Preços <span className="gradient-text">Revolucionários</span>
            </h2>
            <p className="text-muted-foreground text-2xl leading-relaxed">
              Sem mensalidades. Pague apenas pelo sucesso das suas campanhas.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10 max-w-7xl mx-auto pt-12">
            {[
              {
                name: "Starter",
                price: "15.000",
                description: "Perfeito para começar",
                features: ["1.000 SMS incluídos", "1 Gateway premium", "Dashboard básico", "Suporte por email", "Analytics essenciais"],
                highlight: false
              },
              {
                name: "Professional",
                price: "45.000",
                description: "Para empresas em crescimento",
                features: ["5.000 SMS incluídos", "2 Gateways + failover", "IA para otimização", "Suporte prioritário", "Analytics avançados", "API completa", "Automação básica"],
                highlight: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "Para grandes corporações",
                features: ["SMS ilimitados", "Todos os Gateways", "IA personalizada", "Suporte dedicado 24/7", "White-label", "API Enterprise", "Automação avançada", "Integração personalizada"]
              }
            ].map((plan, index) => (
              <Card 
                key={index} 
                className={`relative transition-all duration-500 hover:scale-105 rounded-3xl overflow-hidden ${
                  plan.highlight 
                    ? 'card-futuristic border-2 border-primary shadow-glow scale-105' 
                    : 'card-futuristic border-glass-border'
                }`}
              >
                {plan.highlight && (
                  <>
                    <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
                    <Badge className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-white rounded-full px-6 py-2 shadow-glow z-10">
                      ⭐ Mais Popular
                    </Badge>
                  </>
                )}
                
                <CardHeader className="text-center pb-8 relative">
                  <CardTitle className="text-3xl font-light gradient-text">{plan.name}</CardTitle>
                  <div className="mt-8">
                    <span className="text-6xl font-light gradient-text">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-muted-foreground text-xl"> AOA</span>}
                  </div>
                  <CardDescription className="mt-4 text-lg">{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0 relative">
                  <ul className="space-y-5 mb-10">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-base">
                        <CheckCircle className="w-6 h-6 text-primary mr-4 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    asChild
                    className={`w-full rounded-3xl transition-all duration-300 hover:scale-105 text-lg py-6 ${
                      plan.highlight ? 'button-futuristic' : 'glass-card border-glass-border hover:bg-primary hover:text-white'
                    }`}
                    size="lg"
                  >
                    <Link to="/register">
                      {plan.price === "Custom" ? "Contactar Vendas" : "Escolher Plano"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding bg-muted/10 relative">
        <div className="container-futuristic">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-light mb-8 tracking-tight">
              O que nossos <span className="gradient-text">clientes dizem</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                name: "Carlos Mendes",
                company: "Tech Solutions Luanda",
                text: "Aumentamos nossa conversão em 300% após começar a usar a plataforma. A IA realmente funciona!",
                rating: 5
              },
              {
                name: "Ana Silva", 
                company: "Comercial Benguela",
                text: "Interface intuitiva e preços justos. O suporte é excepcional, sempre prontos para ajudar.",
                rating: 5
              },
              {
                name: "João Santos",
                company: "Startup Huambo", 
                text: "A API é fantástica! Integramos em 2 dias e já vemos resultados incríveis nas campanhas.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="card-futuristic animate-slide-up-stagger" style={{ animationDelay: `${index * 0.2}s` }}>
                <CardHeader>
                  <div className="flex space-x-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-lg italic leading-relaxed">
                    "{testimonial.text}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-gradient-primary rounded-3xl flex items-center justify-center shadow-glow">
                      <span className="text-white font-bold text-xl">{testimonial.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-lg gradient-text">{testimonial.name}</p>
                      <p className="text-muted-foreground">{testimonial.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-white/10 to-transparent"></div>
        <div className="container-futuristic text-center text-white relative">
          <h2 className="text-5xl md:text-6xl font-light mb-8 tracking-tight">
            Pronto para Revolucionar?
          </h2>
          <p className="text-2xl mb-12 text-white/90 max-w-4xl mx-auto leading-relaxed">
            Junte-se a milhares de empresas angolanas que já transformaram 
            suas vendas com nossa plataforma de SMS Marketing.
          </p>
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 text-xl px-12 py-8 rounded-3xl hover:scale-105 transition-all duration-300 shadow-elevated">
            <Link to="/register">
              Começar Gratuitamente
              <ArrowRight className="ml-3 h-6 w-6" />
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
                <span className="font-bold text-2xl gradient-text">SMS Marketing Angola</span>
              </div>
              <p className="text-muted-foreground mb-6 max-w-md text-lg leading-relaxed">
                Revolucionando a comunicação empresarial em Angola através 
                de tecnologia de ponta e inteligência artificial.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-lg gradient-text">Suporte</h4>
              <div className="space-y-4">
                <a 
                  href="https://wa.me/244933493788" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
                >
                  WhatsApp Suporte
                </a>
                <a 
                  href="mailto:suporte@smsmarketing.ao" 
                  className="block text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
                >
                  Email Técnico
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
            <div className="text-muted-foreground">
              © 2024 SMS Marketing Angola. Todos os direitos reservados. 
              <span className="mx-2">•</span>
              <a href="mailto:legal@smsmarketing.ao" className="hover:text-primary transition-colors">Termos</a>
              <span className="mx-2">•</span>
              <a href="mailto:legal@smsmarketing.ao" className="hover:text-primary transition-colors">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;