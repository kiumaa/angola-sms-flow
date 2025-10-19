# É-kwanza Payment Gateway - Guia de Troubleshooting

## Estado Atual dos Métodos de Pagamento

### ✅ QR Code É-kwanza (FUNCIONANDO)
- **Status**: Totalmente funcional
- **Última atualização**: Janeiro 2025 (Fase 1 + Correção de Timestamp)
- **Observações**: 
  - Correção de mapeamento case-sensitive implementada
  - **NOVO**: Conversão automática de Microsoft JSON Date para ISO 8601
  - **NOVO**: Logging detalhado de normalização e validação de datas

### ⚠️ Multicaixa Express (MCX) - PROBLEMAS DE REDE
- **Status**: Erro de conectividade/DNS
- **Problema**: `Failed to fetch` ao tentar conectar a `ekz-partnersapi.e-kwanza.ao`
- **Código de erro**: `TypeError: Network error`
- **Possíveis causas**:
  1. IP do servidor Lovable não está na whitelist do É-kwanza
  2. Problemas de DNS temporários
  3. Endpoint temporariamente indisponível
  
**Solução Recomendada**:
- Contactar suporte do É-kwanza para adicionar o IP do servidor à whitelist
- Usar Transferência Bancária como alternativa

### 🚫 Referência EMIS (DESABILITADO)
- **Status**: Endpoint não encontrado (404)
- **Problema**: Todos os paths testados retornam 404
- **Paths tentados**:
  - `/api/v1/REF`
  - `/api/v1/Reference`
  - `/api/v1/Referencia`
- **Ação tomada**: Método desabilitado via variável de ambiente `ENABLE_REFERENCIA_EMIS=false`

---

## Problemas Conhecidos

### 1. ❌ CRÍTICO: Erro de Timestamp no PostgreSQL (CORRIGIDO)
**Sintoma**: 
```
Error saving payment: invalid input syntax for type timestamp with time zone: "/Date(1760873332995)/"
```

**Causa Raiz**: A API do É-kwanza retorna datas no formato Microsoft JSON Date:
```json
{
  "ExpirationDate": "/Date(1760873332995)/"
}
```

Mas o PostgreSQL requer formato ISO 8601: `2025-10-19T12:08:52.995Z`

**Solução Implementada**:
1. Função `parseMicrosoftJsonDate()` que extrai timestamp e converte para ISO 8601
2. Validação de formato com logging de avisos
3. Tratamento de casos null/inválidos
4. Logging detalhado da conversão para debugging

**Código da Solução**:
```typescript
function parseMicrosoftJsonDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  
  const match = dateStr.match(/\/Date\((\d+)\)\//);
  if (!match) {
    console.warn('⚠️ Date format not recognized:', dateStr);
    return null;
  }
  
  const timestamp = parseInt(match[1], 10);
  const isoDate = new Date(timestamp).toISOString();
  console.log('📅 Date converted:', { original: dateStr, timestamp, iso: isoDate });
  return isoDate;
}
```

**Status**: ✅ Corrigido (Janeiro 2025 - Fase 1)

---

### 2. QR Code Não Aparece no Modal
**Sintoma**: Pagamento é criado com sucesso mas a imagem do QR code não aparece

**Causa**: A API do É-kwanza retorna campos com capitalização diferente:
- Retorna: `QRCode` (maiúscula)
- Código esperava: `qrCode` (camelCase)

**Solução**: Implementada normalização automática de respostas da API (incluindo conversão de datas)

**Status**: ✅ Corrigido

---

### 3. MCX Express - Erro de Rede/DNS
**Sintoma**: 
```
Não foi possível conectar ao servidor É-kwanza
TypeError: Network error / DNS error
```

**Causa Raiz**: IP do servidor não autorizado ou problema de DNS

**Diagnósticos Executados** (Fases 2 e 3):
- ✅ Teste de conectividade antes de criar pagamento
- ✅ Timeout de 15 segundos implementado
- ✅ Retry logic com múltiplos baseUrls
- ✅ Logging detalhado de erros de rede
- ✅ Mensagens de erro amigáveis ao usuário
- ❌ Conectividade com `ekz-partnersapi.e-kwanza.ao` falha

