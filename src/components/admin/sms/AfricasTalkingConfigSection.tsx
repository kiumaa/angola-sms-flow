import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  TestTube, 
  Save, 
  CheckCircle,
  WifiOff,
  AlertTriangle,
  Smartphone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AfricasTalkingConfig {
  active: boolean;
  username: string;
  defaultSender: string;
  status: 'connected' | 'error' | 'disconnected';
  balance?: { credits: number; currency: string };
  error?: string;
  lastTested?: string;
}

interface AfricasTalkingConfigSectionProps {
  config: AfricasTalkingConfig;
  onSave: (config: AfricasTalkingConfig) => Promise<void>;
  saving: boolean;
}

export default function AfricasTalkingConfigSection({ 
  config, 
  onSave, 
  saving 
}: AfricasTalkingConfigSectionProps) {
  const [localConfig, setLocalConfig] = useState(config);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const testConnection = async () => {
    setTesting(true);

    try {
      const { data, error } = await supabase.functions.invoke('gateway-status', {
        body: { gateway: 'africastalking' }
      });

      if (error) throw error;

      // Atualizar status local
      setLocalConfig(prev => ({
        ...prev,
        status: data.status === 'active' ? 'connected' : 'error',
        balance: data.balance,
        error: data.error,
        lastTested: new Date().toISOString()
      }));

      if (data.status === 'active') {
        toast({
          title: "✅ Conexão bem-sucedida",
          description: `Africa's Talking está funcionando corretamente. Saldo: ${data.balance?.credits || 0} ${data.balance?.currency || 'USD'}`
        });
      } else {
        toast({
          title: "❌ Falha na conexão",
          description: data.error || "Erro na conexão com Africa's Talking",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Erro ao testar Africa\'s Talking:', error);
      
      setLocalConfig(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
        lastTested: new Date().toISOString()
      }));

      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    await onSave(localConfig);
  };

  const getStatusIcon = () => {
    switch (localConfig.status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <WifiOff className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusText = () => {
    switch (localConfig.status) {
      case 'connected':
        return 'Conectado';
      case 'error':
        return 'Erro';
      default:
        return 'Desconectado';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Smartphone className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Configuração SMS</h2>
          <p className="text-muted-foreground">
            Configuração do Africa's Talking como provedor SMS exclusivo
          </p>
        </div>
      </div>

      {/* Main Configuration Card */}
      <Card className="relative">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div>
                <CardTitle className="text-xl">Africa's Talking</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Provedor SMS para o mercado africano
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Label htmlFor="at-active" className="text-sm font-medium">
                Ativo
              </Label>
              <Switch
                id="at-active"
                checked={localConfig.active}
                onCheckedChange={(checked) => 
                  setLocalConfig(prev => ({ ...prev, active: checked }))
                }
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status e Saldo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <div className="mt-1">
                <Badge 
                  variant={localConfig.status === 'connected' ? 'default' : 'destructive'}
                  className={localConfig.status === 'connected' ? 'bg-green-600' : ''}
                >
                  {getStatusText()}
                </Badge>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Saldo</Label>
              <div className="mt-1">
                <span className="text-sm font-mono">
                  {localConfig.balance ? 
                    `${localConfig.balance.credits} ${localConfig.balance.currency}` : 
                    'N/A'
                  }
                </span>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Último teste</Label>
              <div className="mt-1">
                <span className="text-xs text-muted-foreground">
                  {localConfig.lastTested ? 
                    new Date(localConfig.lastTested).toLocaleString('pt-BR') : 
                    'Nunca'
                  }
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Configurações */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="at-username" className="text-sm font-medium">
                  Username *
                </Label>
                <Input
                  id="at-username"
                  value={localConfig.username}
                  onChange={(e) => 
                    setLocalConfig(prev => ({ ...prev, username: e.target.value }))
                  }
                  placeholder="kiumaf"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Username do sua conta Africa's Talking
                </p>
              </div>
              
              <div>
                <Label htmlFor="at-sender" className="text-sm font-medium">
                  Sender ID Padrão
                </Label>
                <Input
                  id="at-sender"
                  value={localConfig.defaultSender}
                  onChange={(e) => 
                    setLocalConfig(prev => ({ ...prev, defaultSender: e.target.value }))
                  }
                  placeholder="SHORTCODE"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ID do remetente aprovado no Africa's Talking
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">API Key</Label>
              <div className="mt-1 space-y-2">
                <Input 
                  type="password" 
                  value="***" 
                  disabled 
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Configurado via secrets do Supabase (AT_API_KEY)
                </p>
              </div>
            </div>
          </div>

          {/* Mensagem de erro se houver */}
          {localConfig.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start space-x-2">
                <WifiOff className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm text-red-600 font-medium">Erro de conexão:</p>
                  <p className="text-sm text-red-600">{localConfig.error}</p>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={testConnection}
              disabled={testing || !localConfig.username}
              variant="outline"
              className="flex-1"
            >
              {testing ? (
                <TestTube className="h-4 w-4 mr-2 animate-pulse" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              {testing ? 'Testando...' : 'Testar Conexão'}
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving || !localConfig.username}
              className="flex-1"
            >
              {saving ? (
                <Save className="h-4 w-4 mr-2 animate-pulse" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-blue-900">
                Configuração dos Secrets
              </h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <code className="bg-blue-100 px-1 rounded">AT_USERNAME</code>: {localConfig.username || 'kiumaf'}</p>
                <p>• <code className="bg-blue-100 px-1 rounded">AT_API_KEY</code>: Configurado via painel Supabase</p>
              </div>
              <p className="text-xs text-blue-600">
                Os secrets devem ser configurados no painel do Supabase para funcionamento completo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}