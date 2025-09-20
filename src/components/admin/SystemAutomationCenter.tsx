import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Bot, 
  Zap, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Play,
  Pause,
  Trash2,
  Plus,
  Users,
  MessageSquare,
  DollarSign,
  Server,
  Shield,
  TrendingUp,
  Target,
  Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  type: 'credit_adjustment' | 'campaign_trigger' | 'maintenance' | 'alert' | 'workflow';
  category: 'financial' | 'marketing' | 'system' | 'security' | 'user_management';
  trigger: {
    event: string;
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: string;
    parameters: Record<string, any>;
  }>;
  isActive: boolean;
  schedule?: {
    type: 'immediate' | 'scheduled' | 'recurring';
    pattern?: string;
    timezone?: string;
  };
  lastTriggered?: Date;
  totalExecutions: number;
  successRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const AUTOMATION_TEMPLATES = [
  {
    id: 'low-credit-alert',
    name: 'Alerta Créditos Baixos',
    description: 'Notifica usuários quando créditos estão baixos',
    type: 'alert' as const,
    category: 'financial' as const,
    trigger: {
      event: 'credit_threshold',
      conditions: { threshold: 10, comparison: 'less_than' }
    },
    actions: [
      { type: 'send_notification', parameters: { template: 'low_credits', medium: 'email' } },
      { type: 'create_task', parameters: { assignee: 'admin', priority: 'medium' } }
    ]
  },
  {
    id: 'welcome-campaign',
    name: 'Campanha de Boas-vindas',
    description: 'Envia SMS de boas-vindas para novos usuários',
    type: 'campaign_trigger' as const,
    category: 'marketing' as const,
    trigger: {
      event: 'user_registered',
      conditions: { delay_hours: 1 }
    },
    actions: [
      { type: 'send_sms', parameters: { template: 'welcome', sender_id: 'SMSAO' } },
      { type: 'add_to_list', parameters: { list_name: 'Novos Usuários' } }
    ]
  },
  {
    id: 'database-cleanup',
    name: 'Limpeza Automática BD',
    description: 'Remove dados antigos e otimiza performance',
    type: 'maintenance' as const,
    category: 'system' as const,
    trigger: {
      event: 'scheduled',
      conditions: { cron: '0 2 * * 0' } // Todo domingo às 2h
    },
    actions: [
      { type: 'cleanup_logs', parameters: { older_than_days: 90 } },
      { type: 'optimize_tables', parameters: { tables: ['sms_logs', 'admin_audit_logs'] } }
    ]
  },
  {
    id: 'gateway-failover',
    name: 'Failover de Gateway',
    description: 'Troca gateway automaticamente em caso de falha',
    type: 'workflow' as const,
    category: 'system' as const,
    trigger: {
      event: 'gateway_failure',
      conditions: { failure_rate: 50, time_window: 5 }
    },
    actions: [
      { type: 'switch_gateway', parameters: { to: 'backup' } },
      { type: 'send_alert', parameters: { severity: 'high', channels: ['email', 'sms'] } }
    ]
  },
  {
    id: 'credit-bonus',
    name: 'Bônus de Fidelidade',
    description: 'Concede créditos extras para usuários fiéis',
    type: 'credit_adjustment' as const,
    category: 'financial' as const,
    trigger: {
      event: 'monthly_usage',
      conditions: { min_sms_sent: 1000, consecutive_months: 3 }
    },
    actions: [
      { type: 'add_credits', parameters: { amount: 100, reason: 'Bônus fidelidade' } },
      { type: 'send_notification', parameters: { template: 'loyalty_bonus' } }
    ]
  }
];

