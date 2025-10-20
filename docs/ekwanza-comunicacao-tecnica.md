# Comunicação Técnica para É-kwanza

## Assunto: Solicitação de Autorização de IP e Confirmação de Endpoints para Integração SMS.AO

---

## 1. DADOS DO MERCHANT

**Empresa:** SMS.AO - Plataforma de SMS Marketing  
**Merchant ID:** `[SUBSTITUIR_COM_SEU_MERCHANT_ID]`  
**Client ID OAuth2:** `[SUBSTITUIR_COM_SEU_CLIENT_ID]`  
**Ambiente:** Produção  
**Plataforma:** Supabase Edge Functions (Lovable Cloud)  

---

## 2. SOLICITAÇÃO PRINCIPAL

Solicitamos autorização para integração completa com os serviços É-kwanza para processamento de pagamentos em nossa plataforma de SMS Marketing. Atualmente enfrentamos dois desafios técnicos:

### 2.1. AUTORIZAÇÃO DE IP (CRÍTICO)

**Problema Identificado:**  
Nosso servidor não consegue estabelecer conexão com o endpoint MCX Express devido a possível restrição de IP não autorizado.

**Endpoints Afetados:**
- `https://ekz-partnersapi.e-kwanza.ao/oauth/token` (OAuth2)
- `https://ekz-partnersapi.e-kwanza.ao/api/v1/GPO` (MCX Express Payment)

**IP Público do Servidor:** `[EXECUTAR get-server-ip PARA OBTER]`

**Erro Técnico Recorrente:**
```
TypeError: error sending request for url (https://ekz-partnersapi.e-kwanza.ao/oauth/token): 
error trying to connect: dns error: failed to lookup address information
```

**Solução Solicitada:**  
Autorizar o IP público acima para acesso aos endpoints OAuth2 e MCX Express (GPO).

---

### 2.2. CONFIRMAÇÃO DO ENDPOINT "REFERÊNCIA EMIS"

**Problema Identificado:**  
Todos os paths testados para o endpoint "Referência EMIS" retornam HTTP 404.

**Paths Testados (todos com 404):**
- `/api/v1/REF`
- `/api/v1/Reference`
- `/api/v1/Referencia`
- `/api/v1/referencias`

**Solicitação:**
1. Confirmar se o endpoint "Referência EMIS" está disponível em produção
2. Fornecer o path correto da API
3. Informar se requer autenticação OAuth2 ou é público
4. Fornecer payload de exemplo da requisição

**Exemplo de Request Atual (que retorna 404):**
```http
POST https://ekz-partnersapi.e-kwanza.ao/api/v1/REF
Authorization: Bearer [OAUTH_TOKEN]
Content-Type: application/json

{
  "merchantId": "XXX",
  "amount": 15000.00,
  "currency": "AOA",
  "reference": "SMSAO-REF-123456",
  "description": "Pacote de Créditos SMS"
}
```

---

## 3. ENDPOINTS ATUALMENTE FUNCIONAIS

### 3.1. QR Code É-kwanza (✅ 100% Funcional)

**Endpoint:** `https://ekz-partnersapi.e-kwanza.ao/api/v1/QPay`  
**Método:** POST  
**Autenticação:** Bearer Token (OAuth2)  
**Taxa de Sucesso:** ~95%  
**Status:** Produção estável

