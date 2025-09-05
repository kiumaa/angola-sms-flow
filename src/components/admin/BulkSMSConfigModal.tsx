import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Loader2, Key, Shield } from 'lucide-react';

interface BulkSMSConfigModalProps {
  onConfigured?: () => void;
}

export default function BulkSMSConfigModal({ onConfigured }: BulkSMSConfigModalProps) {
  const [open, setOpen] = useState(false);
  const [tokenId, setTokenId] = useState('');
  const [tokenSecret, setTokenSecret] = useState('');
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const testAndSaveCredentials = async () => {
    if (!tokenId || !tokenSecret) {
      toast({
        title: "Dados Incompletos",
        description: "Preencha o Token ID e Token Secret do BulkSMS",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);

    try {
      // Testar as credenciais primeiro
      const { data, error } = await supabase.functions.invoke('bulksms-balance', {
        body: {
          tokenId,
          tokenSecret
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Teste Bem-sucedido",
          description: `Conexão estabelecida. Saldo: $${data.balance}`,
        });

        // Instruir o usuário sobre como configurar os secrets
        toast({
          title: "Configuração de Secrets",
          description: "Configure BULKSMS_TOKEN_ID e BULKSMS_TOKEN_SECRET nos Supabase Secrets com os valores fornecidos.",
          duration: 10000
        });

        // Atualizar a configuração no banco
        await supabase
          .from('sms_configurations')
          .upsert({
            gateway_name: 'bulksms',
            api_token_secret_name: 'BULKSMS_TOKEN_SECRET',
            api_token_id_secret_name: 'BULKSMS_TOKEN_ID',
            credentials_encrypted: true,
            is_active: true,
            balance: data.balance,
            last_balance_check: new Date().toISOString()
          });

        setOpen(false);
        onConfigured?.();
        
        // Limpar os campos
        setTokenId('');
        setTokenSecret('');
      } else {
        toast({
          title: "Erro no Teste",
          description: data.error || "Falha na conexão com BulkSMS",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('BulkSMS test error:', error);
      toast({
        title: "Erro no Teste",
        description: "Erro ao testar conexão BulkSMS",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configurar BulkSMS
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configuração BulkSMS
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              As credenciais serão armazenadas de forma segura via Supabase Secrets.
              Após o teste, configure os secrets no painel do Supabase.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="token-id">Token ID</Label>
            <Input
              id="token-id"
              type="text"
              placeholder="Ex: 2F457385687E40CA8F11583AC346EA67-02-1"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="token-secret">Token Secret</Label>
            <Input
              id="token-secret"
              type="password"
              placeholder="Ex: CZH187YsmNpUUG8v7f*qBK4ETbVeO"
              value={tokenSecret}
              onChange={(e) => setTokenSecret(e.target.value)}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md text-sm">
            <p className="font-medium">Como obter as credenciais BulkSMS:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Acesse o painel BulkSMS</li>
              <li>Vá em "Manage" → "API Tokens"</li>
              <li>Crie um novo token ou use um existente</li>
              <li>Copie o Token ID e Token Secret</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={testAndSaveCredentials}
              disabled={testing || !tokenId || !tokenSecret}
              className="flex-1"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Key className="h-4 w-4 mr-2" />
              )}
              Testar e Configurar
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>

          <div className="text-xs text-muted-foreground p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-md">
            <p><strong>Próximos passos após teste bem-sucedido:</strong></p>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Acesse as configurações do projeto no Supabase</li>
              <li>Vá em "Edge Functions" → "Secrets"</li>
              <li>Adicione BULKSMS_TOKEN_ID e BULKSMS_TOKEN_SECRET</li>
              <li>Cole os valores fornecidos</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}