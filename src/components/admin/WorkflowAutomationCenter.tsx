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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Workflow, 
  Plus, 
  Play,
  Pause,
  Settings,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Bot,
  Zap,
  GitBranch,
  Timer,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay' | 'branch';
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[];
}

interface WorkflowInstance {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error' | 'draft';
  category: 'user_onboarding' | 'credit_management' | 'campaign_automation' | 'system_maintenance' | 'support';
  steps: WorkflowStep[];
  triggers: {
    type: string;
    config: Record<string, any>;
  }[];
  variables: Record<string, any>;
  executions: {
    total: number;
    successful: number;
    failed: number;
    lastRun?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const WORKFLOW_TEMPLATES = [
  {
    id: 'user-onboarding',
    name: 'Onboarding Completo de Usuário',
    description: 'Workflow completo para novos usuários com múltiplas etapas',
    category: 'user_onboarding' as const,
    steps: [
      { type: 'trigger', name: 'Usuário Registrado', config: { event: 'user_registered' } },
      { type: 'delay', name: 'Aguardar 1 hora', config: { duration: '1h' } },
      { type: 'action', name: 'Enviar SMS Boas-vindas', config: { template: 'welcome_sms' } },
      { type: 'delay', name: 'Aguardar 24 horas', config: { duration: '24h' } },
      { type: 'condition', name: 'Verificar Primeiro SMS', config: { condition: 'first_sms_sent' } },
      { type: 'branch', name: 'Dividir Fluxo', config: { branches: ['sent', 'not_sent'] } },
      { type: 'action', name: 'SMS Tutorial', config: { template: 'tutorial_sms', branch: 'not_sent' } },
      { type: 'action', name: 'SMS Parabenização', config: { template: 'congratulations_sms', branch: 'sent' } }
    ]
  },
  {
    id: 'credit-management',
    name: 'Gestão Automática de Créditos',
    description: 'Monitora e ajusta créditos automaticamente',
    category: 'credit_management' as const,
    steps: [
      { type: 'trigger', name: 'Créditos Baixos', config: { threshold: 10 } },
      { type: 'condition', name: 'Verificar Histórico', config: { condition: 'has_purchased_before' } },
      { type: 'action', name: 'Enviar Oferta Personalizada', config: { template: 'credit_offer' } },
      { type: 'delay', name: 'Aguardar 3 dias', config: { duration: '72h' } },
      { type: 'condition', name: 'Verificar Compra', config: { condition: 'credits_purchased' } },
      { type: 'action', name: 'Adicionar Bônus', config: { bonus_percentage: 10 } }
    ]
  },
  {
    id: 'campaign-optimization',
    name: 'Otimização de Campanhas',
    description: 'Analisa e otimiza campanhas automaticamente',
    category: 'campaign_automation' as const,
    steps: [
      { type: 'trigger', name: 'Campanha Finalizada', config: { event: 'campaign_completed' } },
      { type: 'action', name: 'Analisar Performance', config: { metrics: ['delivery_rate', 'engagement'] } },
      { type: 'condition', name: 'Performance Baixa?', config: { delivery_rate: '<90%' } },
      { type: 'action', name: 'Gerar Relatório de Melhoria', config: { template: 'improvement_report' } },
      { type: 'action', name: 'Notificar Admin', config: { urgency: 'medium' } }
    ]
  }
];

const WORKFLOW_METRICS = {
  totalWorkflows: 15,
  activeWorkflows: 12,
  totalExecutions: 4521,
  successfulExecutions: 4387,
  avgExecutionTime: 2.8,
  creditsSaved: 2150,
  conversionsGenerated: 347
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 border-green-200';
    case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'error': return 'bg-red-100 text-red-800 border-red-200';
    case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStepIcon = (type: string) => {
  switch (type) {
    case 'trigger': return Zap;
    case 'condition': return GitBranch;
    case 'action': return Play;
    case 'delay': return Timer;
    case 'branch': return GitBranch;
    default: return Settings;
  }
};

export const WorkflowAutomationCenter = () => {
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInstance | null>(null);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  // New Workflow Form State
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    category: 'user_onboarding' as WorkflowInstance['category'],
    isActive: true
  });

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    // Simulate loading workflows
    const realWorkflows: WorkflowInstance[] = WORKFLOW_TEMPLATES.map((template, index) => ({
      id: `workflow-${index + 1}`,
      name: template.name,
      description: template.description,
      status: index % 3 === 0 ? 'active' : index % 3 === 1 ? 'inactive' : 'draft',
      category: template.category,
      steps: template.steps.map((step, stepIndex) => ({
        id: `step-${stepIndex}`,
        type: step.type as WorkflowStep['type'],
        name: step.name,
        config: step.config,
        position: { x: stepIndex * 150, y: 100 },
        connections: stepIndex < template.steps.length - 1 ? [`step-${stepIndex + 1}`] : []
      })),
      triggers: [{ type: 'event', config: { event: 'user_action' } }],
      variables: {},
      executions: {
        total: Math.floor(Math.random() * 500) + 50,
        successful: Math.floor(Math.random() * 450) + 45,
        failed: Math.floor(Math.random() * 20),
        lastRun: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      },
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    }));

    setWorkflows(realWorkflows);
  };

