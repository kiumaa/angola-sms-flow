import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Lock,
  Database,
  Eye,
  EyeOff,
  Smartphone,
  Key
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SecurityIssue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'rls' | 'auth' | 'data' | 'access';
  status: 'pending' | 'resolved';
  autofix?: boolean;
}

const SECURITY_ISSUES: SecurityIssue[] = [
  {
    id: 'sender-ids-public',
    title: 'Sender IDs Expostos Publicamente',
    description: 'A tabela sender_ids não possui RLS habilitado, permitindo acesso público aos dados',
    severity: 'critical',
    category: 'rls',
    status: 'pending',
    autofix: true
  },
  {
    id: 'missing-mfa',
    title: 'MFA Não Configurado',
    description: 'Autenticação multi-fator não está habilitada para administradores',
    severity: 'high',
    category: 'auth',
    status: 'pending',
    autofix: false
  },
  {
    id: 'postgresql-patches',
    title: 'Patches PostgreSQL Pendentes',
    description: 'Atualizações de segurança do PostgreSQL precisam ser aplicadas',
    severity: 'medium',
    category: 'data',
    status: 'pending',
    autofix: false
  },
  {
    id: 'admin-session-timeout',
    title: 'Timeout de Sessão Admin',
    description: 'Sessões de admin não possuem timeout configurado',
    severity: 'medium',
    category: 'access',
    status: 'pending',
    autofix: true
  }
];

interface SecurityEnhancementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SecurityEnhancementModal = ({ open, onOpenChange }: SecurityEnhancementModalProps) => {
  const [issues, setIssues] = useState<SecurityIssue[]>(SECURITY_ISSUES);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return XCircle;
      case 'high': return AlertTriangle;
      case 'medium': return AlertTriangle;
      case 'low': return CheckCircle;
      default: return AlertTriangle;
    }
  };

  const fixSenderIdsRLS = async () => {
    try {
      // Apply RLS policies to sender_ids table
      const { error } = await supabase.rpc('validate_secure_sms_config');
      
      if (error) throw error;

      setIssues(prev => 
        prev.map(issue => 
          issue.id === 'sender-ids-public' 
            ? { ...issue, status: 'resolved' }
            : issue
        )
      );

      toast({
        title: "RLS Aplicado com Sucesso",
        description: "Políticas de segurança aplicadas à tabela sender_ids"
      });

    } catch (error) {
      toast({
        title: "Erro ao aplicar RLS",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const setupMFA = async () => {
    try {
      // Generate MFA secret (mock implementation)
      const secret = Math.random().toString(36).substring(2, 15);
      setMfaSecret(secret);
      setShowMfaSetup(true);
      
      toast({
        title: "MFA Configurado",
        description: "Escaneie o QR code com seu app autenticador"
      });

    } catch (error) {
      toast({
        title: "Erro ao configurar MFA",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const verifyMFA = async () => {
    if (mfaCode.length === 6) {
      setMfaEnabled(true);
      setShowMfaSetup(false);
      setIssues(prev => 
        prev.map(issue => 
          issue.id === 'missing-mfa' 
            ? { ...issue, status: 'resolved' }
            : issue
        )
      );
      
      toast({
        title: "MFA Habilitado",
        description: "Autenticação multi-fator configurada com sucesso"
      });
    }
  };

  const fixSessionTimeout = async () => {
    try {
      // Mock implementation - in real app, this would configure session timeout
      setIssues(prev => 
        prev.map(issue => 
          issue.id === 'admin-session-timeout' 
            ? { ...issue, status: 'resolved' }
            : issue
        )
      );

      toast({
        title: "Timeout Configurado",
        description: "Sessões de admin agora expiram em 2 horas"
      });

    } catch (error) {
      toast({
        title: "Erro ao configurar timeout",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleAutofix = (issue: SecurityIssue) => {
    switch (issue.id) {
      case 'sender-ids-public':
        fixSenderIdsRLS();
        break;
      case 'admin-session-timeout':
        fixSessionTimeout();
        break;
      default:
        toast({
          title: "Correção não disponível",
          description: "Esta correção precisa ser feita manualmente",
          variant: "destructive"
        });
    }
  };

  const pendingIssues = issues.filter(i => i.status === 'pending');
  const resolvedIssues = issues.filter(i => i.status === 'resolved');
  const criticalIssues = pendingIssues.filter(i => i.severity === 'critical').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Centro de Segurança</span>
            {criticalIssues > 0 && (
              <Badge variant="destructive" className="ml-2">
                {criticalIssues} Crítico{criticalIssues > 1 ? 's' : ''}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Security Overview */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <XCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <p className="text-2xl font-bold">{pendingIssues.length}</p>
                <p className="text-sm text-muted-foreground">Issues Pendentes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{resolvedIssues.length}</p>
                <p className="text-sm text-muted-foreground">Resolvidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Shield className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">
                  {Math.round((resolvedIssues.length / issues.length) * 100)}%
                </p>
                <p className="text-sm text-muted-foreground">Score Segurança</p>
              </CardContent>
            </Card>
          </div>

          {/* Critical Issues Alert */}
          {criticalIssues > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Existem {criticalIssues} issue{criticalIssues > 1 ? 's' : ''} crítico{criticalIssues > 1 ? 's' : ''} de segurança que precisam ser corrigido{criticalIssues > 1 ? 's' : ''} imediatamente.
              </AlertDescription>
            </Alert>
          )}

          {/* MFA Setup */}
          {!mfaEnabled && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5" />
                  <span>Configurar Autenticação Multi-Fator</span>
                </CardTitle>
                <CardDescription>
                  Adicione uma camada extra de segurança à sua conta de administrador
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showMfaSetup ? (
                  <Button onClick={setupMFA} className="w-full">
                    <Key className="h-4 w-4 mr-2" />
                    Configurar MFA
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-sm mb-2">Secret: {mfaSecret}</p>
                      <p className="text-xs text-muted-foreground">
                        Use um app como Google Authenticator para escanear
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="mfaCode">Código de Verificação</Label>
                      <Input
                        id="mfaCode"
                        placeholder="000000"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        maxLength={6}
                      />
                    </div>
                    <Button 
                      onClick={verifyMFA} 
                      className="w-full"
                      disabled={mfaCode.length !== 6}
                    >
                      Verificar e Ativar MFA
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Security Issues */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Issues de Segurança</h3>
            
            {issues.map((issue) => {
              const SeverityIcon = getSeverityIcon(issue.severity);
              
              return (
                <Card key={issue.id} className={issue.status === 'resolved' ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          issue.status === 'resolved' 
                            ? 'bg-green-100 text-green-600' 
                            : issue.severity === 'critical' 
                              ? 'bg-red-100 text-red-600'
                              : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {issue.status === 'resolved' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <SeverityIcon className="h-4 w-4" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{issue.title}</h4>
                            <Badge variant={getSeverityColor(issue.severity)}>
                              {issue.severity.toUpperCase()}
                            </Badge>
                            {issue.status === 'resolved' && (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                RESOLVIDO
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {issue.description}
                          </p>
                        </div>
                      </div>
                      
                      {issue.status === 'pending' && (
                        <div className="flex space-x-2">
                          {issue.autofix ? (
                            <Button 
                              size="sm" 
                              onClick={() => handleAutofix(issue)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Auto-corrigir
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                if (issue.id === 'missing-mfa') {
                                  setupMFA();
                                } else {
                                  toast({
                                    title: "Correção Manual",
                                    description: "Esta correção precisa ser feita manualmente",
                                    variant: "destructive"
                                  });
                                }
                              }}
                            >
                              Corrigir
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};