**Logs de Diagnóstico**:
```javascript
🌐 Network connectivity issue detected: {
  error_type: "DNS/Network failure",
  suggestion: "IP whitelist may be required",
  alternative_methods: ["bank_transfer", "contact_support"]
}
```

**Ações Necessárias**:
1. Contactar É-kwanza e fornecer IP do servidor Lovable
2. Verificar status do endpoint `https://ekz-partnersapi.e-kwanza.ao/api/v1/GPO`
3. Considerar usar VPN ou proxy se necessário

**Alternativa Imediata**: Usar Transferência Bancária

---

### 4. Referência EMIS - Endpoint 404
**Sintoma**: 
```
Referência EMIS temporariamente indisponível
404 ENDPOINT NOT FOUND
```

**Causa**: Endpoint `/api/v1/REF` não existe ou foi removido pela É-kwanza

**Tentativas**:
- Testados 3 paths diferentes
- Testados 2 baseUrls diferentes
- Todos retornam 404

**Solução Temporária** (Fase 2): 
- Método desabilitado via `ENABLE_REFERENCIA_EMIS=false`
- Rollback automático de transação quando desabilitado
- Remoção da opção na interface do usuário

**Ação Futura**: Contactar É-kwanza para confirmar endpoint correto

---

## Configuração de Variáveis de Ambiente

### Secrets Necessários no Supabase

```bash
# OAuth2 Configuration
EKWANZA_OAUTH_URL=https://ekz-partnersapi.e-kwanza.ao/oauth/token
EKWANZA_CLIENT_ID=your_client_id
EKWANZA_CLIENT_SECRET=your_client_secret
EKWANZA_RESOURCE=https://partnersapi.e-kwanza.ao

# API Endpoints
EKWANZA_BASE_URL=https://ekz-partnersapi.e-kwanza.ao
EKWANZA_NOTIFICATION_TOKEN=your_notification_token
EKWANZA_MERCHANT_NUMBER=your_merchant_number
EKWANZA_GPO_PAYMENT_METHOD=your_payment_method_id

# Feature Flags
ENABLE_REFERENCIA_EMIS=false  # Desabilitado por 404
```

---

## Melhorias Implementadas

### Fase 1: Correções Críticas (QR Code) ✅
- [x] Normalização de respostas case-sensitive
- [x] Helper function `normalizePaymentResponse()`
- [x] Mapeamento robusto de campos (`Code`, `QRCode`, `OperationCode`, etc.)

### Fase 2: Desabilitar Referência EMIS ✅
- [x] Variável de ambiente `ENABLE_REFERENCIA_EMIS`
- [x] Validação no edge function
- [x] Remoção da opção no frontend
- [x] Mensagens de erro amigáveis

### Fase 3: Melhorar MCX Express ✅
- [x] Timeout de 15 segundos em todas as chamadas `fetch`
- [x] Teste de conectividade antes de criar pagamento
- [x] Mensagens de erro detalhadas sobre IP whitelist
- [x] Sugestão de métodos alternativos

### Fase 4: Documentação e Monitoramento ✅
- [x] Documentação completa criada
- [x] Logs estruturados em todas as operações
- [x] Redação de segredos nos logs

---

## Diagnóstico Rápido

### Como Testar Cada Método

1. **QR Code É-kwanza**:
   ```bash
   # Verificar logs no Supabase Functions
   # Procurar por: "✅ QR Code payment created"
   ```

2. **MCX Express**:
   ```bash
   # Teste de conectividade
   curl -I https://ekz-partnersapi.e-kwanza.ao/api/v1/GPO
   # Se retornar timeout ou DNS error = problema de rede
   ```

3. **Referência EMIS**:
   ```bash
   # Atualmente desabilitado
   # Ver variável ENABLE_REFERENCIA_EMIS=false
   ```

---

## Códigos de Erro

