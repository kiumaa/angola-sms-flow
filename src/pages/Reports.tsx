import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Download, 
  TrendingUp, 
  MessageSquare, 
  Users, 
  CheckCircle,
  Calendar,
  Filter,
  BarChart3,
  Zap
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const Reports = () => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { stats, loading } = useDashboardStats();

  const handleExport = () => {
    try {
      // Exportar relatório simplificado de SMS
      const csvContent = "data:text/csv;charset=utf-8," +
        "Data,SMS Enviados,Créditos Disponíveis,Taxa de Entrega,Contatos Ativos\n" +
        `${new Date().toLocaleDateString()},${stats.totalSent || 0},${stats.credits || 0},${stats.deliveryRate || 0}%,${stats.totalContacts || 0}`;
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "relatorio_sms.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório",
        variant: "destructive"
      });
    }
  };

  const handleFilter = () => {
    toast({
      title: "Info",
      description: "Filtros de data serão aplicados quando houver mais dados de envios SMS",
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 animate-pulse">
          <div className="glass-card p-8">
            <div className="h-20 bg-muted/20 rounded-3xl"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-6">
                <div className="h-32 bg-muted/20 rounded-2xl"></div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="glass-card p-8 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="flex justify-between items-center relative">
            <div>
              <h1 className="text-4xl font-light gradient-text mb-2 flex items-center space-x-3">
                <div className="p-3 rounded-3xl bg-gradient-primary shadow-glow animate-glow">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <span>Relatórios SMS</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Acompanhe suas estatísticas de envio de SMS e performance
              </p>
            </div>
            
            <div className="flex space-x-4">
              <div className="flex space-x-2">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="start-date">Data início</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="end-date">Data fim</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <Button onClick={handleFilter} className="button-futuristic">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrar
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col justify-end">
                <Button onClick={handleExport} className="button-futuristic">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "SMS Enviados",
              value: stats.totalSent?.toLocaleString() || "0",
              description: "Total de mensagens enviadas",
              icon: MessageSquare,
              gradient: "from-blue-500 to-purple-600",
              trend: "+15%"
            },
            {
              title: "Taxa de Entrega",
              value: `${stats.deliveryRate || 0}%`,
              description: "Percentual de entrega",
              icon: CheckCircle,
              gradient: stats.deliveryRate >= 90 ? "from-green-500 to-emerald-600" : "from-orange-500 to-red-600",
              trend: "+2%"
            },
            {
              title: "Contatos Ativos",
              value: stats.totalContacts?.toLocaleString() || "0",
              description: "Total na base de dados",
              icon: Users,
              gradient: "from-orange-500 to-red-600",
              trend: "+8%"
            },
            {
              title: "Créditos Disponíveis",
              value: stats.credits?.toLocaleString() || "0",
              description: "SMS prontos para envio",
              icon: Zap,
              gradient: "from-yellow-500 to-orange-600",
              trend: "+5%"
            }
          ].map((stat, index) => (
            <Card 
              key={index} 
              className="card-futuristic animate-slide-up-stagger cursor-default relative overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
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
                <div className="text-3xl font-light gradient-text mb-2">{stat.value}</div>
                <p className="text-xs text-muted-foreground mb-3">
                  {stat.description}
                </p>
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.trend} vs período anterior
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activity Section */}
        <Card className="card-futuristic">
          <CardHeader>
            <CardTitle className="text-2xl font-light gradient-text">Atividade Recente</CardTitle>
            <CardDescription className="text-lg">
              Histórico dos seus envios de SMS mais recentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-16">
              <div className="p-6 rounded-3xl bg-gradient-primary/10 w-fit mx-auto mb-6">
                <Calendar className="h-16 w-16 text-primary mx-auto" />
              </div>
              <h3 className="text-2xl font-light gradient-text mb-4">Nenhum envio recente</h3>
              <p className="text-muted-foreground text-lg mb-8">
                Quando você começar a enviar SMS, o histórico aparecerá aqui com métricas detalhadas.
              </p>
              <Button className="button-futuristic" onClick={() => window.location.href = '/quick-send'}>
                Enviar Primeiro SMS
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;