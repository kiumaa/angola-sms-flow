import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Send, Calendar, Users, BarChart3, Clock, Eye, Play, Pause, Trash2, Mail } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useCampaigns } from "@/hooks/useCampaigns";

const Campaigns = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { campaigns, loading: isLoading, deleteCampaign } = useCampaigns();


  const getStatusBadge = (status: string) => {
    const statusConfig = {
      sent: { label: "Enviada", color: "bg-green-500/20 text-green-400 border-green-500/30" },
      scheduled: { label: "Agendada", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      draft: { label: "Rascunho", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
      sending: { label: "Enviando", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge className={`${config.color} border rounded-full px-3 py-1`}>
        {config.label}
      </Badge>
    );
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    await deleteCampaign(campaignId);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 animate-pulse">
          <div className="h-20 bg-muted/20 rounded-3xl"></div>
          <div className="grid gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted/20 rounded-3xl"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="glass-card p-8 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="flex items-center justify-between relative">
            <div>
              <h1 className="text-4xl font-light mb-2 gradient-text">Campanhas SMS</h1>
              <p className="text-muted-foreground text-lg">
                Gerencie suas campanhas de marketing com analytics em tempo real
              </p>
            </div>
            <Button 
              onClick={() => navigate("/campaigns/new")}
              className="button-futuristic text-lg px-8 py-6"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nova Campanha
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { title: "Total Enviado", value: "2.4K", icon: Send, color: "text-blue-500" },
            { title: "Taxa de Entrega", value: "98.4%", icon: BarChart3, color: "text-green-500" },
            { title: "Campanhas Ativas", value: "3", icon: Calendar, color: "text-purple-500" },
            { title: "Economia vs Email", value: "67%", icon: Clock, color: "text-orange-500" }
          ].map((stat, index) => (
            <Card key={index} className="card-futuristic animate-slide-up-stagger" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-light gradient-text">{stat.value}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-gradient-primary shadow-glow">
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Campaigns List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-light gradient-text">Suas Campanhas</h2>
          
          {campaigns.length === 0 ? (
            <Card className="card-futuristic">
              <CardContent className="text-center py-16">
                <div className="p-6 rounded-3xl bg-gradient-primary/10 w-fit mx-auto mb-6">
                  <Send className="h-12 w-12 text-primary mx-auto" />
                </div>
                <h3 className="text-xl font-normal mb-2">Nenhuma campanha ainda</h3>
                <p className="text-muted-foreground mb-8">
                  Crie sua primeira campanha e comece a engajar seus clientes.
                </p>
                <Button 
                  className="button-futuristic" 
                  onClick={() => navigate("/campaigns/new")}
                >
                  Criar Primeira Campanha
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign, index) => (
                <Card 
                  key={campaign.id} 
                  className="card-futuristic hover-lift animate-slide-up-stagger" 
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl gradient-text">{campaign.name}</CardTitle>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <CardDescription className="text-base mb-4">
                          {campaign.message_template.length > 100 
                            ? `${campaign.message_template.substring(0, 100)}...`
                            : campaign.message_template
                          }
                        </CardDescription>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Users className="h-4 w-4 mr-2" />
                            {campaign.total_targets || 0} destinatários
                          </div>
                          {campaign.stats && (
                            <>
                              <div className="flex items-center text-green-600">
                                <Send className="h-4 w-4 mr-2" />
                                {campaign.stats.sent || 0} enviados
                              </div>
                              <div className="flex items-center text-red-600">
                                <BarChart3 className="h-4 w-4 mr-2" />
                                {campaign.stats.failed || 0} falharam
                              </div>
                            </>
                          )}
                          <div className="flex items-center text-purple-600">
                            <Clock className="h-4 w-4 mr-2" />
                            {campaign.est_credits || 0} créditos
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm" className="glass-card border-glass-border">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="glass-card border-glass-border text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Campaigns;