import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Users, FileText, CreditCard, BarChart3, ArrowRight, Zap, Plus, AlertCircle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useDynamicBranding } from "@/hooks/useDynamicBranding";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WhatsAppSupportButton } from "@/components/shared/WhatsAppSupportButton";
const Dashboard = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    credits
  } = useUserCredits();
  const {
    stats,
    loading
  } = useDashboardStats();
  const {
    brandSettings,
    siteSettings
  } = useDynamicBranding();
  useEffect(() => {
    // Apply dynamic branding
    if (brandSettings) {
      document.title = siteSettings?.site_title || 'SMS AO - Dashboard';
    }
  }, [brandSettings, siteSettings]);
  const quickActions = [{
    title: "Envio Rápido",
    description: "Envie SMS rapidamente para um ou vários destinatários",
    icon: Zap,
    href: "/quick-send",
    color: "bg-blue-500",
    badge: "Principal"
  }, {
    title: "Gerir Contatos",
    description: "Adicione, edite e organize seus contatos",
    icon: Users,
    href: "/contacts",
    color: "bg-green-500"
  }, {
    title: "Ver Relatórios",
    description: "Acompanhe suas estatísticas de envio",
    icon: BarChart3,
    href: "/reports",
    color: "bg-purple-500"
  }, {
    title: "Comprar Créditos",
    description: "Recarregue seus créditos para continuar enviando",
    icon: CreditCard,
    href: "/credits",
    color: "bg-orange-500"
  }];
  if (loading) {
    return <DashboardLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-muted rounded-lg w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-2xl"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-muted rounded-2xl"></div>
            <div className="h-96 bg-muted rounded-2xl"></div>
          </div>
        </div>
      </DashboardLayout>;
  }
  return <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Bem-vindo de volta, {user?.email?.split('@')[0]}! Gerencie suas campanhas SMS.
            </p>
          </div>
          <Button onClick={() => navigate("/quick-send")} className="mt-4 lg:mt-0 bg-primary hover:bg-primary/90" size="lg">
            <Send className="h-4 w-4 mr-2" />
            Enviar SMS
          </Button>
        </div>

        {/* Low Credits Warning */}
        {credits < 10 && <Alert className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Seus créditos estão baixos ({credits} restantes). 
              <Link to="/credits" className="font-medium text-orange-600 hover:underline ml-1">
                Recarregue sua conta
              </Link> para continuar enviando SMS.
            </AlertDescription>
          </Alert>}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enviados</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalSent || 0}</div>
              <p className="text-xs text-muted-foreground">
                SMS enviados com sucesso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contatos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalContacts || 0}</div>
              <p className="text-xs text-muted-foreground">
                Na sua base de dados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.deliveryRate || 95}%</div>
              <p className="text-xs text-muted-foreground">
                Últimos 30 dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Créditos</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{credits}</div>
              <p className="text-xs text-muted-foreground">
                Disponíveis para uso
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Two Column Layout (Desktop First) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Quick Actions & Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>
                  Acesse rapidamente as funcionalidades principais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(action.href)}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${action.color} text-white`}>
                            <action.icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm">{action.title}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {action.description}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>)}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>
                  Últimas ações na sua conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.recentActivity && stats.recentActivity.length > 0 ? <div className="space-y-3">
                    {stats.recentActivity.slice(0, 5).map((activity, index) => <div key={index} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{activity.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.status}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{activity.total_targets} destinatários</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>)}
                  </div> : <div className="text-center py-8">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma atividade recente
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Envie seu primeiro SMS para começar
                    </p>
                    <Button className="mt-4" onClick={() => navigate("/quick-send")}>
                      Enviar Primeiro SMS
                    </Button>
                  </div>}
              </CardContent>
            </Card>

            {/* Getting Started Section (if no activity) */}
            {(!stats?.totalSent || stats.totalSent === 0) && <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <span>Pronto para o Primeiro Envio?</span>
                  </CardTitle>
                  <CardDescription>
                    Configure sua conta e comece a enviar SMS para seus contatos agora mesmo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button asChild className="h-12">
                      <Link to="/quick-send">
                        <Send className="h-4 w-4 mr-2" />
                        Enviar SMS Rápido
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="h-12">
                      <Link to="/contacts">
                        <Users className="h-4 w-4 mr-2" />
                        Gerir Contatos
                      </Link>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    💡 Dica: Comece adicionando alguns contatos e depois use o Envio Rápido para testar.
                  </p>
                </CardContent>
              </Card>}
          </div>

          {/* Right Column - Summary & Tips */}
          <div className="space-y-6">
            
            {/* Account Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo da Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Créditos disponíveis:</span>
                  <span className="font-medium text-primary">{credits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">SMS enviados hoje:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Taxa de sucesso:</span>
                  <span className="font-medium text-green-600">{stats?.deliveryRate || 95}%</span>
                </div>
                
                <div className="pt-3 border-t space-y-2">
                  <Button onClick={() => navigate("/credits")} className="w-full" variant="outline">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Comprar Créditos
                  </Button>
                  <WhatsAppSupportButton variant="ghost" size="sm" className="w-full" showText />
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats?.totalSent || 0}</div>
                  <p className="text-xs text-muted-foreground">Total de SMS enviados</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{stats?.totalContacts || 0}</div>
                    <p className="text-xs text-muted-foreground">Contatos</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{stats?.deliveryRate || 95}%</div>
                    <p className="text-xs text-muted-foreground">Entrega</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Highlights */}
            <div className="space-y-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/reports")}>
              <CardContent className="p-4 text-center">
                <div className="p-2 bg-blue-500/10 rounded-lg w-fit mx-auto mb-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="font-medium text-sm">Relatórios Detalhados</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Acompanhe todos os seus envios
                </p>
              </CardContent>
            </Card>

            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>;
};
export default Dashboard;