import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Server, Eye, EyeOff, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SMTPSettings {
  id?: string;
  host: string;
  port: number;
  username: string;
  password: string;
  use_tls: boolean;
  from_name: string;
  from_email: string;
  is_active: boolean;
  last_tested_at?: string;
  test_status?: 'success' | 'failed' | 'pending';
}

interface TestLog {
  id: string;
  test_email: string;
  status: 'success' | 'failed';
  error_message?: string;
  response_time_ms?: number;
  tested_at: string;
}

const AdminSMTPSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [testLogs, setTestLogs] = useState<TestLog[]>([]);

  const [formData, setFormData] = useState<SMTPSettings>({
    host: '',
    port: 587,
    username: '',
    password: '',
    use_tls: true,
    from_name: 'SMS Marketing Angola',
    from_email: '',
    is_active: true
  });

  useEffect(() => {
    fetchSMTPSettings();
    fetchTestLogs();
  }, []);

  const fetchSMTPSettings = async () => {
    try {
      // Security: Use masked RPC function to avoid exposing encrypted passwords
      const { data, error } = await supabase
        .rpc('get_masked_smtp_settings');

      if (error) throw error;

      // Get the active setting from the masked results
      const activeSetting = data?.find((setting: any) => setting.is_active);
      
      if (activeSetting) {
        setIsConfigured(true);
        setFormData({
          ...data,
          password: '••••••••', // Mask password
          test_status: data.test_status as 'success' | 'failed' | 'pending' | undefined
        });
      }
    } catch (error: any) {
      console.error('Error fetching SMTP settings:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTestLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('smtp_test_logs')
        .select('*')
        .order('tested_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTestLogs((data || []).map(log => ({
        ...log,
        status: log.status as 'success' | 'failed'
      })));
    } catch (error: any) {
      console.error('Error fetching test logs:', error);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.host) errors.push("Host é obrigatório");
    if (!formData.port || formData.port < 1 || formData.port > 65535) {
      errors.push("Porta deve estar entre 1 e 65535");
    }
    if (!formData.username || !formData.username.includes('@')) {
      errors.push("Username deve ser um e-mail válido");
    }
    if (!formData.password || formData.password === '••••••••') {
      errors.push("Senha é obrigatória");
    }
    if (!formData.from_email || !formData.from_email.includes('@')) {
      errors.push("E-mail do remetente deve ser válido");
    }

    return errors;
  };

  const handleSave = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast({
        title: "Erro de validação",
        description: validationErrors.join(', '),
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Encrypt password
      const { data: encryptedPassword, error: encryptError } = await supabase
        .rpc('encrypt_smtp_password', { password_text: formData.password });

      if (encryptError) throw encryptError;

      const smtpData = {
        ...formData,
        password_encrypted: encryptedPassword,
        created_by: user?.id,
        updated_at: new Date().toISOString()
      };

      const { password, ...dataToSave } = smtpData;

      let result;
      if (formData.id) {
        // Update existing
        result = await supabase
          .from('smtp_settings')
          .update(dataToSave)
          .eq('id', formData.id);
      } else {
        // Create new
        result = await supabase
          .from('smtp_settings')
          .insert([dataToSave]);
      }

      if (result.error) throw result.error;

      setIsConfigured(true);
      toast({
        title: "Configurações salvas",
        description: "As configurações SMTP foram salvas com sucesso.",
      });

      fetchSMTPSettings();
    } catch (error: any) {
      console.error('Error saving SMTP settings:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!user?.email) {
      toast({
        title: "Erro",
        description: "E-mail do usuário não encontrado.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-smtp', {
        body: {
          test_email: user.email,
          smtp_settings: formData
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Teste bem-sucedido",
          description: `E-mail de teste enviado para ${user.email}`,
        });
      } else {
        toast({
          title: "Teste falhou",
          description: data.error || "Erro desconhecido",
          variant: "destructive",
        });
      }

      fetchTestLogs();
      fetchSMTPSettings();
    } catch (error: any) {
      console.error('Error testing SMTP:', error);
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (configured: boolean, status?: string) => {
    if (!configured) {
      return <Badge variant="destructive">Não Configurado</Badge>;
    }
    
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Configurado</Badge>;
      case 'failed':
        return <Badge variant="destructive">Erro na Conexão</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações SMTP</h1>
          <p className="text-muted-foreground">
            Configure o servidor SMTP para envio de e-mails da plataforma
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          {getStatusBadge(isConfigured, formData.test_status)}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Configurações do Servidor SMTP
          </CardTitle>
          <CardDescription>
            Configure os detalhes de conexão com o servidor SMTP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="host">Host SMTP</Label>
              <Input
                id="host"
                placeholder="smtp.gmail.com"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="port">Porta</Label>
              <Input
                id="port"
                type="number"
                placeholder="587"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 587 })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário (E-mail)</Label>
              <Input
                id="username"
                type="email"
                placeholder="admin@empresa.com"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="use_tls"
              checked={formData.use_tls}
              onCheckedChange={(checked) => setFormData({ ...formData, use_tls: checked })}
            />
            <Label htmlFor="use_tls">Usar TLS/SSL</Label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from_name">Nome do Remetente</Label>
              <Input
                id="from_name"
                placeholder="SMS Marketing Angola"
                value={formData.from_name}
                onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="from_email">E-mail do Remetente</Label>
              <Input
                id="from_email"
                type="email"
                placeholder="noreply@empresa.com"
                value={formData.from_email}
                onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleTest} disabled={testing || saving} variant="outline">
              {testing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Testando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Testar Conexão
                </>
              )}
            </Button>
            
            <Button onClick={handleSave} disabled={saving || testing}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Salvando...
                </>
              ) : (
                "Salvar Configurações"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {testLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Testes</CardTitle>
            <CardDescription>
              Últimos testes de conexão SMTP realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>E-mail de Teste</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tempo de Resposta</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className="capitalize">{log.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>{log.test_email}</TableCell>
                    <TableCell>
                      {new Date(log.tested_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {log.response_time_ms ? `${log.response_time_ms}ms` : '-'}
                    </TableCell>
                    <TableCell>
                      {log.error_message && (
                        <span className="text-sm text-red-600 truncate max-w-xs" title={log.error_message}>
                          {log.error_message}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminSMTPSettings;