import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Send, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  MessageSquare,
  Play,
  Pause,
  BarChart3,
  Settings,
  Copy,
  Edit,
  Trash2,
  Filter,
  Download,
  Target,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Campaign {
  id: string;
  name: string;
  message: string;
  senderId: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'failed';
  scheduledAt?: Date;
  targetAudience: string;
  estimatedReach: number;
  actualSent?: number;
  delivered?: number;
  failed?: number;
  clickRate?: number;
  isRecurring: boolean;
  recurringPattern?: string;
  abTest?: {
    enabled: boolean;
    variantA: string;
    variantB: string;
    splitPercentage: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface CampaignTemplate {
  id: string;
  name: string;
  message: string;
  category: string;
  usageCount: number;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    name: 'Promoção Black Friday',
    message: 'Aprovite! 50% OFF em todos os produtos. Use código: BLACK50. Válido até 30/11. Link: bit.ly/promo2024',
    senderId: 'SMSAO',
    status: 'completed',
    targetAudience: 'Todos os usuários ativos',
    estimatedReach: 2500,
    actualSent: 2500,
    delivered: 2450,
    failed: 50,
    clickRate: 15.2,
    isRecurring: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Lembrete Consulta Médica',
    message: 'Olá {nome}, lembramos da sua consulta amanhã às {hora} com Dr. {medico}. Confirme pelo WhatsApp: {link}',
    senderId: 'CLINICA',
    status: 'scheduled',
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    targetAudience: 'Pacientes com consulta',
    estimatedReach: 85,
    isRecurring: true,
    recurringPattern: 'Diário',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '3',
    name: 'A/B Test - Nova Oferta',
    message: 'Teste A: Oferta especial! 30% de desconto. Teste B: Super desconto! Economize 30% hoje!',
    senderId: 'OFERTAS',
    status: 'sending',
    targetAudience: 'Clientes VIP',
    estimatedReach: 1000,
    actualSent: 650,
    delivered: 630,
    failed: 20,
    isRecurring: false,
    abTest: {
      enabled: true,
      variantA: 'Oferta especial! 30% de desconto',
      variantB: 'Super desconto! Economize 30% hoje!',
      splitPercentage: 50
    },
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-20')
  }
];

const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  { id: '1', name: 'Promoção Geral', message: 'Aproveite nossa promoção especial! {desconto}% OFF. Use código: {codigo}', category: 'Promoções', usageCount: 25 },
  { id: '2', name: 'Lembrete Consulta', message: 'Olá {nome}, lembramos da sua consulta em {data} às {hora}', category: 'Saúde', usageCount: 150 },
  { id: '3', name: 'Confirmação Pedido', message: 'Seu pedido #{numero} foi confirmado! Entrega prevista: {data}', category: 'E-commerce', usageCount: 89 },
  { id: '4', name: 'Evento Corporativo', message: 'Convite especial para {evento} em {data}. RSVP: {link}', category: 'Eventos', usageCount: 12 }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'sending': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'scheduled': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'failed': return 'bg-red-100 text-red-800 border-red-200';
    case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return Target;
    case 'sending': return Send;
    case 'scheduled': return Clock;
    case 'paused': return Pause;
    case 'failed': return Zap;
    case 'draft': return Edit;
    default: return MessageSquare;
  }
};

