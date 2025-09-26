import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Database,
  Users,
  FileText,
  Clock,
  Trash2,
  Download,
  Eye,
  Lock,
  UserCheck,
  RefreshCw,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLGPDCompliance } from "@/hooks/useLGPDCompliance";

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  type: 'data_retention' | 'consent' | 'access_control' | 'audit' | 'privacy';
  status: 'compliant' | 'non_compliant' | 'partial';
  requirement: string;
  implementation: string;
  lastChecked: Date;
}

const COMPLIANCE_RULES: ComplianceRule[] = [
  {
    id: '1',
    name: 'Consentimento Explícito para Marketing',
    description: 'Usuários devem dar consentimento explícito para receber SMS de marketing',
    type: 'consent',
    status: 'compliant',
    requirement: 'LGPD Art. 7º, IV',
    implementation: 'Checkbox obrigatório no cadastro + opt-in duplo',
    lastChecked: new Date('2024-01-20')
  },
  {
    id: '2',
    name: 'Retenção de Dados de SMS',
    description: 'Logs de SMS devem ser mantidos por máximo 2 anos',
    type: 'data_retention',
    status: 'partial',
    requirement: 'LGPD Art. 15º',
    implementation: 'Auto-exclusão configurada para 18 meses',
    lastChecked: new Date('2024-01-18')
  },
  {
    id: '3',
    name: 'Direito ao Esquecimento',
    description: 'Processo para exclusão completa de dados pessoais',
    type: 'privacy',
    status: 'compliant',
    requirement: 'LGPD Art. 18º, VI',
    implementation: 'Sistema automatizado de exclusão em 30 dias',
    lastChecked: new Date('2024-01-19')
  },
  {
    id: '4',
    name: 'Portabilidade de Dados',
    description: 'Usuários podem exportar seus dados em formato estruturado',
    type: 'access_control',
    status: 'compliant',
    requirement: 'LGPD Art. 18º, V',
    implementation: 'Sistema de exportação automática implementado',
    lastChecked: new Date('2024-01-20')
  },
  {
    id: '5',
    name: 'Auditoria de Acesso',
    description: 'Logs de acesso a dados pessoais devem ser mantidos',
    type: 'audit',
    status: 'compliant',
    requirement: 'LGPD Art. 37º',
    implementation: 'Logs automáticos + revisão mensal',
    lastChecked: new Date('2024-01-20')
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'compliant': return 'bg-green-100 text-green-800 border-green-200';
    case 'non_compliant': return 'bg-red-100 text-red-800 border-red-200';
    case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'processing': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'consent': return UserCheck;
    case 'data_retention': return Database;
    case 'access_control': return Lock;
    case 'audit': return FileText;
    case 'privacy': return Shield;
    case 'data_export': return Download;
    case 'data_deletion': return Trash2;
    case 'data_correction': return FileText;
    case 'data_portability': return Database;
    case 'consent_withdrawal': return UserCheck;
    default: return Info;
  }
};

const getRequestTypeLabel = (type: string) => {
  switch (type) {
    case 'data_export': return 'Exportação de Dados';
    case 'data_deletion': return 'Exclusão de Dados';
    case 'data_correction': return 'Correção de Dados';
    case 'data_portability': return 'Portabilidade de Dados';
    case 'consent_withdrawal': return 'Retirada de Consentimento';
    default: return type;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'Pendente';
    case 'processing': return 'Processando';
    case 'completed': return 'Concluído';
    case 'rejected': return 'Rejeitado';
    default: return status;
  }
};

