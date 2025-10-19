# É-kwanza Payment Gateway - Guia de Troubleshooting

## Estado Atual dos Métodos de Pagamento

### ✅ QR Code É-kwanza (FUNCIONANDO)
- **Status**: Totalmente funcional
- **Última atualização**: Janeiro 2025
- **Observação**: Correção de mapeamento case-sensitive implementada

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

### 1. QR Code Não Aparece no Modal
**Sintoma**: Pagamento é criado com sucesso mas a imagem do QR code não aparece

**Causa**: A API do É-kwanza retorna campos com capitalização diferente:
- Retorna: `QRCode` (maiúscula)
- Código esperava: `qrCode` (camelCase)

**Solução**: Implementada normalização automática de respostas da API

**Status**: ✅ Corrigido

---

### 2. MCX Express - Erro de Rede/DNS
**Sintoma**: 
```
Falha de DNS/conectividade com o provedor É-kwanza
TypeError: Network error
```

**Causa Raiz**: IP do servidor não autorizado ou problema de DNS

**Diagnósticos Executados**:
- ✅ Teste de conectividade antes de criar pagamento
- ✅ Timeout de 15 segundos implementado
- ✅ Retry logic com múltiplos baseUrls
- ❌ Conectividade com `ekz-partnersapi.e-kwanza.ao` falha

**Ações Necessárias**:
1. Contactar É-kwanza e fornecer IP do servidor Lovable
2. Verificar status do endpoint `https://ekz-partnersapi.e-kwanza.ao/api/v1/GPO`
3. Considerar usar VPN ou proxy se necessário

**Alternativa Imediata**: Usar Transferência Bancária

---

### 3. Referência EMIS - Endpoint 404
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

**Solução Temporária**: Método desabilitado

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

### Logs a Observar
```javascript
// Logs de sucesso
"✅ QR Code payment created via https://..."
"✅ MCX payment created via https://..."
"OAuth2 token obtained successfully"

// Logs de erro
"❌ Network/DNS error on https://..."
"❌ MCX failed on https://..."
"❌ All URLs failed"
```

---

## Histórico de Mudanças

### Janeiro 2025
- **19/01**: Implementadas todas as 4 fases do plano
  - Correção QR Code case-sensitivity
  - Desativação de Referência EMIS
  - Melhorias MCX Express com timeouts
  - Criação desta documentação
  
### Dezembro 2024
- Implementação inicial dos 3 métodos de pagamento

---

## FAQ

**P: Por que o QR Code funciona mas o MCX não?**
R: O QR Code usa o endpoint `/Ticket` que não requer OAuth2 e tem menos restrições de IP. O MCX usa `/api/v1/GPO` que é mais restritivo.

**P: Quando a Referência EMIS vai voltar?**
R: Assim que o É-kwanza confirmar o endpoint correto ou criar a rota `/api/v1/REF`.

**P: É seguro usar Transferência Bancária?**
R: Sim, é o método mais confiável e não depende de APIs externas.