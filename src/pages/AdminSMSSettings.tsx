import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Settings, 
  Wifi, 
  WifiOff, 
  Send, 
  Shield, 
  Activity,
  MessageSquare,
  Users,
  CreditCard
} from "lucide-react";

const AdminSMSSettings = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Teste de conexão SMS - " + new Date().toLocaleString());
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSent: 0,
    totalFailed: 0,
    totalUsers: 0,
    totalCreditsUsed: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    checkConnectionStatus();
    fetchStats();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      // Simular verificação de conexão
      // Em produção, faria uma chamada para testar as credenciais
      setIsConnected(true); // Por enquanto assumimos que está conectado
    } catch (error) {
      setIsConnected(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Buscar estatísticas de SMS
      const [sentLogs, users, totalCredits] = await Promise.all([
        supabase.from('sms_logs').select('status, cost_credits'),
        supabase.from('profiles').select('id').gte('created_at', '2025-01-01'),
        supabase.from('sms_logs').select('cost_credits')
      ]);

      const totalSent = sentLogs.data?.filter(log => log.status === 'sent').length || 0;
      const totalFailed = sentLogs.data?.filter(log => log.status === 'failed').length || 0;
      const totalUsers = users.data?.length || 0;
      const totalCreditsUsed = totalCredits.data?.reduce((acc, log) => acc + (log.cost_credits || 0), 0) || 0;

      setStats({
        totalSent,
        totalFailed,
        totalUsers,
        totalCreditsUsed
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const testConnection = async () => {
    if (!testPhone.trim()) {
      toast({
        title: "Número obrigatório",
        description: "Digite um número para testar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Criar campanha de teste
      const { data: campaign, error: campaignError } = await supabase
        .from('sms_campaigns')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          name: 'Teste de Conexão SMS',
          message: testMessage,
          total_recipients: 1,
          status: 'sending'
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Enviar SMS de teste
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          campaignId: campaign.id,
          recipients: [testPhone.startsWith('+') ? testPhone : `+244${testPhone}`],
          message: testMessage
        }
      });

      if (error) throw error;

      if (data.totalSent > 0) {
        toast({
          title: "✅ Conexão bem-sucedida!",
          description: `SMS teste enviado para ${testPhone}`,
        });
        setIsConnected(true);
      } else {
        throw new Error("Falha no envio do SMS");
      }

    } catch (error: any) {
      console.error('Test error:', error);
      toast({
        title: "❌ Falha na conexão",
        description: error.message || "Verifique as credenciais",
        variant: "destructive",
      });
      setIsConnected(false);
    } finally {
      setLoading(false);
      fetchStats(); // Atualizar estatísticas
    }
  };

  const configCards = [
    {
      title: "Status da Conexão",
      value: isConnected ? "Conectado" : "Desconectado",
      icon: isConnected ? Wifi : WifiOff,
      color: isConnected ? "text-green-600" : "text-red-600",
      bg: isConnected ? "bg-green-50" : "bg-red-50"
    },
    {
      title: "SMS Enviados",
      value: stats.totalSent.toLocaleString(),
      icon: MessageSquare,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Taxa de Sucesso",
      value: stats.totalSent + stats.totalFailed > 0 
        ? Math.round((stats.totalSent / (stats.totalSent + stats.totalFailed)) * 100) + "%"
        : "0%",
      icon: Activity,
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      title: "Créditos Consumidos",
      value: stats.totalCreditsUsed.toLocaleString(),
      icon: CreditCard,
      color: "text-purple-600",
      bg: "bg-purple-50"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Configurações SMS</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie a integração com o gateway BulkSMS
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {configCards.map((card, index) => (
          <Card key={index} className={`${card.bg} border-0`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gateway Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Gateway BulkSMS</span>
            </CardTitle>
            <CardDescription>
              Configuração da integração com BulkSMS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Status do Gateway</p>
                <p className="text-sm text-muted-foreground">
                  Conexão com api.bulksms.com
                </p>
              </div>
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Conectado" : "Desconectado"}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="font-medium">Informações da Conta</p>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome:</span>
                  <span>SMSao</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Endpoint:</span>
                  <span className="font-mono text-xs">api.bulksms.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token ID:</span>
                  <span className="font-mono text-xs">F3F6...8883-02-A</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="font-medium">Configurações</p>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custo por SMS:</span>
                  <span>1 crédito</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remetente:</span>
                  <span>SMSao</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Formato:</span>
                  <span>Texto (160 chars)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="h-5 w-5" />
              <span>Testar Conexão</span>
            </CardTitle>
            <CardDescription>
              Envie um SMS de teste para verificar a configuração
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="testPhone">Número de Teste</Label>
              <Input
                id="testPhone"
                placeholder="Ex: 923456789 ou +244923456789"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Digite um número angolano para teste
              </p>
            </div>

            <div>
              <Label htmlFor="testMessage">Mensagem de Teste</Label>
              <Input
                id="testMessage"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {testMessage.length}/160 caracteres
              </p>
            </div>

            <Button
              onClick={testConnection}
              disabled={loading}
              className="w-full btn-gradient"
            >
              {loading ? "Enviando..." : "Enviar SMS Teste"}
            </Button>

            <div className="text-xs text-muted-foreground">
              <p>⚠️ Este teste consumirá 1 crédito da sua conta</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Estatísticas de Uso</span>
          </CardTitle>
          <CardDescription>
            Dados de utilização do sistema SMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.totalSent}
              </div>
              <p className="text-sm text-muted-foreground">SMS Enviados</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.totalFailed}
              </div>
              <p className="text-sm text-muted-foreground">SMS Falharam</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalUsers}
              </div>
              <p className="text-sm text-muted-foreground">Usuários Ativos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSMSSettings;