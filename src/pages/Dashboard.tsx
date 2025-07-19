import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Users, Calendar, Settings, Plus, TrendingUp, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";

const Dashboard = () => {
  const [userEmail, setUserEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [smsCredits, setSmsCredits] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Load user data
    setUserEmail(localStorage.getItem("userEmail") || "");
    setCompanyName(localStorage.getItem("companyName") || "");
    setSmsCredits(parseInt(localStorage.getItem("smsCredits") || "0"));
  }, [navigate]);

  const stats = [
    {
      title: "Créditos Disponíveis",
      value: smsCredits,
      description: "SMS prontos para envio",
      icon: Mail,
      color: "text-primary",
      trend: "+5% vs mês anterior"
    },
    {
      title: "Campanhas Enviadas",
      value: "12",
      description: "Este mês",
      icon: Calendar,
      color: "text-green-500",
      trend: "+25% vs mês anterior"
    },
    {
      title: "Contatos Ativos",
      value: "1.2K",
      description: "Total na base",
      icon: Users,
      color: "text-blue-500",
      trend: "+8% vs mês anterior"
    },
    {
      title: "Taxa de Entrega",
      value: "98.5%",
      description: "Média geral",
      icon: TrendingUp,
      color: "text-purple-500",
      trend: "+2% vs mês anterior"
    }
  ];

  const quickActions = [
    {
      title: "Enviar SMS",
      description: "Criar e enviar nova campanha",
      icon: Mail,
      action: () => navigate("/campaigns/new"),
      primary: true,
      gradient: "from-blue-500 to-purple-600"
    },
    {
      title: "Carregar Créditos",
      description: "Comprar mais SMS",
      icon: Plus,
      action: () => navigate("/credits"),
      primary: false,
      gradient: "from-green-500 to-emerald-600"
    },
    {
      title: "Importar Contatos",
      description: "Adicionar nova lista",
      icon: Users,
      action: () => navigate("/contacts"),
      primary: false,
      gradient: "from-orange-500 to-red-600"
    },
    {
      title: "Ver Relatórios",
      description: "Analisar campanhas",
      icon: Calendar,
      action: () => navigate("/reports"),
      primary: false,
      gradient: "from-indigo-500 to-blue-600"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Advanced Welcome Section */}
        <div className="glass-card p-8 bg-gradient-hero">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-light mb-2 gradient-text">
                Bem-vindo, {companyName || userEmail}!
              </h1>
              <p className="text-muted-foreground text-lg">
                Gerencie suas campanhas de SMS com inteligência artificial e analytics avançados.
              </p>
            </div>
            <div className="hidden md:block">
              <div className="p-4 rounded-3xl bg-gradient-primary shadow-glow animate-float">
                <Zap className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className="card-futuristic animate-slide-up-stagger cursor-default"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="p-2 rounded-2xl bg-gradient-primary shadow-glow">
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-light gradient-text mb-1">{stat.value}</div>
                <p className="text-xs text-muted-foreground mb-2">
                  {stat.description}
                </p>
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.trend}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revolutionary Quick Actions */}
        <div>
          <h2 className="text-2xl font-light mb-8 gradient-text">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Card 
                key={index} 
                className={`card-futuristic cursor-pointer group relative overflow-hidden animate-slide-up-stagger ${
                  action.primary ? 'ring-2 ring-primary shadow-glow' : ''
                }`}
                style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
                onClick={action.action}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-all duration-300`}></div>
                <CardHeader className="text-center relative">
                  <div className={`h-16 w-16 rounded-3xl bg-gradient-primary shadow-glow flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300`}>
                    <action.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-normal gradient-text">{action.title}</CardTitle>
                  <CardDescription className="text-base">{action.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Futuristic Getting Started */}
        {smsCredits === 50 && (
          <Card className="card-futuristic border-primary bg-gradient-primary/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
            <CardHeader className="relative">
              <CardTitle className="text-2xl gradient-text flex items-center">
                <span className="text-2xl mr-3">🎉</span>
                Conta criada com sucesso!
              </CardTitle>
              <CardDescription className="text-lg">
                Você ganhou 50 SMS grátis para começar. Que tal enviar sua primeira campanha com IA?
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex gap-6">
                <Button 
                  className="button-futuristic text-lg px-8 py-6" 
                  onClick={() => navigate("/campaigns/new")}
                >
                  Enviar Primeira Campanha
                </Button>
                <Button 
                  variant="outline" 
                  className="glass-card border-glass-border text-lg px-8 py-6 hover:scale-105 transition-all duration-300" 
                  onClick={() => navigate("/contacts")}
                >
                  Importar Contatos
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Advanced Recent Activity */}
        <Card className="card-futuristic">
          <CardHeader>
            <CardTitle className="text-2xl font-light gradient-text">Atividade Recente</CardTitle>
            <CardDescription className="text-lg">
              Suas últimas ações na plataforma com analytics em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-16">
              <div className="p-6 rounded-3xl bg-gradient-primary/10 w-fit mx-auto mb-6">
                <Calendar className="h-12 w-12 text-primary mx-auto" />
              </div>
              <h3 className="text-xl font-normal mb-2">Nenhuma atividade ainda</h3>
              <p className="text-muted-foreground mb-8">
                Comece enviando sua primeira campanha para ver analytics detalhados aqui.
              </p>
              <Button 
                className="button-futuristic" 
                onClick={() => navigate("/campaigns/new")}
              >
                Criar Primeira Campanha
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;