export const LGPDComplianceCenter = () => {
  const [rules, setRules] = useState<ComplianceRule[]>(COMPLIANCE_RULES);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [processNotes, setProcessNotes] = useState('');
  const { toast } = useToast();
  
  const {
    complianceScore,
    lgpdRequests,
    loading,
    creating,
    processing,
    createLgpdRequest,
    processLgpdRequest,
    exportUserData,
    refreshData
  } = useLGPDCompliance();

  const [newRequest, setNewRequest] = useState({
    userEmail: '',
    requestType: 'data_export',
    reason: ''
  });

  const compliantRules = rules.filter(r => r.status === 'compliant').length;
  const nonCompliantRules = rules.filter(r => r.status === 'non_compliant').length;
  const partialRules = rules.filter(r => r.status === 'partial').length;
  const realComplianceScore = complianceScore ? Math.round(complianceScore.score) : Math.round((compliantRules / rules.length) * 100);

  const pendingRequests = lgpdRequests.filter(r => r.status === 'pending').length;
  const processingRequests = lgpdRequests.filter(r => r.status === 'processing').length;

  const handleCreateRequest = async () => {
    try {
      await createLgpdRequest(newRequest);
      setShowNewRequestModal(false);
      setNewRequest({ userEmail: '', requestType: 'data_export', reason: '' });
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
    }
  };

  const handleProcessRequest = async (requestId: string, action: 'approve' | 'reject' | 'complete') => {
    try {
      await processLgpdRequest(requestId, action, processNotes);
      setProcessNotes('');
    } catch (error) {
      console.error('Erro ao processar solicitação:', error);
    }
  };

  const runComplianceCheck = async () => {
    toast({
      title: "Verificação iniciada",
      description: "Executando verificação automática de compliance..."
    });

    refreshData();
    
    // Simulate compliance check
    setTimeout(() => {
      setRules(prev => prev.map(rule => ({
        ...rule,
        lastChecked: new Date()
      })));

      toast({
        title: "Verificação concluída",
        description: "Todas as regras foram verificadas"
      });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dados de compliance...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Centro de Compliance LGPD</h1>
          <p className="text-muted-foreground">Gestão de conformidade com a Lei Geral de Proteção de Dados</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={runComplianceCheck}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Verificar Compliance
          </Button>
          <Button onClick={() => setShowNewRequestModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Solicitação
          </Button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score Compliance</p>
                <p className="text-3xl font-bold text-green-600">{realComplianceScore}%</p>
                <Progress value={realComplianceScore} className="mt-2" />
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuários com Consentimento</p>
                <p className="text-3xl font-bold">
                  {complianceScore ? `${complianceScore.users_with_consent}/${complianceScore.total_users}` : '0/0'}
                </p>
                <p className="text-sm text-green-600">
                  {complianceScore ? `${Math.round(complianceScore.consent_percentage)}%` : '0%'} de cobertura
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solicitações Pendentes</p>
                <p className="text-3xl font-bold">{pendingRequests}</p>
                {complianceScore && complianceScore.overdue_requests > 0 && (
                  <p className="text-sm text-red-600">{complianceScore.overdue_requests} em atraso</p>
                )}
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Processamento</p>
                <p className="text-3xl font-bold">{processingRequests}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Non-compliant Issues Alert */}
      {(nonCompliantRules > 0 || (complianceScore && complianceScore.overdue_requests > 0)) && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {nonCompliantRules > 0 && `Existem ${nonCompliantRules} regra${nonCompliantRules > 1 ? 's' : ''} não conforme${nonCompliantRules > 1 ? 's' : ''}. `}
            {complianceScore && complianceScore.overdue_requests > 0 && `${complianceScore.overdue_requests} solicitação${complianceScore.overdue_requests > 1 ? 'ões' : ''} em atraso.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Visão Geral' },
          { id: 'rules', label: 'Regras de Compliance' },
          { id: 'requests', label: 'Solicitações LGPD' },
          { id: 'consent', label: 'Consentimentos' }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={selectedTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTab(tab.id)}
            className="flex-1"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Compliance</CardTitle>
              <CardDescription>Estado atual da conformidade LGPD</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Regras Conformes</span>
                  <Badge className="bg-green-100 text-green-800">{compliantRules}/{rules.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Regras Parciais</span>
                  <Badge className="bg-yellow-100 text-yellow-800">{partialRules}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Não Conformes</span>
                  <Badge className="bg-red-100 text-red-800">{nonCompliantRules}</Badge>
                </div>
                {complianceScore && (
                  <>
                    <div className="flex justify-between items-center">
                      <span>Total de Usuários</span>
                      <span className="font-semibold">{complianceScore.total_users}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Com Consentimento</span>
                      <span className="font-semibold">{complianceScore.users_with_consent}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Solicitações Recentes</CardTitle>
              <CardDescription>Últimas solicitações LGPD</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lgpdRequests.slice(0, 5).map((request) => {
                  const TypeIcon = getTypeIcon(request.request_type);
                  return (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{request.user_email}</p>
                          <p className="text-xs text-muted-foreground">{getRequestTypeLabel(request.request_type)}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusLabel(request.status)}
                      </Badge>
                    </div>
                  );
                })}
                {lgpdRequests.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">Nenhuma solicitação encontrada</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === 'rules' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Regras de Compliance</h3>
          {rules.map((rule) => {
            const TypeIcon = getTypeIcon(rule.type);
            return (
              <Card key={rule.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-lg bg-muted">
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold">{rule.name}</h4>
                          <Badge className={getStatusColor(rule.status)}>
                            {rule.status === 'compliant' ? 'Conforme' :
                             rule.status === 'non_compliant' ? 'Não Conforme' : 'Parcial'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Requisito:</span>
                            <p className="text-muted-foreground">{rule.requirement}</p>
                          </div>
                          <div>
                            <span className="font-medium">Implementação:</span>
                            <p className="text-muted-foreground">{rule.implementation}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Última verificação: {rule.lastChecked.toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Solicitações LGPD</h3>
          </div>
          {lgpdRequests.map((request) => {
            const TypeIcon = getTypeIcon(request.request_type);
            return (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-lg bg-muted">
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h4 className="font-medium">{request.user_email}</h4>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusLabel(request.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Tipo: {getRequestTypeLabel(request.request_type)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Solicitado em: {new Date(request.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        {request.reason && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Motivo: {request.reason}
                          </p>
                        )}
                        {request.expires_at && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Expira em: {new Date(request.expires_at).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {request.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleProcessRequest(request.id, 'reject')}
                            disabled={processing}
                          >
                            Rejeitar
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleProcessRequest(request.id, 'approve')}
                            disabled={processing}
                          >
                            Aprovar
                          </Button>
                        </>
                      )}
                      {request.status === 'processing' && (
                        <Button 
                          size="sm"
                          onClick={() => handleProcessRequest(request.id, 'complete')}
                          disabled={processing}
                        >
                          Concluir
                        </Button>
                      )}
                      {request.request_type === 'data_export' && request.status === 'completed' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => exportUserData(request.user_id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Exportar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {lgpdRequests.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma solicitação encontrada</h3>
                <p className="text-muted-foreground">Não há solicitações LGPD registradas no momento.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {selectedTab === 'consent' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Histórico de Consentimentos</h3>
          <Card>
            <CardContent className="p-8 text-center">
              <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sistema de Consentimento Ativo</h3>
              <p className="text-muted-foreground mb-4">
                O sistema de consentimento está funcionando normalmente. Todos os novos usuários fornecem consentimento no registro.
              </p>
              {complianceScore && (
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{complianceScore.users_with_consent}</p>
                    <p className="text-sm text-muted-foreground">Usuários com consentimento</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{Math.round(complianceScore.consent_percentage)}%</p>
                    <p className="text-sm text-muted-foreground">Taxa de consentimento</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Request Modal */}
      <Dialog open={showNewRequestModal} onOpenChange={setShowNewRequestModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Solicitação LGPD</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="userEmail">Email do Usuário</Label>
              <Input
                id="userEmail"
                type="email"
                value={newRequest.userEmail}
                onChange={(e) => setNewRequest(prev => ({ ...prev, userEmail: e.target.value }))}
                placeholder="usuario@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="requestType">Tipo de Solicitação</Label>
              <Select value={newRequest.requestType} onValueChange={(value) => setNewRequest(prev => ({ ...prev, requestType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data_export">Exportação de Dados</SelectItem>
                  <SelectItem value="data_deletion">Exclusão de Dados</SelectItem>
                  <SelectItem value="data_correction">Correção de Dados</SelectItem>
                  <SelectItem value="data_portability">Portabilidade de Dados</SelectItem>
                  <SelectItem value="consent_withdrawal">Retirada de Consentimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reason">Motivo/Justificativa</Label>
              <Textarea
                id="reason"
                value={newRequest.reason}
                onChange={(e) => setNewRequest(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Descreva o motivo da solicitação..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRequestModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateRequest} disabled={creating || !newRequest.userEmail}>
              {creating ? 'Criando...' : 'Criar Solicitação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};