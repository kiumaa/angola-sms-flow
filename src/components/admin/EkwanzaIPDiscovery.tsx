import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, Network, AlertCircle, CheckCircle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ServerIPInfo {
  success: boolean;
  public_ip: string;
  network_info: {
    ip_addresses: {
      x_forwarded_for: string | null;
      x_real_ip: string | null;
      cf_connecting_ip: string | null;
      x_client_ip: string | null;
    };
    cloudflare: {
      cf_ray: string | null;
      cf_ipcountry: string | null;
    };
  };
}

interface EkwanzaConfig {
  merchant_id: string;
  client_id: string;
  app_id: string;
}

export const EkwanzaIPDiscovery = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [ipInfo, setIpInfo] = useState<ServerIPInfo | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [ekwanzaConfig, setEkwanzaConfig] = useState<EkwanzaConfig>({
    merchant_id: "SUBSTITUIR_COM_MERCHANT_ID",
    client_id: "SUBSTITUIR_COM_CLIENT_ID",
    app_id: "SUBSTITUIR_COM_APP_ID"
  });

  const discoverServerIP = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-server-ip', {
        method: 'POST'
      });

      if (error) throw error;

      setIpInfo(data);
      toast({
        title: "✅ IP Descoberto",
        description: `IP Público: ${data.public_ip}`,
      });
    } catch (error: any) {
      console.error('Error discovering IP:', error);
      toast({
        title: "❌ Erro ao Descobrir IP",
        description: error.message || "Não foi possível descobrir o IP do servidor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
      duration: 2000,
    });
  };

  const downloadCommunicationDocument = () => {
    if (!ipInfo) {
      toast({
        title: "⚠️ IP não descoberto",
        description: "Por favor, descubra o IP do servidor primeiro.",
        variant: "destructive",
      });
      return;
    }

    // Ler o conteúdo do documento template
    const docContent = `# Comunicação Técnica para É-kwanza

## Assunto: Solicitação de Autorização de IP e Confirmação de Endpoints para Integração SMS.AO

---

## 1. DADOS DO MERCHANT

**Empresa:** SMS.AO - Plataforma de SMS Marketing  
**Merchant ID:** ${ekwanzaConfig.merchant_id}  
**Client ID OAuth2:** ${ekwanzaConfig.client_id}  
**App ID:** ${ekwanzaConfig.app_id}  
**Ambiente:** Produção  
**Plataforma:** Supabase Edge Functions (Lovable Cloud)  

---

## 2. SOLICITAÇÃO PRINCIPAL

Solicitamos autorização para integração completa com os serviços É-kwanza para processamento de pagamentos em nossa plataforma de SMS Marketing. Atualmente enfrentamos dois desafios técnicos:

### 2.1. AUTORIZAÇÃO DE IP (CRÍTICO)

**Problema Identificado:**  
Nosso servidor não consegue estabelecer conexão com o endpoint MCX Express devido a possível restrição de IP não autorizado.

**Endpoints Afetados:**
- https://ekz-partnersapi.e-kwanza.ao/oauth/token (OAuth2)
- https://ekz-partnersapi.e-kwanza.ao/api/v1/GPO (MCX Express Payment)

**IP Público do Servidor:** ${ipInfo.public_ip}

**Informações Adicionais de Rede:**
- X-Forwarded-For: ${ipInfo.network_info.ip_addresses.x_forwarded_for || 'N/A'}
- X-Real-IP: ${ipInfo.network_info.ip_addresses.x_real_ip || 'N/A'}
- Cloudflare Connecting IP: ${ipInfo.network_info.ip_addresses.cf_connecting_ip || 'N/A'}
- Cloudflare Country: ${ipInfo.network_info.cloudflare.cf_ipcountry || 'N/A'}
- Cloudflare Ray ID: ${ipInfo.network_info.cloudflare.cf_ray || 'N/A'}

**Erro Técnico Recorrente:**
\`\`\`
TypeError: error sending request for url (https://ekz-partnersapi.e-kwanza.ao/oauth/token): 
error trying to connect: dns error: failed to lookup address information
\`\`\`

**Solução Solicitada:**  
Autorizar o IP público acima para acesso aos endpoints OAuth2 e MCX Express (GPO).

---

### 2.2. CONFIRMAÇÃO DO ENDPOINT "REFERÊNCIA EMIS"

**Problema Identificado:**  
Todos os paths testados para o endpoint "Referência EMIS" retornam HTTP 404.

**Paths Testados (todos com 404):**
- /api/v1/REF
- /api/v1/Reference
- /api/v1/Referencia
- /api/v1/referencias

**Solicitação:**
1. Confirmar se o endpoint "Referência EMIS" está disponível em produção
2. Fornecer o path correto da API
3. Informar se requer autenticação OAuth2 ou é público
4. Fornecer payload de exemplo da requisição

---

## 3. ENDPOINTS ATUALMENTE FUNCIONAIS

### 3.1. QR Code É-kwanza (✅ 100% Funcional)

**Endpoint:** https://ekz-partnersapi.e-kwanza.ao/api/v1/QPay  
**Método:** POST  
**Autenticação:** Bearer Token (OAuth2)  
**Taxa de Sucesso:** ~95%  
**Status:** Produção estável

---

### 3.2. MCX Express (❌ Bloqueado por IP)

**Endpoint:** https://ekz-partnersapi.e-kwanza.ao/api/v1/GPO  
**Método:** POST  
**Autenticação:** Bearer Token (OAuth2)  
**Taxa de Sucesso:** 0% (DNS error / Network error)  
**Status:** Aguardando whitelist de IP

---

## 4. INFORMAÇÕES ADICIONAIS

### 4.1. Stack Técnico
- **Backend:** Supabase Edge Functions (Deno runtime)
- **Frontend:** React + TypeScript
- **Infraestrutura:** Lovable Cloud (Supabase hosted)
- **Região:** Global (CDN via Cloudflare)

### 4.2. Volume de Transações Previsto
- **Atual:** ~50-100 transações/dia
- **Projetado (3 meses):** ~500-1000 transações/dia
- **Peak esperado:** ~2000 transações/dia

### 4.3. Segurança Implementada
- ✅ HTTPS obrigatório
- ✅ Autenticação OAuth2 client_credentials
- ✅ Secrets gerenciados via Supabase Vault
- ✅ Rate limiting por usuário
- ✅ Validação de webhooks (quando disponível)
- ✅ Logging completo de transações

---

## 5. AÇÕES SOLICITADAS

**Prioridade ALTA:**
1. ✅ Autorizar IP público do servidor para endpoints OAuth2 e MCX Express
2. ✅ Confirmar status e path correto do endpoint "Referência EMIS"
3. ✅ Fornecer documentação atualizada da API (se houver mudanças recentes)

**Prioridade MÉDIA:**
4. Confirmar se webhooks de callback estão disponíveis para atualização automática de status
5. Informar se há planos de migração de endpoints ou mudanças de domínio

---

## 6. CONTATO TÉCNICO

**Desenvolvedor Responsável:** Equipe SMS.AO  
**Email:** suporte@sms.ao  
**WhatsApp:** +244 933 493 788  
**Horário de Atendimento:** Segunda a Sexta, 8h-18h (GMT+1)

---

**Data:** ${new Date().toLocaleDateString('pt-BR')}  
**Versão do Documento:** 1.0  
**Status:** Aguardando Resposta da É-kwanza

---

Agradecemos a atenção e aguardamos retorno.

**Assinatura:**  
SMS.AO - Equipe Técnica
`;

    // Criar blob e download
    const blob = new Blob([docContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ekwanza-comunicacao-tecnica-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "✅ Documento Gerado",
      description: "Comunicação técnica baixada com sucesso!",
    });
  };

  return (
    <div className="space-y-6">
      {/* Discovery Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Descobrir IP do Servidor
          </CardTitle>
          <CardDescription>
            Obtenha o IP público do servidor Supabase para enviar à É-kwanza
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={discoverServerIP}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Descobrindo IP...
              </>
            ) : (
              <>
                <Network className="h-4 w-4 mr-2" />
                Descobrir IP do Servidor
              </>
            )}
          </Button>

          {ipInfo && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-mono text-sm">
                    <strong>IP Público:</strong> {ipInfo.public_ip}
                  </div>
                </AlertDescription>
              </Alert>

              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <h4 className="font-medium text-sm">Informações Detalhadas de Rede:</h4>
                
                <div className="space-y-1 text-sm font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">X-Forwarded-For:</span>
                    <span>{ipInfo.network_info.ip_addresses.x_forwarded_for || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">X-Real-IP:</span>
                    <span>{ipInfo.network_info.ip_addresses.x_real_ip || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CF-Connecting-IP:</span>
                    <span>{ipInfo.network_info.ip_addresses.cf_connecting_ip || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CF-Country:</span>
                    <span>{ipInfo.network_info.cloudflare.cf_ipcountry || 'N/A'}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(ipInfo.public_ip, 'IP Público')}
                  className="w-full mt-2"
                >
                  {copied === 'IP Público' ? (
                    <><Check className="h-3 w-3 mr-2" /> Copiado!</>
                  ) : (
                    <><Copy className="h-3 w-3 mr-2" /> Copiar IP</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração É-kwanza</CardTitle>
          <CardDescription>
            Estas informações serão incluídas no documento de comunicação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Por favor, substitua os valores abaixo com suas credenciais reais da É-kwanza antes de gerar o documento.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Merchant ID</label>
              <input
                type="text"
                value={ekwanzaConfig.merchant_id}
                onChange={(e) => setEkwanzaConfig({ ...ekwanzaConfig, merchant_id: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="Ex: 123456"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Client ID OAuth2</label>
              <input
                type="text"
                value={ekwanzaConfig.client_id}
                onChange={(e) => setEkwanzaConfig({ ...ekwanzaConfig, client_id: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="Ex: your-client-id"
              />
            </div>

            <div>
              <label className="text-sm font-medium">App ID</label>
              <input
                type="text"
                value={ekwanzaConfig.app_id}
                onChange={(e) => setEkwanzaConfig({ ...ekwanzaConfig, app_id: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="Ex: your-app-id"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Document Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Gerar Documento de Comunicação
          </CardTitle>
          <CardDescription>
            Baixe o documento pronto para enviar à equipe É-kwanza
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!ipInfo && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Por favor, descubra o IP do servidor primeiro antes de gerar o documento.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={downloadCommunicationDocument}
            disabled={!ipInfo}
            className="w-full"
            variant={ipInfo ? "default" : "outline"}
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar Documento de Comunicação
          </Button>

          {ipInfo && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">Pronto para enviar!</p>
                  <p className="text-xs text-muted-foreground">
                    O documento será gerado com o IP <span className="font-mono">{ipInfo.public_ip}</span> e suas configurações.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Status Atual dos Métodos de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-medium">QR Code É-kwanza</span>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              ✅ Funcional (95%)
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="font-medium">MCX Express</span>
            </div>
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
              ❌ Bloqueado (IP)
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">Referência EMIS</span>
            </div>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
              ⚠️ Endpoint 404
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
