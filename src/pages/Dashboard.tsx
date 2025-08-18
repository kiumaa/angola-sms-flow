import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Users, Calendar, Settings, Plus, TrendingUp, Zap, BarChart3, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { stats, loading: statsLoading } = useDashboardStats();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || statsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 animate-pulse">
          <div className="h-32 bg-muted/20 rounded-3xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-40 bg-muted/20 rounded-3xl"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }
  const dashboardStats = [{
    title: "Créditos Disponíveis",
    value: stats.credits?.toLocaleString() || "0",
    description: "SMS prontos para envio",
    icon: Zap,
    gradient: "from-blue-500 to-purple-600",
    trend: "+5% vs mês anterior"
  }, {
    title: "Campanhas Enviadas",
    value: stats.totalCampaigns?.toString() || "0",
    description: "Total criadas",
    icon: MessageSquare,
    gradient: "from-green-500 to-emerald-600",
    trend: "+25% vs mês anterior"
  }, {
    title: "Contatos Ativos",
    value: stats.totalContacts?.toLocaleString() || "0",
    description: "Total na base",
    icon: Users,
    gradient: "from-orange-500 to-red-600",
    trend: "+8% vs mês anterior"
  }, {
    title: "Taxa de Entrega",
    value: `${stats.deliveryRate || 0}%`,
    description: "Média geral",
    icon: TrendingUp,
    gradient: "from-purple-500 to-indigo-600",
    trend: "+2% vs mês anterior"
  }];
  const quickActions = [{
    title: "Enviar SMS",
    description: "Criar e enviar nova campanha",
    icon: Mail,
    action: () => navigate("/campaigns/new"),
    primary: true,
    gradient: "from-blue-500 to-purple-600"
  }, {
    title: "Envio Rápido",
    description: "SMS direto para números específicos",
    icon: Zap,
    action: () => navigate("/quick-send"),
    primary: true,
    gradient: "from-yellow-500 to-orange-600"
  }, {
    title: "Carregar Créditos",
    description: "Comprar mais SMS",
    icon: Plus,
    action: () => navigate("/credits"),
    primary: false,
    gradient: "from-green-500 to-emerald-600"
  }, {
    title: "Importar Contatos",
    description: "Adicionar nova lista",
    icon: Users,
    action: () => navigate("/contacts"),
    primary: false,
    gradient: "from-orange-500 to-red-600"
  }, {
    title: "Ver Relatórios",
    description: "Analisar campanhas",
    icon: BarChart3,
    action: () => navigate("/reports"),
    primary: false,
    gradient: "from-indigo-500 to-blue-600"
  }];
  return <DashboardLayout>
      <div className="space-y-8">
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {dashboardStats.map((stat, index) => <Card key={index} className="card-futuristic animate-slide-up-stagger cursor-default relative overflow-hidden" style={{
          animationDelay: `${index * 0.1}s`
        }}>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`}></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-3 rounded-3xl bg-gradient-to-br ${stat.gradient} shadow-glow hover-lift`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-4xl font-light gradient-text mb-2">{stat.value}</div>
                <p className="text-sm text-muted-foreground mb-3">
                  {stat.description}
                </p>
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.trend}
                </div>
              </CardContent>
            </Card>)}
        </div>

        {/* Revolutionary Quick Actions */}
        <div>
          <h2 className="mb-8 gradient-text text-2xl font-medium">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {quickActions.map((action, index) => <Card key={index} className={`card-futuristic cursor-pointer group relative overflow-hidden animate-slide-up-stagger ${action.primary ? 'ring-2 ring-primary shadow-glow' : ''}`} style={{
            animationDelay: `${index * 0.1 + 0.2}s`
          }} onClick={action.action}>
                
                <CardHeader className="text-center relative">
                  <div className={`h-20 w-20 rounded-3xl bg-gradient-to-br ${action.gradient} shadow-glow flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300`}>
                    <action.icon className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-xl font-medium gradient-text">{action.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">{action.description}</CardDescription>
                </CardHeader>
              </Card>)}
          </div>
        </div>

        {/* Welcome Bonus for New Users */}
        {stats.credits === 10 && <Card className="card-futuristic border-primary bg-gradient-primary/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
            <CardHeader className="relative">
              <CardTitle className="text-3xl gradient-text flex items-center">
                <span className="text-3xl mr-4">🎉</span>
                Conta criada com sucesso!
              </CardTitle>
              <CardDescription className="text-xl">
                Você ganhou 10 SMS grátis para começar. Que tal enviar sua primeira campanha agora?
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex gap-8">
                <Button className="button-futuristic text-xl px-12 py-8 rounded-3xl" onClick={() => navigate("/campaigns/new")}>
                  Enviar Primeira Campanha
                </Button>
                <Button variant="outline" className="glass-card border-glass-border text-xl px-12 py-8 rounded-3xl hover:scale-105 transition-all duration-300" onClick={() => navigate("/contacts")}>
                  Importar Contatos
                </Button>
              </div>
            </CardContent>
          </Card>}

        {/* Advanced Recent Activity */}
        <Card className="card-futuristic">
          <CardHeader>
            <CardTitle className="gradient-text text-2xl font-medium">Atividade Recente</CardTitle>
            <CardDescription className="text-xl">
              Suas últimas ações na plataforma com analytics em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-20">
              <div className="p-8 rounded-3xl bg-gradient-primary/10 w-fit mx-auto mb-8">
                <Calendar className="h-16 w-16 text-primary mx-auto" />
              </div>
              <h3 className="text-2xl font-medium gradient-text mb-4">Nenhuma atividade ainda</h3>
              <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                Comece enviando sua primeira campanha para ver analytics detalhados aqui.
                <br />
                Você terá acesso a métricas avançadas, gráficos interativos e insights poderosos.
              </p>
              <Button className="button-futuristic text-lg px-10 py-6 rounded-3xl" onClick={() => navigate("/campaigns/new")}>
                Criar Primeira Campanha
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Platform Features Preview */}
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="card-futuristic cursor-default">
            <CardHeader className="text-center">
              <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-glow w-fit mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="gradient-text">Analytics Avançados</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-base leading-relaxed">
                Acompanhe suas campanhas com métricas detalhadas, gráficos interativos e relatórios personalizáveis.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="card-futuristic cursor-default">
            <CardHeader className="text-center">
              <div className="p-4 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-glow w-fit mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="gradient-text">Envios em Massa</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-base leading-relaxed">
                Envie para milhares de contatos simultaneamente com alta taxa de entrega e velocidade.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="card-futuristic cursor-default">
            <CardHeader className="text-center">
              <div className="p-4 rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 shadow-glow w-fit mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="gradient-text">Entrega Garantida</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-base leading-relaxed">
                Alcance seus clientes com alta taxa de entrega e redundância entre múltiplos gateways SMS.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>;
};
export default Dashboard;