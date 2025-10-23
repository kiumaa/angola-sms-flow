# É-kwanza Payment Gateway - Troubleshooting Guide (ATUALIZADO)

**Última Atualização:** Janeiro 2025  
**Status:** ✅ **TODOS OS MÉTODOS 100% FUNCIONAIS**

---

## 📊 Status Atual dos Métodos de Pagamento

| Método | Status | Última Verificação | Observações |
|--------|--------|-------------------|-------------|
| **QR Code É-kwanza** | ✅ 100% Funcional | Jan 2025 | Totalmente testado e validado |
| **Multicaixa Express (MCX)** | ✅ 100% Funcional | Jan 2025 | OAuth2 corrigido com novo endpoint |
| **Referência EMIS** | ✅ 100% Funcional | Jan 2025 | **AGORA DISPONÍVEL!** Endpoint corrigido |

---

## 🔧 Configurações de Produção

### Secrets Atualizados (Janeiro 2025)

```bash
# OAuth Configuration (CORRIGIDO - Microsoft Azure)
EKWANZA_OAUTH_URL=https://login.microsoftonline.com/auth.appypay.co.ao/oauth2/token
EKWANZA_CLIENT_ID=af273fba-d170-40c6-8500-d23e5b696456
EKWANZA_CLIENT_SECRET=rgK8Q~Zhqwy73dHifQsrtsns8xCNtC3UjZH~Cajn
EKWANZA_RESOURCE=bee57785-7a19-4f1c-9c8d-aa03f2f0e333

# Payment Methods (NOVOS - Janeiro 2025)
EKWANZA_GPO_PAYMENT_METHOD=0d23d2b0-c19c-42ca-b423-38c150acac5e
EKWANZA_REF_PAYMENT_METHOD=8d9c9851-4d33-4d8d-82b5-3d3b4cea5d92

# API Configuration
EKWANZA_BASE_URL=https://ekz-partnersapi.e-kwanza.ao
EKWANZA_NOTIFICATION_TOKEN=OUAHIVRAJTMLOZ
EKWANZA_MERCHANT_NUMBER=01465115

# Feature Flags
ENABLE_REFERENCIA_EMIS=true  # ✅ AGORA HABILITADO!
```

---

## ✅ Problemas Resolvidos

### 1. ~~QR Code Não Aparecia~~ ✅ RESOLVIDO

**Problema Original:**
- QR Code não era exibido
- Resposta da API não era normalizada corretamente

**Solução Implementada:**
- Função `normalizePaymentResponse()` criada
- Conversão de case-sensitivity (Code/code, QrCode/qrCode)
- Conversão de datas Microsoft JSON para ISO 8601
- Detecção automática de MIME type do QR Code

**Status:** ✅ Totalmente funcional desde Dezembro 2024

---

### 2. ~~MCX Express - Erro de OAuth/DNS~~ ✅ RESOLVIDO

**Problema Original:**
```
Error: fetch failed - getaddrinfo ENOTFOUND ekz-partnersapi.e-kwanza.ao
OAuth URL incorreto causava falhas de autenticação
```

**Causa Raiz Identificada:**
- OAuth URL estava incorreto (`ekz-partnersapi.e-kwanza.ao/oauth2`)
- URL correto é do domínio Microsoft: `login.microsoftonline.com/auth.appypay.co.ao/oauth2/token`
- `paymentMethodId` não estava configurado

**Solução Implementada (Janeiro 2025):**
```typescript
// OAuth URL CORRETO (Microsoft Azure)
const oauthUrl = 'https://login.microsoftonline.com/auth.appypay.co.ao/oauth2/token'

// Payment Method ID CORRETO
const gpoPaymentMethod = '0d23d2b0-c19c-42ca-b423-38c150acac5e'
```

**Status:** ✅ Totalmente funcional desde Janeiro 2025

---

### 3. ~~Referência EMIS - Erro 404~~ ✅ RESOLVIDO

**Problema Original:**
```
POST /api/v1/REF - 404 Not Found
Endpoint não encontrado no gateway É-kwanza
```

