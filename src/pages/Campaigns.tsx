import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Mail, Calendar, Users } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";

const Campaigns = () => {
  const [campaigns] = useState([
    {
      id: 1,
      name: "Promoção Black Friday",
      message: "🔥 BLACK FRIDAY! 50% OFF em todos os produtos. Use cupom: BF50. Válido até 30/11!",
      recipients: 150,
      sent: 150,
      delivered: 147,
      status: "Enviada",
      createdAt: "2024-11-25",
      scheduledAt: null
    },
    {
      id: 2,
      name: "Lembrete de Pagamento",
      message: "Olá {nome}, seu pagamento vence em 3 dias. Acesse nosso site para quitar.",
      recipients: 45,
      sent: 0,
      delivered: 0,
      status: "Agendada",
      createdAt: "2024-11-26",
      scheduledAt: "2024-11-28 09:00"
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Enviada":
        return "text-secondary";
      case "Agendada":
        return "text-primary";
      case "Rascunho":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  const stats = [
    {
      title: "Total de Campanhas",
      value: campaigns.length,
      icon: Mail,
      color: "text-primary"
    },
    {
      title: "SMS Enviados",
      value: campaigns.reduce((acc, campaign) => acc + campaign.sent, 0),
      icon: Calendar,
      color: "text-secondary"
    },
    {
      title: "Taxa de Entrega",
      value: campaigns.length > 0 
        ? Math.round((campaigns.reduce((acc, campaign) => acc + campaign.delivered, 0) / campaigns.reduce((acc, campaign) => acc + campaign.sent, 0)) * 100) + "%"
        : "0%",
      icon: Users,
      color: "text-accent-foreground"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Campanhas</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas campanhas de SMS marketing
            </p>
          </div>
          <Link to="/campaigns/new">
            <Button className="btn-gradient">
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Campaigns List */}
        <Card>
          <CardHeader>
            <CardTitle>Suas Campanhas</CardTitle>
            <CardDescription>
              Visualize e gerencie todas as suas campanhas de SMS
            </CardDescription>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma campanha criada</h3>
                <p className="text-muted-foreground mb-4">
                  Comece criando sua primeira campanha de SMS marketing
                </p>
                <Link to="/campaigns/new">
                  <Button className="btn-gradient">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Campanha
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{campaign.name}</h3>
                        <p className={`text-sm font-medium ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Criada em {new Date(campaign.createdAt).toLocaleDateString('pt-AO')}</p>
                        {campaign.scheduledAt && (
                          <p>Agendada para {new Date(campaign.scheduledAt).toLocaleString('pt-AO')}</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-md p-3 mb-3">
                      <p className="text-sm">{campaign.message}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Destinatários</p>
                        <p className="font-medium">{campaign.recipients}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Enviados</p>
                        <p className="font-medium">{campaign.sent}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Entregues</p>
                        <p className="font-medium">{campaign.delivered}</p>
                      </div>
                    </div>

                    <div className="flex justify-end mt-4 space-x-2">
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                      {campaign.status === "Rascunho" && (
                        <Button size="sm" className="btn-gradient">
                          Enviar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Campaigns;