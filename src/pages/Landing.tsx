import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MessageSquare, Users, BarChart3, Shield, Clock, Zap, Star, CheckCircle } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Link } from "react-router-dom";
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
          <div className="text-center max-w-6xl mx-auto">
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
              <Button asChild size="lg" className="text-lg px-12 py-8 rounded-3xl border-2 border-primary hover:bg-primary hover:text-white transition-all duration-300 hover:scale-105 w-48">
                <a href="#pricing" className="px-0">Ver Preços</a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
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
            <h2 className="text-5xl md:text-6xl font-light mb-8 tracking-tight">
              🚀 <span className="gradient-text">Funcionalidades</span> Poderosas
            </h2>
            <p className="text-muted-foreground text-2xl max-w-4xl mx-auto leading-relaxed">
              Tudo que você precisa para suas campanhas de SMS marketing
              <br />em uma plataforma completa e fácil de usar
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[{
            icon: <Zap className="h-10 w-10" />,
            title: "Envio em Massa",
            description: "Envie para milhares de contatos simultaneamente com alta taxa de entrega garantida e velocidade impressionante."
          }, {
            icon: <MessageSquare className="h-10 w-10" />,
            title: "Personalização Avançada",
            description: "Mensagens personalizadas com nome e dados do cliente para maior engajamento e conversão."
          }, {
            icon: <Clock className="h-10 w-10" />,
            title: "Agendamento Inteligente",
            description: "Programe campanhas para o melhor momento e configure envios recorrentes automatizados."
          }, {
            icon: <BarChart3 className="h-10 w-10" />,
            title: "Relatórios em Tempo Real",
            description: "Acompanhe entregas, taxa de sucesso e engajamento com dashboards interativos e insights poderosos."
          }, {
            icon: <Shield className="h-10 w-10" />,
            title: "API Completa",
            description: "Integre facilmente com seus sistemas existentes usando nossa API REST robusta e bem documentada."
          }, {
            icon: <Users className="h-10 w-10" />,
            title: "Suporte Premium",
            description: "Atendimento especializado em português com conhecimento profundo do mercado angolano."
          }].map((feature, index) => <Card key={index} className="card-futuristic group animate-slide-up-stagger cursor-default" style={{
            animationDelay: `${index * 0.1}s`
          }}>
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
              </Card>)}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding relative">
        <div className="container-futuristic">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-light mb-8 tracking-tight">
              ⭐ O que nossos <span className="gradient-text">clientes dizem</span>
            </h2>
            <p className="text-muted-foreground text-2xl leading-relaxed">
              Empresas angolanas que confiam na nossa plataforma para crescer seus negócios
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {[{
            name: "Carlos Mendes",
            company: "Tech Solutions Luanda",
            text: "Aumentamos nossa taxa de conversão em 300% após começar a usar a plataforma. O suporte é excepcional!",
            rating: 5
          }, {
            name: "Ana Silva",
            company: "Comercial Benguela",
            text: "Interface muito intuitiva e preços justos. Conseguimos alcançar mais clientes com o mesmo orçamento.",
            rating: 5
          }, {
            name: "João Santos",
            company: "Startup Huambo",
            text: "A API é fantástica! Integramos em 2 dias e já estamos vendo resultados incríveis nas nossas campanhas.",
            rating: 5
          }].map((testimonial, index) => <Card key={index} className="card-futuristic animate-slide-up-stagger" style={{
            animationDelay: `${index * 0.2}s`
          }}>
                <CardHeader>
                  <div className="flex space-x-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />)}
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
              </Card>)}
          </div>
        </div>
      </section>

      {/* Revolutionary Pricing Section */}
      <section id="pricing" className="section-padding bg-muted/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent"></div>
        <div className="container-futuristic relative">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-light mb-8 tracking-tight">
              🔒 Preços <span className="gradient-text">Simples e Transparentes</span>
            </h2>
            <p className="text-muted-foreground text-2xl leading-relaxed">
              Sem mensalidade. Pague apenas pelos SMS que usar. Preços em
              <br />Kwanzas para sua conveniência
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10 max-w-7xl mx-auto pt-12">
            {[{
            name: "Básico",
            price: "10.000",
            sms: "100",
            description: "100 SMS incluídos",
            features: ["100 SMS incluídos", "Dashboard básico", "Suporte por email", "Validade: 90 dias", "Relatórios básicos"],
            highlight: false
          }, {
            name: "Intermediário",
            price: "38.000",
            sms: "400",
            description: "400 SMS incluídos",
            features: ["400 SMS incluídos", "Suporte prioritário", "Relatórios avançados", "Agendamento de campanhas", "Validade: 120 dias", "API básica"],
            highlight: true
          }, {
            name: "Avançado",
            price: "90.000",
            sms: "1.000",
            description: "1.000 SMS incluídos",
            features: ["1.000 SMS incluídos", "API completa", "Webhooks personalizados", "Suporte por telefone", "Validade: 180 dias", "Relatórios premium"],
            highlight: false
          }].map((plan, index) => <Card key={index} className={`relative transition-all duration-500 hover:scale-105 rounded-3xl overflow-hidden ${plan.highlight ? 'card-futuristic border-2 border-primary shadow-glow scale-105' : 'card-futuristic border-glass-border'}`}>
                {plan.highlight && <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>}
                
                {plan.highlight && <div className="flex justify-center mb-4">
                    <Badge className="bg-gradient-primary text-white rounded-full px-6 py-2 shadow-glow">
                      ⭐ Mais Popular
                    </Badge>
                  </div>}
                
                <CardHeader className="text-center pb-8 relative">
                  <CardTitle className="text-3xl font-light gradient-text">{plan.name}</CardTitle>
                  <div className="mt-8">
                    <span className="text-6xl font-light gradient-text">{plan.price}</span>
                    <span className="text-muted-foreground text-xl"> Kz</span>
                  </div>
                  <CardDescription className="mt-4 text-lg">{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0 relative">
                  <ul className="space-y-5 mb-10">
                    {plan.features.map((feature, featureIndex) => <li key={featureIndex} className="flex items-start text-base">
                        <CheckCircle className="w-6 h-6 text-primary mr-4 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>)}
                  </ul>
                  <Button asChild className={`w-full rounded-3xl transition-all duration-300 hover:scale-105 text-lg py-6 ${plan.highlight ? 'button-futuristic' : 'glass-card border-glass-border hover:bg-primary hover:text-white'}`} size="lg">
                    <Link to="/register">
                      Escolher Plano
                    </Link>
                  </Button>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

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
                <div className="text-5xl md:text-6xl font-light text-primary mb-4 transition-all duration-300 group-hover:scale-110">{stat.number}</div>
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
            <div className="text-muted-foreground">
              © 2024 SMS.AO. Todos os direitos reservados. 
              <span className="mx-2">•</span>
              <a href="mailto:legal@sms.ao" className="hover:text-primary transition-colors">Termos de Uso</a>
              <span className="mx-2">•</span>
              <a href="mailto:legal@sms.ao" className="hover:text-primary transition-colors">Política de Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;