export const CampaignCenter = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [templates, setTemplates] = useState<CampaignTemplate[]>(CAMPAIGN_TEMPLATES);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  // New Campaign Form State
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    message: '',
    senderId: 'SMSAO',
    targetAudience: 'all',
    scheduledAt: undefined as Date | undefined,
    isRecurring: false,
    recurringPattern: 'daily',
    abTestEnabled: false,
    variantB: ''
  });

  // Template Form State
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    message: '',
    category: 'Geral'
  });

  const filteredCampaigns = campaigns.filter(campaign => {
    if (filter === 'all') return true;
    return campaign.status === filter;
  });

  const handleCreateCampaign = async () => {
    try {
      const campaign: Campaign = {
        id: Date.now().toString(),
        name: newCampaign.name,
        message: newCampaign.message,
        senderId: newCampaign.senderId,
        status: newCampaign.scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: newCampaign.scheduledAt,
        targetAudience: newCampaign.targetAudience,
        estimatedReach: Math.floor(Math.random() * 1000) + 100,
        isRecurring: newCampaign.isRecurring,
        recurringPattern: newCampaign.isRecurring ? newCampaign.recurringPattern : undefined,
        abTest: newCampaign.abTestEnabled ? {
          enabled: true,
          variantA: newCampaign.message,
          variantB: newCampaign.variantB,
          splitPercentage: 50
        } : undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setCampaigns(prev => [campaign, ...prev]);
      setShowCreateModal(false);
      setNewCampaign({
        name: '', message: '', senderId: 'SMSAO', targetAudience: 'all',
        scheduledAt: undefined, isRecurring: false, recurringPattern: 'daily',
        abTestEnabled: false, variantB: ''
      });

      toast({
        title: "Campanha criada!",
        description: `${campaign.name} foi criada com sucesso`
      });

    } catch (error) {
      toast({
        title: "Erro ao criar campanha",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCreateTemplate = () => {
    const template: CampaignTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      message: newTemplate.message,
      category: newTemplate.category,
      usageCount: 0
    };

    setTemplates(prev => [template, ...prev]);
    setShowTemplateModal(false);
    setNewTemplate({ name: '', message: '', category: 'Geral' });

    toast({
      title: "Template criado!",
      description: `${template.name} foi salvo nos templates`
    });
  };

  const useTemplate = (template: CampaignTemplate) => {
    setNewCampaign(prev => ({
      ...prev,
      name: template.name,
      message: template.message
    }));
    setShowCreateModal(true);
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === id 
        ? { ...campaign, status: campaign.status === 'paused' ? 'sending' : 'paused' }
        : campaign
    ));
  };

  const duplicateCampaign = (campaign: Campaign) => {
    const newCampaign: Campaign = {
      ...campaign,
      id: Date.now().toString(),
      name: `${campaign.name} (Cópia)`,
      status: 'draft',
      scheduledAt: undefined,
      actualSent: undefined,
      delivered: undefined,
      failed: undefined,
      clickRate: undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setCampaigns(prev => [newCampaign, ...prev]);
    toast({
      title: "Campanha duplicada!",
      description: `Cópia de ${campaign.name} criada`
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Centro de Campanhas</h1>
          <p className="text-muted-foreground">Gerencie campanhas de SMS marketing</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => setShowTemplateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Campanha
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{campaigns.length}</p>
                <p className="text-sm text-muted-foreground">Total Campanhas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Send className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{campaigns.filter(c => c.status === 'sending').length}</p>
                <p className="text-sm text-muted-foreground">Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{campaigns.filter(c => c.status === 'scheduled').length}</p>
                <p className="text-sm text-muted-foreground">Agendadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {campaigns.reduce((sum, c) => sum + (c.actualSent || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">SMS Enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as campanhas</SelectItem>
            <SelectItem value="draft">Rascunhos</SelectItem>
            <SelectItem value="scheduled">Agendadas</SelectItem>
            <SelectItem value="sending">Enviando</SelectItem>
            <SelectItem value="completed">Concluídas</SelectItem>
            <SelectItem value="paused">Pausadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.map((campaign) => {
          const StatusIcon = getStatusIcon(campaign.status);
          const deliveryRate = campaign.delivered && campaign.actualSent 
            ? Math.round((campaign.delivered / campaign.actualSent) * 100) 
            : null;

          return (
            <Card key={campaign.id} className="hover-lift transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{campaign.name}</h3>
                      <Badge className={cn("text-xs", getStatusColor(campaign.status))}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {campaign.status.toUpperCase()}
                      </Badge>
                      {campaign.isRecurring && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Recorrente
                        </Badge>
                      )}
                      {campaign.abTest?.enabled && (
                        <Badge variant="outline" className="text-xs">
                          A/B Test
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {campaign.message}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Audiência:</span>
                        <p className="font-medium">{campaign.targetAudience}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Alcance:</span>
                        <p className="font-medium">{campaign.estimatedReach.toLocaleString()}</p>
                      </div>
                      {campaign.actualSent && (
                        <div>
                          <span className="text-muted-foreground">Enviados:</span>
                          <p className="font-medium">{campaign.actualSent.toLocaleString()}</p>
                        </div>
                      )}
                      {deliveryRate && (
                        <div>
                          <span className="text-muted-foreground">Taxa Entrega:</span>
                          <p className="font-medium">{deliveryRate}%</p>
                        </div>
                      )}
                    </div>

                    {campaign.status === 'sending' && campaign.actualSent && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progresso</span>
                          <span>{Math.round((campaign.actualSent / campaign.estimatedReach) * 100)}%</span>
                        </div>
                        <Progress 
                          value={(campaign.actualSent / campaign.estimatedReach) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {campaign.status === 'sending' && (
                      <Button size="sm" variant="outline" onClick={() => toggleCampaignStatus(campaign.id)}>
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {campaign.status === 'paused' && (
                      <Button size="sm" variant="outline" onClick={() => toggleCampaignStatus(campaign.id)}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => duplicateCampaign(campaign)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedCampaign(campaign)}>
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Campaign Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Campanha SMS</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Campanha</Label>
                <Input
                  id="name"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Promoção Black Friday"
                />
              </div>
              <div>
                <Label htmlFor="senderId">Sender ID</Label>
                <Select value={newCampaign.senderId} onValueChange={(value) => setNewCampaign(prev => ({ ...prev, senderId: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMSAO">SMSAO</SelectItem>
                    <SelectItem value="PROMO">PROMO</SelectItem>
                    <SelectItem value="INFO">INFO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                value={newCampaign.message}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Digite sua mensagem..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {newCampaign.message.length}/160 caracteres
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="audience">Audiência</Label>
                <Select value={newCampaign.targetAudience} onValueChange={(value) => setNewCampaign(prev => ({ ...prev, targetAudience: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    <SelectItem value="active">Usuários ativos</SelectItem>
                    <SelectItem value="vip">Clientes VIP</SelectItem>
                    <SelectItem value="new">Novos usuários</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Agendamento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {newCampaign.scheduledAt ? format(newCampaign.scheduledAt, "dd/MM/yyyy HH:mm") : "Enviar agora"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newCampaign.scheduledAt}
                      onSelect={(date) => setNewCampaign(prev => ({ ...prev, scheduledAt: date }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newCampaign.isRecurring}
                  onCheckedChange={(checked) => setNewCampaign(prev => ({ ...prev, isRecurring: checked }))}
                />
                <Label>Campanha Recorrente</Label>
              </div>

              {newCampaign.isRecurring && (
                <Select value={newCampaign.recurringPattern} onValueChange={(value) => setNewCampaign(prev => ({ ...prev, recurringPattern: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newCampaign.abTestEnabled}
                  onCheckedChange={(checked) => setNewCampaign(prev => ({ ...prev, abTestEnabled: checked }))}
                />
                <Label>Habilitar A/B Test</Label>
              </div>

              {newCampaign.abTestEnabled && (
                <div>
                  <Label htmlFor="variantB">Mensagem Variante B</Label>
                  <Textarea
                    id="variantB"
                    value={newCampaign.variantB}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, variantB: e.target.value }))}
                    placeholder="Digite a variante B da mensagem..."
                    rows={3}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCampaign} disabled={!newCampaign.name || !newCampaign.message}>
                Criar Campanha
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle>Templates de Mensagem</CardTitle>
          <CardDescription>Templates reutilizáveis para suas campanhas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.slice(0, 6).map((template) => (
              <Card key={template.id} className="hover-lift cursor-pointer transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{template.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {template.message}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Usado {template.usageCount}x
                    </span>
                    <Button size="sm" variant="outline" onClick={() => useTemplate(template)}>
                      Usar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Template Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="templateName">Nome do Template</Label>
              <Input
                id="templateName"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Promoção Geral"
              />
            </div>
            <div>
              <Label htmlFor="templateCategory">Categoria</Label>
              <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Geral">Geral</SelectItem>
                  <SelectItem value="Promoções">Promoções</SelectItem>
                  <SelectItem value="Saúde">Saúde</SelectItem>
                  <SelectItem value="E-commerce">E-commerce</SelectItem>
                  <SelectItem value="Eventos">Eventos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="templateMessage">Mensagem</Label>
              <Textarea
                id="templateMessage"
                value={newTemplate.message}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Use {variáveis} para personalização..."
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTemplate} disabled={!newTemplate.name || !newTemplate.message}>
                Criar Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};