const AUTOMATION_METRICS = {
  totalRules: 12,
  activeRules: 8,
  totalExecutions: 2847,
  successfulExecutions: 2794,
  failedExecutions: 53,
  avgExecutionTime: 1.2,
  creditsSaved: 1250,
  alertsGenerated: 89
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'credit_adjustment': return DollarSign;
    case 'campaign_trigger': return MessageSquare;
    case 'maintenance': return Settings;
    case 'alert': return AlertTriangle;
    case 'workflow': return Bot;
    default: return Zap;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'financial': return 'bg-green-100 text-green-800 border-green-200';
    case 'marketing': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'system': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'security': return 'bg-red-100 text-red-800 border-red-200';
    case 'user_management': return 'bg-orange-100 text-orange-800 border-orange-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const SystemAutomationCenter = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  // New Rule Form State
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    type: 'alert' as AutomationRule['type'],
    category: 'system' as AutomationRule['category'],
    triggerEvent: '',
    triggerConditions: {},
    actions: [],
    isActive: true,
    scheduleType: 'immediate' as const
  });

  useEffect(() => {
    loadAutomationRules();
  }, []);

  const loadAutomationRules = async () => {
    // Simulate loading automation rules
    const mockRules: AutomationRule[] = AUTOMATION_TEMPLATES.slice(0, 3).map((template, index) => ({
      id: `rule-${index + 1}`,
      name: template.name,
      description: template.description,
      type: template.type,
      category: template.category,
      trigger: template.trigger,
      actions: template.actions,
      isActive: index % 2 === 0,
      totalExecutions: Math.floor(Math.random() * 100) + 10,
      successRate: 95 + Math.random() * 5,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      lastTriggered: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
    }));

    setRules(mockRules);
  };

  const handleCreateRule = async () => {
    try {
      const rule: AutomationRule = {
        id: Date.now().toString(),
        name: newRule.name,
        description: newRule.description,
        type: newRule.type,
        category: newRule.category,
        trigger: {
          event: newRule.triggerEvent,
          conditions: newRule.triggerConditions
        },
        actions: newRule.actions,
        isActive: newRule.isActive,
        schedule: newRule.scheduleType !== 'immediate' ? {
          type: newRule.scheduleType,
          timezone: 'Africa/Luanda'
        } : undefined,
        totalExecutions: 0,
        successRate: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setRules(prev => [rule, ...prev]);
      setShowCreateModal(false);
      setNewRule({
        name: '', description: '', type: 'alert', category: 'system',
        triggerEvent: '', triggerConditions: {}, actions: [],
        isActive: true, scheduleType: 'immediate'
      });

      toast({
        title: "Automação criada!",
        description: `${rule.name} foi configurada com sucesso`
      });

    } catch (error) {
      toast({
        title: "Erro ao criar automação",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, isActive: !rule.isActive, updatedAt: new Date() }
        : rule
    ));

    const rule = rules.find(r => r.id === ruleId);
    toast({
      title: rule?.isActive ? "Automação pausada" : "Automação ativada",
      description: `${rule?.name} foi ${rule?.isActive ? 'pausada' : 'ativada'}`
    });
  };

  const executeRule = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    toast({
      title: "Executando automação...",
      description: `${rule.name} está sendo executada`
    });

    // Simulate execution
    setTimeout(() => {
      setRules(prev => prev.map(r => 
        r.id === ruleId 
          ? { 
              ...r, 
              totalExecutions: r.totalExecutions + 1,
              lastTriggered: new Date(),
              updatedAt: new Date()
            }
          : r
      ));

      toast({
        title: "Automação executada!",
        description: `${rule.name} foi executada com sucesso`
      });
    }, 2000);
  };

  const useTemplate = (template: typeof AUTOMATION_TEMPLATES[0]) => {
    setNewRule({
      name: template.name,
      description: template.description,
      type: template.type,
      category: template.category,
      triggerEvent: template.trigger.event,
      triggerConditions: template.trigger.conditions,
      actions: template.actions,
      isActive: true,
      scheduleType: 'immediate'
    });
    setShowCreateModal(true);
  };

  const filteredRules = rules.filter(rule => {
    if (filter === 'all') return true;
    if (filter === 'active') return rule.isActive;
    if (filter === 'inactive') return !rule.isActive;
    return rule.category === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Centro de Automações</h1>
          <p className="text-muted-foreground">Sistema inteligente de automações e workflows</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => setShowTemplateModal(true)}>
            <Bot className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Automação
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Regras Ativas</p>
                <p className="text-2xl font-bold text-green-600">
                  {AUTOMATION_METRICS.activeRules}/{AUTOMATION_METRICS.totalRules}
                </p>
              </div>
              <Bot className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round((AUTOMATION_METRICS.successfulExecutions / AUTOMATION_METRICS.totalExecutions) * 100)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Execuções</p>
                <p className="text-2xl font-bold text-purple-600">
                  {AUTOMATION_METRICS.totalExecutions.toLocaleString()}
                </p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Créditos Poupados</p>
                <p className="text-2xl font-bold text-orange-600">
                  {AUTOMATION_METRICS.creditsSaved.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">Filtros:</span>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as automações</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="inactive">Inativas</SelectItem>
            <SelectItem value="financial">Financeiro</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="system">Sistema</SelectItem>
            <SelectItem value="security">Segurança</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Automation Rules */}
      <div className="space-y-4">
        {filteredRules.map((rule) => {
          const TypeIcon = getTypeIcon(rule.type);
          
          return (
            <Card key={rule.id} className="hover-lift transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 rounded-lg bg-muted">
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{rule.name}</h3>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getCategoryColor(rule.category)}>
                          {rule.category}
                        </Badge>
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mt-4">
                      <div>
                        <span className="text-muted-foreground">Execuções:</span>
                        <p className="font-medium">{rule.totalExecutions}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Taxa Sucesso:</span>
                        <p className="font-medium">{rule.successRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Última Execução:</span>
                        <p className="font-medium">
                          {rule.lastTriggered 
                            ? rule.lastTriggered.toLocaleDateString('pt-BR')
                            : 'Nunca'
                          }
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Trigger:</span>
                        <p className="font-medium">{rule.trigger.event}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => executeRule(rule.id)}
                      disabled={!rule.isActive}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => toggleRule(rule.id)}
                    >
                      {rule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedRule(rule)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Templates Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Templates de Automação</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AUTOMATION_TEMPLATES.map((template) => {
              const TypeIcon = getTypeIcon(template.type);
              return (
                <Card key={template.id} className="hover-lift cursor-pointer transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge className={getCategoryColor(template.category)}>
                            {template.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {template.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            {template.actions.length} ações
                          </span>
                          <Button size="sm" onClick={() => useTemplate(template)}>
                            Usar Template
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Rule Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Automação</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Automação</Label>
                <Input
                  id="name"
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Alerta Créditos Baixos"
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select value={newRule.type} onValueChange={(value: AutomationRule['type']) => setNewRule(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alert">Alerta</SelectItem>
                    <SelectItem value="workflow">Workflow</SelectItem>
                    <SelectItem value="credit_adjustment">Ajuste de Créditos</SelectItem>
                    <SelectItem value="campaign_trigger">Trigger de Campanha</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={newRule.description}
                onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o que esta automação faz..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={newRule.category} onValueChange={(value: AutomationRule['category']) => setNewRule(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">Financeiro</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                    <SelectItem value="security">Segurança</SelectItem>
                    <SelectItem value="user_management">Gestão de Usuários</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="triggerEvent">Evento Trigger</Label>
                <Input
                  id="triggerEvent"
                  value={newRule.triggerEvent}
                  onChange={(e) => setNewRule(prev => ({ ...prev, triggerEvent: e.target.value }))}
                  placeholder="Ex: credit_threshold"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={newRule.isActive}
                onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, isActive: checked }))}
              />
              <Label>Ativar automação imediatamente</Label>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateRule} disabled={!newRule.name || !newRule.description}>
                Criar Automação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};