**Causa Raiz Identificada:**
- `paymentMethodId` correto não estava configurado
- OAuth URL incorreto
- `ENABLE_REFERENCIA_EMIS` estava `false`

**Solução Implementada (Janeiro 2025):**
```typescript
// Payment Method ID CORRETO para Referência EMIS
const refPaymentMethod = '8d9c9851-4d33-4d8d-82b5-3d3b4cea5d92'

// Feature flag habilitado
ENABLE_REFERENCIA_EMIS=true
```

**Status:** ✅ **TOTALMENTE FUNCIONAL DESDE JANEIRO 2025!**

---

### 4. ~~Timestamp PostgreSQL Error~~ ✅ RESOLVIDO

**Problema Original:**
```
invalid input syntax for type timestamp with time zone: "/Date(1234567890)/"
```

**Solução Implementada:**
```typescript
function parseMicrosoftJsonDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  if (!dateStr.startsWith('/Date(')) return dateStr;
  
  const timestamp = parseInt(dateStr.replace(/\/Date\((\d+)\)\//, '$1'));
  return new Date(timestamp).toISOString();
}
```

**Status:** ✅ Resolvido desde Dezembro 2024

---

## 🧪 Como Testar Cada Método (Janeiro 2025)

### Teste 1: QR Code É-kwanza

```bash
# Acessar: Admin → Pagamentos É-kwanza → 🚀 Configuração
# Clicar em "Testar QR Code"

Resultado Esperado:
✅ QR Code gerado em ~2-3 segundos
✅ Código É-kwanza exibido (EKZ-XXXXXX)
✅ Data de expiração válida
✅ Imagem do QR Code carregada

Logs a Verificar:
✅ QR Code payment created via https://ekz-partnersapi.e-kwanza.ao
✅ Response normalized successfully
✅ QR code MIME type: image/png ou image/jpeg
```

---

### Teste 2: Multicaixa Express (MCX)

```bash
# Acessar: Admin → Pagamentos É-kwanza → 🚀 Configuração
# Clicar em "Testar MCX Express"
# Inserir número: +244923456789

Resultado Esperado:
✅ OAuth token obtido com sucesso
✅ Código MCX gerado (MCX-XXXXXX)
✅ Sem erros de DNS ou OAuth
✅ Instruções de confirmação exibidas

Logs a Verificar:
✅ OAuth Request Config: oauth_url: https://login.microsoftonline.com/...
✅ OAuth2 token obtained successfully
✅ MCX payment created via https://ekz-partnersapi.e-kwanza.ao
✅ No "fetch failed" ou "ENOTFOUND" errors
```

---

### Teste 3: Referência EMIS

```bash
# Acessar: Admin → Pagamentos É-kwanza → 🚀 Configuração
# Clicar em "Testar Referência EMIS"

Resultado Esperado:
✅ OAuth token obtido com sucesso
✅ Referência bancária gerada (9 dígitos)
✅ Código de operação É-kwanza exibido
✅ Sem erro 404

Logs a Verificar:
✅ ENABLE_REFERENCIA_EMIS=true
✅ OAuth2 token obtained successfully
✅ Referência payment created successfully
✅ Payment Method ID: 8d9c9851-4d33-4d8d-82b5-3d3b4cea5d92
✅ No 404 errors
```

---

## 📊 Dashboard de Monitoramento

**Acesso:** Admin → Pagamentos É-kwanza → 📊 Monitoramento

**Métricas Disponíveis:**
- Taxa de sucesso em tempo real (últimas 24h)
- Tempo médio de resposta por método
- Volume de transações por hora/dia
- Top 5 erros mais frequentes
- Distribuição de uso por método

**Alertas Automáticos:**
- Taxa de sucesso < 85% em 1 hora
- Tempo médio > 10 segundos
- Mais de 50 erros consecutivos

---

## 🔍 Quick Diagnosis Commands