  const handleCreateWorkflow = async () => {
    try {
      const workflow: WorkflowInstance = {
        id: Date.now().toString(),
        name: newWorkflow.name,
        description: newWorkflow.description,
        status: newWorkflow.isActive ? 'active' : 'draft',
        category: newWorkflow.category,
        steps: [],
        triggers: [],
        variables: {},
        executions: {
          total: 0,
          successful: 0,
          failed: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setWorkflows(prev => [workflow, ...prev]);
      setShowCreateModal(false);
      setNewWorkflow({
        name: '', description: '', category: 'user_onboarding', isActive: true
      });

      toast({
        title: "Workflow criado!",
        description: `${workflow.name} foi criado com sucesso`
      });

    } catch (error) {
      toast({
        title: "Erro ao criar workflow",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.map(workflow => 
      workflow.id === workflowId 
        ? { 
            ...workflow, 
            status: workflow.status === 'active' ? 'inactive' : 'active',
            updatedAt: new Date()
          }
        : workflow
    ));

    const workflow = workflows.find(w => w.id === workflowId);
    toast({
      title: workflow?.status === 'active' ? "Workflow pausado" : "Workflow ativado",
      description: `${workflow?.name} foi ${workflow?.status === 'active' ? 'pausado' : 'ativado'}`
    });
  };

  const executeWorkflow = async (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    toast({
      title: "Executando workflow...",
      description: `${workflow.name} está sendo executado`
    });

    // Simulate execution
    setTimeout(() => {
      setWorkflows(prev => prev.map(w => 
        w.id === workflowId 
          ? { 
              ...w, 
              executions: {
                ...w.executions,
                total: w.executions.total + 1,
                successful: w.executions.successful + 1,
                lastRun: new Date()
              },
              updatedAt: new Date()
            }
          : w
      ));

      toast({
        title: "Workflow executado!",
        description: `${workflow.name} foi executado com sucesso`
      });
    }, 3000);
  };

  const useTemplate = (template: typeof WORKFLOW_TEMPLATES[0]) => {
    setNewWorkflow({
      name: template.name,
      description: template.description,
      category: template.category,
      isActive: true
    });
    setShowCreateModal(true);
  };

  const filteredWorkflows = workflows.filter(workflow => {
    if (filter === 'all') return true;
    if (filter === 'active') return workflow.status === 'active';
    if (filter === 'inactive') return workflow.status === 'inactive';
    return workflow.category === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Centro de Workflows</h1>
          <p className="text-muted-foreground">Automações complexas e inteligentes com múltiplas etapas</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => setShowTemplateModal(true)}>
            <Workflow className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Workflow
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Workflows Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {WORKFLOW_METRICS.activeWorkflows}/{WORKFLOW_METRICS.totalWorkflows}
                </p>
              </div>
              <Workflow className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round((WORKFLOW_METRICS.successfulExecutions / WORKFLOW_METRICS.totalExecutions) * 100)}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Execuções Totais</p>
                <p className="text-2xl font-bold text-purple-600">
                  {WORKFLOW_METRICS.totalExecutions.toLocaleString()}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversões</p>
                <p className="text-2xl font-bold text-orange-600">
                  {WORKFLOW_METRICS.conversionsGenerated.toLocaleString()}
                </p>
              </div>
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Bot className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Produtividade:</strong> Os workflows pouparam {WORKFLOW_METRICS.creditsSaved.toLocaleString()} créditos 
          e geraram {WORKFLOW_METRICS.conversionsGenerated} conversões automáticas este mês.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">Filtros:</span>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os workflows</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="user_onboarding">Onboarding</SelectItem>
            <SelectItem value="credit_management">Créditos</SelectItem>
            <SelectItem value="campaign_automation">Campanhas</SelectItem>
            <SelectItem value="system_maintenance">Manutenção</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {filteredWorkflows.map((workflow) => {
          const successRate = workflow.executions.total > 0 
            ? Math.round((workflow.executions.successful / workflow.executions.total) * 100)
            : 100;
          
          return (
            <Card key={workflow.id} className="hover-lift transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Workflow className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{workflow.name}</h3>
                        <p className="text-sm text-muted-foreground">{workflow.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(workflow.status))}>
                          {workflow.status === 'active' ? 'Ativo' :
                           workflow.status === 'inactive' ? 'Inativo' :
                           workflow.status === 'error' ? 'Erro' : 'Rascunho'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {workflow.steps.length} etapas
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Workflow Steps Preview */}
                    <div className="flex items-center space-x-2 mb-4">
                      {workflow.steps.slice(0, 5).map((step, index) => {
                        const StepIcon = getStepIcon(step.type);
                        return (
                          <div key={step.id} className="flex items-center">
                            <div className="p-1 rounded bg-muted">
                              <StepIcon className="h-3 w-3" />
                            </div>
                            {index < Math.min(workflow.steps.length - 1, 4) && (
                              <div className="w-4 h-px bg-border mx-1"></div>
                            )}
                          </div>
                        );
                      })}
                      {workflow.steps.length > 5 && (
                        <span className="text-xs text-muted-foreground">
                          +{workflow.steps.length - 5} mais
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Execuções:</span>
                        <p className="font-medium">{workflow.executions.total}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Taxa Sucesso:</span>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{successRate}%</p>
                          <Progress value={successRate} className="w-16 h-2" />
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Última Execução:</span>
                        <p className="font-medium">
                          {workflow.executions.lastRun 
                            ? workflow.executions.lastRun.toLocaleDateString('pt-BR')
                            : 'Nunca'
                          }
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Categoria:</span>
                        <p className="font-medium">{workflow.category}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => executeWorkflow(workflow.id)}
                      disabled={workflow.status !== 'active'}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => toggleWorkflow(workflow.id)}
                    >
                      {workflow.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedWorkflow(workflow)}
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
            <DialogTitle>Templates de Workflow</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {WORKFLOW_TEMPLATES.map((template) => (
              <Card key={template.id} className="hover-lift cursor-pointer transition-all duration-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                    <div className="flex items-center space-x-2">
                      {template.steps.slice(0, 4).map((step, index) => {
                        const StepIcon = getStepIcon(step.type);
                        return (
                          <div key={index} className="flex items-center">
                            <div className="p-1 rounded bg-muted">
                              <StepIcon className="h-3 w-3" />
                            </div>
                            {index < 3 && index < template.steps.length - 1 && (
                              <div className="w-2 h-px bg-border mx-1"></div>
                            )}
                          </div>
                        );
                      })}
                      {template.steps.length > 4 && (
                        <span className="text-xs text-muted-foreground">
                          +{template.steps.length - 4}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {template.steps.length} etapas
                      </span>
                      <Button size="sm" onClick={() => useTemplate(template)}>
                        Usar Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Workflow Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Nome do Workflow</Label>
              <Input
                id="name"
                value={newWorkflow.name}
                onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Onboarding de Usuários VIP"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={newWorkflow.description}
                onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o objetivo e funcionamento deste workflow..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={newWorkflow.category} onValueChange={(value: WorkflowInstance['category']) => setNewWorkflow(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user_onboarding">Onboarding de Usuários</SelectItem>
                  <SelectItem value="credit_management">Gestão de Créditos</SelectItem>
                  <SelectItem value="campaign_automation">Automação de Campanhas</SelectItem>
                  <SelectItem value="system_maintenance">Manutenção do Sistema</SelectItem>
                  <SelectItem value="support">Suporte ao Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newWorkflow.isActive}
                onCheckedChange={(checked) => setNewWorkflow(prev => ({ ...prev, isActive: checked }))}
              />
              <Label>Ativar workflow imediatamente</Label>
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateWorkflow} disabled={!newWorkflow.name || !newWorkflow.description}>
                Criar Workflow
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};