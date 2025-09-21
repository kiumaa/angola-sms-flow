import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, TestTube, CheckCircle, XCircle, Clock, Zap } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import CountryCodeSelector from '@/components/admin/CountryCodeSelector';
import SMSFunctionalityTest from '@/components/admin/SMSFunctionalityTest';
import { SMSDiagnosticsPanel } from '@/components/admin/SMSDiagnosticsPanel';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TestResult {
  id: string;
  timestamp: string;
  phone: string;
  message: string;
  status: 'success' | 'failed' | 'pending';
  gateway: string;
  credits_used: number;
  response_time: number;
  error?: string;
  bulksms_id?: string;
}

const AdminSMSTest = () => {
  const [countryCode, setCountryCode] = useState('+244');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [selectedGateway, setSelectedGateway] = useState<string>('auto');
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
        
        setIsAdmin(!!roles);
      }
    };
    checkUserRole();
  }, []);

  const handleQuickTestAngola = () => {
    setCountryCode('+244');
    setPhoneNumber('912345678');
    setMessage('Teste SMS Angola - Sistema funcionando corretamente! 🚀');
  };

  const handleQuickTestPortugal = () => {
    setCountryCode('+351');
    setPhoneNumber('912536682');
    setMessage('Teste SMS Portugal - Verificação internacional do sistema SMS AO. 🇵🇹');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const fullPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : countryCode + phoneNumber;
    
    if (!phoneNumber.trim()) {
      toast({
        title: "Número obrigatório",
        description: "Por favor, insira um número de telefone",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Mensagem obrigatória",
        description: "Por favor, digite uma mensagem para enviar",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('Usuário não autenticado');
      }

      // Send test SMS using selected gateway or auto-selection
      const { data, error } = await supabase.functions.invoke('send-quick-sms', {
        body: {
          recipients: [fullPhoneNumber],
          message: message.trim(),
          sender_id: 'SMSAO',
          gateway: selectedGateway === 'auto' ? undefined : selectedGateway
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (error) throw error;

      const success = data.success && data.sent > 0;
      
      // Add result to the list
      const newResult: TestResult = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        phone: fullPhoneNumber,
        message: message.trim(),
        status: success ? 'success' : 'failed',
        gateway: data.gateway_used || selectedGateway,
        credits_used: data.credits_debited || 0,
        response_time: responseTime,
        error: success ? undefined : (data.error || 'Unknown error'),
        bulksms_id: data.job_id
      };

      setResults(prev => [newResult, ...prev]);

      toast({
        title: success ? "✅ SMS Enviado com Sucesso!" : "❌ Falha no Envio",
        description: success 
          ? `Enviado para ${fullPhoneNumber}. ${data.credits_debited} créditos gastos.`
          : `Erro: ${data.error || 'Falha na comunicação com gateway'}`,
        variant: success ? "default" : "destructive",
      });

      // Clear form on success
      if (success) {
        setPhoneNumber('');
        setMessage('');
        setSelectedGateway('auto');
      }

    } catch (error: any) {
      console.error('Erro no teste:', error);
      
      const failedResult: TestResult = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        phone: fullPhoneNumber,
        message: message.trim(),
        status: 'failed',
        gateway: 'System',
        credits_used: 0,
        response_time: Date.now() - startTime,
        error: error.message || 'Erro de sistema'
      };

      setResults(prev => [failedResult, ...prev]);

      toast({
        title: "❌ Erro no Teste",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Sucesso</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Falhou</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8">
        <Alert>
          <AlertDescription>
            Acesso negado. Esta página é apenas para administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 bg-gradient-hero">
        <h1 className="text-3xl font-light gradient-text flex items-center">
          <TestTube className="h-8 w-8 mr-3" />
          Teste de SMS Gateway
        </h1>
        <p className="text-muted-foreground mt-2">
          Teste a funcionalidade completa do sistema de envio de SMS
        </p>
      </div>

      {/* Tabs for different test types */}
      <Tabs defaultValue="comprehensive" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comprehensive">Teste Completo</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnósticos</TabsTrigger>
          <TabsTrigger value="manual">Teste Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="comprehensive" className="space-y-6">
          <SMSFunctionalityTest />
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-6">
          <SMSDiagnosticsPanel />
        </TabsContent>
        
        <TabsContent value="manual" className="space-y-6">

      {/* Test Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Send className="h-5 w-5 mr-2" />
            Enviar SMS de Teste
          </CardTitle>
          <CardDescription>
            Teste o envio de SMS através do gateway configurado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Código do País</Label>
                <CountryCodeSelector
                  value={countryCode}
                  onValueChange={setCountryCode}
                  isAdmin={true}
                  placeholder="Selecionar país"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Número de Telefone</Label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 bg-muted rounded-md text-sm font-medium">
                    {countryCode}
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={countryCode === '+244' ? '912345678' : 'Número local'}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gateway">Gateway SMS</Label>
                <Select value={selectedGateway} onValueChange={setSelectedGateway}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">🤖 Automático</SelectItem>
                    <SelectItem value="bulksms">📱 BulkSMS</SelectItem>
                    <SelectItem value="bulkgate">🚀 BulkGate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem de teste aqui..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/160 caracteres
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar SMS de Teste
                  </>
                )}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleQuickTestAngola}
                disabled={isLoading}
                className="w-full"
              >
                <Zap className="h-4 w-4 mr-2" />
                Teste Angola
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleQuickTestPortugal}
                disabled={isLoading}
                className="w-full"
              >
                <Zap className="h-4 w-4 mr-2" />
                Teste Portugal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Testes</CardTitle>
            <CardDescription>
              Resultados dos últimos testes realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="glass-card p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(result.status)}
                      <span className="text-sm font-medium">{result.gateway}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(result.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                     <div className="text-right">
                      <p className="text-sm font-medium">{result.response_time}ms</p>
                      <p className="text-xs text-muted-foreground">
                        {result.credits_used} créditos
                      </p>
                      {result.status === 'success' && (
                        <Badge variant="outline" className="text-xs mt-1">
                          ✓ Enviado
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Destinatário:</p>
                      <p className="font-medium">{result.phone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Mensagem:</p>
                      <p className="font-medium truncate">{result.message}</p>
                    </div>
                  </div>

                  {result.error && (
                    <>
                      <Separator className="my-3" />
                      <div className="text-sm">
                        <p className="text-muted-foreground">Erro:</p>
                        <p className="text-red-600 font-medium">{result.error}</p>
                      </div>
                    </>
                  )}

                  {result.bulksms_id && (
                    <>
                      <Separator className="my-3" />
                      <div className="text-sm">
                        <p className="text-muted-foreground">ID do Job:</p>
                        <p className="font-mono text-xs">{result.bulksms_id}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSMSTest;