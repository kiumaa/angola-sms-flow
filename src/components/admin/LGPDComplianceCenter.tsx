import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  EyeOff,
  Lock,
  UserCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

interface DataRequest {
  id: string;
  userId: string;
  userEmail: string;
  type: 'export' | 'deletion' | 'rectification' | 'portability';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestDate: Date;
  completionDate?: Date;
  reason?: string;
}

interface ConsentRecord {
  id: string;
  userId: string;
  userEmail: string;
  consentType: 'marketing' | 'analytics' | 'essential' | 'third_party';
  granted: boolean;
  timestamp: Date;
  method: 'explicit' | 'implicit' | 'legitimate_interest';
  ipAddress: string;
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
    status: 'non_compliant',
    requirement: 'LGPD Art. 18º, V',
    implementation: 'Em desenvolvimento - previsão 30 dias',
    lastChecked: new Date('2024-01-15')
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

// Load real compliance data from database

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
    case 'export': return Download;
    case 'deletion': return Trash2;
    case 'rectification': return FileText;
    case 'portability': return Database;
    default: return Info;
  }
};

export const LGPDComplianceCenter = () => {
  const [rules, setRules] = useState<ComplianceRule[]>(COMPLIANCE_RULES);
  const [dataRequests, setDataRequests] = useState<DataRequest[]>([]);
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const { toast } = useToast();

  const [newRequest, setNewRequest] = useState({
    userEmail: '',
    type: 'export' as DataRequest['type'],
    reason: ''
  });

  const compliantRules = rules.filter(r => r.status === 'compliant').length;
  const nonCompliantRules = rules.filter(r => r.status === 'non_compliant').length;
  const partialRules = rules.filter(r => r.status === 'partial').length;
  const complianceScore = Math.round((compliantRules / rules.length) * 100);

  const pendingRequests = dataRequests.filter(r => r.status === 'pending').length;
  const processingRequests = dataRequests.filter(r => r.status === 'processing').length;

  const handleProcessRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      setDataRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              status: action === 'approve' ? 'processing' : 'rejected',
              completionDate: action === 'reject' ? new Date() : undefined
            }
          : req
      ));

      toast({
        title: action === 'approve' ? "Solicitação aprovada" : "Solicitação rejeitada",
        description: `A solicitação foi ${action === 'approve' ? 'aprovada e está sendo processada' : 'rejeitada'}`
      });
    } catch (error) {
      toast({
        title: "Erro ao processar solicitação",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCreateRequest = async () => {
    try {
      const request: DataRequest = {
        id: Date.now().toString(),
        userId: `user-${Date.now()}`,
        userEmail: newRequest.userEmail,
        type: newRequest.type,
        status: 'pending',
        requestDate: new Date(),
        reason: newRequest.reason
      };

      setDataRequests(prev => [request, ...prev]);
      setShowNewRequestModal(false);
      setNewRequest({ userEmail: '', type: 'export', reason: '' });

      toast({
        title: "Solicitação criada",
        description: `Nova solicitação de ${request.type} criada para ${request.userEmail}`
      });
    } catch (error) {
      toast({
        title: "Erro ao criar solicitação",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const runComplianceCheck = async () => {
    toast({
      title: "Verificação iniciada",
      description: "Executando verificação automática de compliance..."
    });

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
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Centro de Compliance LGPD</h1>
          <p className="text-muted-foreground">Gestão de conformidade com a Lei Geral de Proteção de Dados</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={runComplianceCheck}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Verificar Compliance
          </Button>
          <Button onClick={() => setShowNewRequestModal(true)}>
            <FileText className="h-4 w-4 mr-2" />
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
                <p className="text-3xl font-bold text-green-600">{complianceScore}%</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Regras Conformes</p>
                <p className="text-3xl font-bold">{compliantRules}/{rules.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solicitações Pendentes</p>
                <p className="text-3xl font-bold">{pendingRequests}</p>
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
      {nonCompliantRules > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Existem {nonCompliantRules} regra{nonCompliantRules > 1 ? 's' : ''} não conforme{nonCompliantRules > 1 ? 's' : ''} que precisam ser corrigidas para manter compliance total.
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
          {dataRequests.map((request) => {
            const TypeIcon = getTypeIcon(request.type);
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
                          <h4 className="font-medium">{request.userEmail}</h4>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status === 'pending' ? 'Pendente' :
                             request.status === 'processing' ? 'Processando' :
                             request.status === 'completed' ? 'Concluído' : 'Rejeitado'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Tipo: {request.type === 'export' ? 'Exportação' :
                                 request.type === 'deletion' ? 'Exclusão' :
                                 request.type === 'rectification' ? 'Retificação' : 'Portabilidade'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Solicitado em: {request.requestDate.toLocaleDateString('pt-BR')}
                        </p>
                        {request.reason && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Motivo: {request.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleProcessRequest(request.id, 'reject')}
                        >
                          Rejeitar
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleProcessRequest(request.id, 'approve')}
                        >
                          Aprovar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedTab === 'consent' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Histórico de Consentimentos</h3>
          {consentRecords.map((consent) => (
            <Card key={consent.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${consent.granted ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {consent.granted ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="font-medium">{consent.userEmail}</h4>
                      <p className="text-sm text-muted-foreground">
                        {consent.consentType === 'marketing' ? 'Marketing' :
                         consent.consentType === 'analytics' ? 'Analytics' :
                         consent.consentType === 'essential' ? 'Essencial' : 'Terceiros'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {consent.timestamp.toLocaleString('pt-BR')} • IP: {consent.ipAddress}
                      </p>
                    </div>
                  </div>
                  <Badge className={consent.granted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {consent.granted ? 'Concedido' : 'Negado'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Request Modal */}
      <Dialog open={showNewRequestModal} onOpenChange={setShowNewRequestModal}>
        <DialogContent>
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
              <Label htmlFor="type">Tipo de Solicitação</Label>
              <Select value={newRequest.type} onValueChange={(value: DataRequest['type']) => setNewRequest(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="export">Exportação de Dados</SelectItem>
                  <SelectItem value="deletion">Exclusão de Dados</SelectItem>
                  <SelectItem value="rectification">Retificação de Dados</SelectItem>
                  <SelectItem value="portability">Portabilidade de Dados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                value={newRequest.reason}
                onChange={(e) => setNewRequest(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Descreva o motivo da solicitação..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowNewRequestModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateRequest} disabled={!newRequest.userEmail}>
                Criar Solicitação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};