### Verificar Secrets Configurados
```sql
-- No Supabase Dashboard, ir para: Settings → Edge Functions
-- Verificar se todos estes secrets existem:
✅ EKWANZA_OAUTH_URL
✅ EKWANZA_CLIENT_ID
✅ EKWANZA_CLIENT_SECRET
✅ EKWANZA_RESOURCE
✅ EKWANZA_GPO_PAYMENT_METHOD
✅ EKWANZA_REF_PAYMENT_METHOD
✅ EKWANZA_BASE_URL
✅ EKWANZA_NOTIFICATION_TOKEN
✅ EKWANZA_MERCHANT_NUMBER
✅ ENABLE_REFERENCIA_EMIS
```

### Verificar Métricas de Performance
```sql
-- Últimas 100 transações
SELECT 
  payment_method,
  status,
  response_time_ms,
  error_code,
  created_at
FROM payment_metrics
ORDER BY created_at DESC
LIMIT 100;

-- Taxa de sucesso por método (últimas 24h)
SELECT 
  payment_method,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
  ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM payment_metrics
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY payment_method;
```

### Verificar Logs do Webhook
```sql
-- Pagamentos aguardando webhook
SELECT 
  id,
  payment_method,
  status,
  ekwanza_code,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_waiting
FROM ekwanza_payments
WHERE status = 'pending'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

## 🚨 Tabela de Códigos de Erro

| Código | Descrição | Solução | Prioridade |
|--------|-----------|---------|------------|
| `RATE_LIMIT` | Muitas tentativas em curto período | Aguardar 1 minuto | Baixa |
| `ENDPOINT_NOT_FOUND` | Rota não encontrada (404) | ✅ **RESOLVIDO** - Usar novos payment method IDs | Alta |
| `PROVIDER_ERROR` | Erro retornado pela É-kwanza | Verificar logs detalhados | Média |
| `NETWORK` | Falha de conexão | ✅ **RESOLVIDO** - OAuth URL corrigido | Alta |
| `INVALID_SIGNATURE` | Webhook com assinatura inválida | Verificar EKWANZA_CLIENT_SECRET | Crítica |
| `PAYMENT_NOT_FOUND` | Pagamento não existe no sistema | Verificar reference_code ou ekwanza_code | Média |

---

## 📞 Suporte

### Suporte É-kwanza
- **Email:** suporte@e-kwanza.ao
- **Telefone:** +244 XXX XXX XXX (obter com equipe É-kwanza)
- **Horário:** Segunda a Sexta, 8h-17h

### Informações para Suporte É-kwanza
Ao contactar suporte, fornecer:
- Merchant ID: `01465115`
- Código É-kwanza da transação
- Data e hora (formato: YYYY-MM-DD HH:MM:SS)
- Método de pagamento (QR / MCX / REF)
- Mensagem de erro completa

---

## 📚 Documentação Relacionada

- ✅ [Produção - Status Completo](./ekwanza-production-ready.md)
- ✅ [FASE 2 - Validação Webhook](./ekwanza-fase2-validacao.md)
- ✅ [FASE 9 - Comunicação Final](./ekwanza-comunicacao-final.md)
- ✅ [Especificação Técnica Original](./especificacao-bulkgate-gateway.md)

---

## ✅ Checklist de Troubleshooting

Antes de escalar um problema:

- [ ] Verificar status no Dashboard de Monitoramento
- [ ] Consultar logs do edge function `ekwanza-create-payment`
- [ ] Verificar que todos os secrets estão configurados
- [ ] Testar os 3 métodos no painel de configuração
- [ ] Validar que `ENABLE_REFERENCIA_EMIS=true`
- [ ] Confirmar que OAuth URL está correto (Microsoft domain)
- [ ] Verificar métricas de performance no banco de dados
- [ ] Revisar esta documentação de troubleshooting

---

## 🎉 Conclusão

**Todos os problemas conhecidos foram resolvidos!**

✅ QR Code: 100% funcional  
✅ MCX Express: 100% funcional (OAuth corrigido)  
✅ Referência EMIS: 100% funcional (agora disponível!)  
✅ Webhook: Implementado e testado  
✅ Monitoramento: Dashboard ativo  

**Sistema pronto para produção desde Janeiro 2025! 🚀**

---

*Última Atualização: Janeiro 2025*  
*Responsável: Equipa Técnica SMS.AO*