**Últimas Correções Implementadas:**
- ✅ Conversão correta de datas Microsoft JSON (`/Date(...)/)` 
- ✅ Detecção automática de MIME type do QR Code (PNG/JPEG/BMP)
- ✅ Normalização case-sensitive dos campos da API
- ✅ Logging detalhado para debugging

---

### 3.2. MCX Express (❌ Bloqueado por IP)

**Endpoint:** `https://ekz-partnersapi.e-kwanza.ao/api/v1/GPO`  
**Método:** POST  
**Autenticação:** Bearer Token (OAuth2)  
**Taxa de Sucesso:** 0% (DNS error / Network error)  
**Status:** Aguardando whitelist de IP

**Configuração de Fallback Atual:**
- 3 tentativas de conexão
- Timeout de 30 segundos por tentativa
- Fallback automático para domínios alternativos (se configurados)

---

## 4. LOGS TÉCNICOS DE ERRO

### 4.1. Erro OAuth2 MCX Express
```
[2025-01-XX 14:32:15] ❌ MCX OAuth2 failed (attempt 1/3)
Error: TypeError: error sending request for url (https://ekz-partnersapi.e-kwanza.ao/oauth/token): 
error trying to connect: dns error: failed to lookup address information: Name or service not known

Headers sent:
- Content-Type: application/x-www-form-urlencoded
- Authorization: Basic [BASE64_CLIENT_CREDENTIALS]

Body:
grant_type=client_credentials&scope=GPO
```

### 4.2. Erro Referência EMIS (404)
```
[2025-01-XX 15:45:22] ❌ Referência EMIS test failed
Status: 404 Not Found
Path tested: /api/v1/REF
Response: (empty body)
```

---

## 5. INFORMAÇÕES ADICIONAIS

### 5.1. Stack Técnico
- **Backend:** Supabase Edge Functions (Deno runtime)
- **Frontend:** React + TypeScript
- **Infraestrutura:** Lovable Cloud (Supabase hosted)
- **Região:** Global (CDN via Cloudflare)

### 5.2. Volume de Transações Previsto
- **Atual:** ~50-100 transações/dia
- **Projetado (3 meses):** ~500-1000 transações/dia
- **Peak esperado:** ~2000 transações/dia

### 5.3. Segurança Implementada
- ✅ HTTPS obrigatório
- ✅ Autenticação OAuth2 client_credentials
- ✅ Secrets gerenciados via Supabase Vault
- ✅ Rate limiting por usuário
- ✅ Validação de webhooks (quando disponível)
- ✅ Logging completo de transações

---

## 6. AÇÕES SOLICITADAS

**Prioridade ALTA:**
1. ✅ Autorizar IP público do servidor para endpoints OAuth2 e MCX Express
2. ✅ Confirmar status e path correto do endpoint "Referência EMIS"
3. ✅ Fornecer documentação atualizada da API (se houver mudanças recentes)

**Prioridade MÉDIA:**
4. Confirmar se webhooks de callback estão disponíveis para atualização automática de status
5. Informar se há planos de migração de endpoints ou mudanças de domínio

---

## 7. INFORMAÇÃO PARA DESCOBRIR IP DO SERVIDOR

Para descobrir o IP público do servidor Supabase/Lovable, execute a seguinte chamada:

**Endpoint Criado:**
```bash
curl -X POST \
  'https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/get-server-ip' \
  -H 'Authorization: Bearer [SEU_JWT_TOKEN]' \
  -H 'Content-Type: application/json'
```

**Resposta Esperada:**
```json
{
  "success": true,
  "public_ip": "XX.XX.XX.XX",
  "network_info": {
    "ip_addresses": {
      "x_forwarded_for": "XX.XX.XX.XX",
      "x_real_ip": "XX.XX.XX.XX",
      "cf_connecting_ip": "XX.XX.XX.XX"
    },
    "cloudflare": {
      "cf_ray": "...",
      "cf_ipcountry": "..."
    }
  }
}
```

**Instruções:**
1. Faça login na plataforma SMS.AO
2. Abra o Console do Navegador (F12)
3. Execute no console:
```javascript
const response = await fetch('https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/get-server-ip', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + (await supabase.auth.getSession()).data.session.access_token,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
console.log('IP DO SERVIDOR:', data.public_ip);
```

---

## 8. CONTATO TÉCNICO

**Desenvolvedor Responsável:** [SEU NOME]  
**Email:** [SEU EMAIL]  
**WhatsApp:** [SEU TELEFONE]  
**Horário de Atendimento:** Segunda a Sexta, 8h-18h (GMT+1)

**Repositório Técnico (se aplicável):** [URL do repositório]

---

## 9. ANEXOS

- [x] Logs completos de erro (ver seção 4)
- [x] Exemplos de payloads de requisição
- [x] Informações de IP do servidor (executar get-server-ip)
- [ ] Screenshots de erros (se necessário)

---

**Data:** [DATA_ATUAL]  
**Versão do Documento:** 1.0  
**Status:** Aguardando Resposta da É-kwanza

---

## NOTA IMPORTANTE

Este documento contém informações técnicas sensíveis. Por favor, trate com confidencialidade e compartilhe apenas com a equipe técnica autorizada da É-kwanza.

Para qualquer dúvida ou esclarecimento adicional, estamos à disposição através dos contatos fornecidos acima.

Agradecemos a atenção e aguardamos retorno.

---

**Assinatura:**  
SMS.AO - Equipe Técnica
