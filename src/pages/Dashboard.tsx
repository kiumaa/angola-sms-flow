import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Users, Calendar, Settings, Plus } from "lucide-react";
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
      color: "text-primary"
    },
    {
      title: "Campanhas Enviadas",
      value: "0",
      description: "Este mês",
      icon: Calendar,
      color: "text-secondary"
    },
    {
      title: "Contatos",
      value: "0",
      description: "Total na base",
      icon: Users,
      color: "text-accent-foreground"
    },
    {
      title: "Taxa de Entrega",
      value: "0%",
      description: "Média geral",
      icon: Settings,
      color: "text-muted-foreground"
    }
  ];

  const quickActions = [
    {
      title: "Enviar SMS",
      description: "Criar e enviar nova campanha",
      icon: Mail,
      action: () => navigate("/campaigns/new"),
      primary: true
    },
    {
      title: "Carregar Créditos",
      description: "Comprar mais SMS",
      icon: Plus,
      action: () => navigate("/credits"),
      primary: false
    },
    {
      title: "Importar Contatos",
      description: "Adicionar nova lista",
      icon: Users,
      action: () => navigate("/contacts"),
      primary: false
    },
    {
      title: "Ver Relatórios",
      description: "Analisar campanhas",
      icon: Calendar,
      action: () => navigate("/reports"),
      primary: false
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold">
            Bem-vindo, {companyName || userEmail}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas campanhas de SMS e acompanhe resultados em tempo real.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="stats-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card 
                key={index} 
                className={`cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
                  action.primary ? 'ring-2 ring-primary' : ''
                }`}
                onClick={action.action}
              >
                <CardHeader className="text-center">
                  <div className={`h-12 w-12 rounded-lg ${
                    action.primary ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                  } flex items-center justify-center mx-auto mb-2`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        {smsCredits === 50 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-primary">🎉 Conta criada com sucesso!</CardTitle>
              <CardDescription>
                Você ganhou 50 SMS grátis para começar. Que tal enviar sua primeira campanha?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button className="btn-gradient" onClick={() => navigate("/campaigns/new")}>
                  Enviar Primeira Campanha
                </Button>
                <Button variant="outline" onClick={() => navigate("/contacts")}>
                  Importar Contatos
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Suas últimas ações na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma atividade ainda. Comece enviando sua primeira campanha!
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;