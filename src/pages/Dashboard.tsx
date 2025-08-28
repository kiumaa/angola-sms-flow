import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, BarChart3, Zap, Send, Plus, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDynamicBranding } from "@/hooks/useDynamicBranding";

const Dashboard = () => {
  const { user } = useAuth();
  const { credits } = useUserCredits();
  const { stats, loading } = useDashboardStats();
  
  // Apply dynamic branding
  useDynamicBranding();

  if (loading) {
    return (
      <div className="p-6 space-y-8 animate-pulse">
        <div className="h-20 bg-muted/20 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted/20 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Section */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">
          Olá, {user?.email?.split('@')[0]}!
        </h1>
        <p className="text-muted-foreground text-lg">
          Pronto para enviar SMS? Use o Envio Rápido para começar agora mesmo.
        </p>
      </div>

      {/* Low Credits Warning */}
      {credits < 10 && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Seus créditos estão baixos ({credits} restantes). 
            <Link to="/credits" className="font-medium text-orange-600 hover:underline ml-1">
              Recarregue sua conta
            </Link> para continuar enviando SMS.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primary Action - Quick Send */}
        <Card className="hover:shadow-lg transition-all duration-300 border-primary/20 hover:border-primary/40">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Envio Rápido</CardTitle>
                  <CardDescription>Envie SMS para 1 ou múltiplos contactos</CardDescription>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/quick-send">
                Enviar SMS Agora
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link to="/contacts" className="block p-4">
              <div className="text-center space-y-2">
                <div className="mx-auto p-2 bg-blue-500/10 rounded-lg w-fit">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="font-medium text-foreground">Contactos</h3>
                <p className="text-xs text-muted-foreground">Gerir lista</p>
              </div>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link to="/reports" className="block p-4">
              <div className="text-center space-y-2">
                <div className="mx-auto p-2 bg-green-500/10 rounded-lg w-fit">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="font-medium text-foreground">Relatórios</h3>
                <p className="text-xs text-muted-foreground">Ver histórico</p>
              </div>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link to="/credits" className="block p-4">
              <div className="text-center space-y-2">
                <div className="mx-auto p-2 bg-orange-500/10 rounded-lg w-fit">
                  <Plus className="h-5 w-5 text-orange-500" />
                </div>
                <h3 className="font-medium text-foreground">Créditos</h3>
                <p className="text-xs text-muted-foreground">Recarregar</p>
              </div>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link to="/sender-ids" className="block p-4">
              <div className="text-center space-y-2">
                <div className="mx-auto p-2 bg-purple-500/10 rounded-lg w-fit">
                  <Send className="h-5 w-5 text-purple-500" />
                </div>
                <h3 className="font-medium text-foreground">Sender IDs</h3>
                <p className="text-xs text-muted-foreground">Configurar</p>
              </div>
            </Link>
          </Card>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos Disponíveis</CardTitle>
            <Plus className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{credits}</div>
            <p className="text-xs text-muted-foreground">
              Pronto para envios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Enviados</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats?.totalSent || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contactos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats?.totalContacts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Na sua lista
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? "..." : `${stats?.deliveryRate || 95}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Section */}
      {(!stats?.totalSent || stats.totalSent === 0) && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-primary" />
              <span>Pronto para o Primeiro Envio?</span>
            </CardTitle>
            <CardDescription>
              Configure sua conta e comece a enviar SMS para seus contactos agora mesmo.
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
                  Gerir Contactos
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              💡 Dica: Comece adicionando alguns contactos e depois use o Envio Rápido para testar.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Feature Highlights */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto p-3 bg-blue-500/10 rounded-xl w-fit mb-2">
              <BarChart3 className="h-6 w-6 text-blue-500" />
            </div>
            <CardTitle className="text-lg">Relatórios Detalhados</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <CardDescription>
              Acompanhe o status de todos os seus envios com relatórios em tempo real.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto p-3 bg-green-500/10 rounded-xl w-fit mb-2">
              <Zap className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle className="text-lg">Envio Instantâneo</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <CardDescription>
              Envie SMS para múltiplos contactos de forma rápida e confiável.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto p-3 bg-orange-500/10 rounded-xl w-fit mb-2">
              <TrendingUp className="h-6 w-6 text-orange-500" />
            </div>
            <CardTitle className="text-lg">Alta Taxa de Entrega</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <CardDescription>
              Garantimos alta taxa de entrega para todos os seus envios em Angola.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;