| Código | Descrição | Solução |
|--------|-----------|---------|
| `NETWORK` | Falha de DNS/conectividade | Verificar IP whitelist |
| `ENDPOINT_NOT_FOUND` | Endpoint 404 | Desabilitado temporariamente |
| `PROVIDER_ERROR` | Erro da API É-kwanza | Verificar credenciais |
| `RATE_LIMIT` | Muitas tentativas | Aguardar 1 minuto |

---

## Suporte

### Contactos É-kwanza
- **Email**: suporte@e-kwanza.ao
- **Telefone**: +244 XXX XXX XXX
- **Portal**: https://partnersapi.e-kwanza.ao

### Informações Necessárias ao Contactar Suporte
1. IP do servidor Lovable (para whitelist)
2. Logs de erro específicos
3. Timestamp do erro
4. Método de pagamento afetado

---

## Monitoramento

### Métricas Importantes
- Taxa de sucesso por método de pagamento
- Tempo médio de resposta da API
- Erros de rede vs erros de API
- Taxa de conversão de pagamentos

### Logs a Observar (Fase 3 - Logging Detalhado)

**Logs de Sucesso - Com Conversão de Data:**
```javascript
"🔄 Normalized É-kwanza response: { hasCode: true, hasQRCode: true, hasExpiration: true }"
"📅 Date converted: { original: '/Date(1760873332995)/', iso: '2025-10-19T12:08:52.995Z' }"
"💾 Attempting to save payment to database: { payment_method: 'qrcode', has_expiration: true }"
"✅ Payment saved to database successfully: fa0aa758-..."
"✅ QR Code payment created via https://..."
"OAuth2 token obtained successfully"
```

**Logs de Erro - Com Detalhamento:**
```javascript
"❌ É-kwanza API error: { error: 'dns error', timestamp: '2025-10-19T12:10:44.298Z' }"
"🌐 Network connectivity issue detected: { error_type: 'DNS/Network failure' }"
"❌ Error saving payment to database: { code: '22007', message: 'invalid timestamp' }"
"⚠️ Date format not recognized: '/Date(invalid)/'"
"❌ Network/DNS error on https://..."
"❌ All URLs failed"
```

---

## Histórico de Mudanças

### Janeiro 2025 - Fase de Correção Completa
- **19/01 (Fase 1)**: Correção CRÍTICA de formato de timestamp
  - Implementada conversão de Microsoft JSON Date para ISO 8601
  - Função `parseMicrosoftJsonDate()` com validação e logging
  - Normalização aprimorada com logs detalhados
  - Correção de erro PostgreSQL timestamp
  
- **19/01 (Fases 2-4)**: Implementadas todas as fases do plano
  - Correção QR Code case-sensitivity
  - Desativação de Referência EMIS com rollback
  - Melhorias MCX Express com timeouts e conectividade
  - Logging detalhado em todas as operações
  - Criação e atualização desta documentação
  
### Dezembro 2024
- Implementação inicial dos 3 métodos de pagamento

---

## FAQ

**P: Por que estava a dar erro de timestamp no PostgreSQL?**
R: A É-kwanza retorna datas no formato Microsoft JSON (`/Date(timestamp)/`) mas o PostgreSQL requer ISO 8601. Implementamos conversão automática via `parseMicrosoftJsonDate()`.

**P: Como posso verificar se a conversão de data está funcionando?**
R: Procure nos logs por `📅 Date converted:` que mostra a data original e a convertida.

**P: Por que o QR Code funciona mas o MCX não?**
R: O QR Code usa o endpoint `/Ticket` que não requer OAuth2 e tem menos restrições de IP. O MCX usa `/api/v1/GPO` que é mais restritivo e está com problemas de DNS.

**P: Quando a Referência EMIS vai voltar?**
R: Assim que o É-kwanza confirmar o endpoint correto ou criar a rota `/api/v1/REF`.

**P: É seguro usar Transferência Bancária?**
R: Sim, é o método mais confiável e não depende de APIs externas.

**P: Como interpretar os novos símbolos nos logs?**
R: 
- ✅ = Sucesso
- ❌ = Erro
- ⚠️ = Aviso
- 📅 = Conversão de data
- 💾 = Operação de banco de dados
- 🌐 = Problema de rede
- 🔄 = Normalização de resposta