# É-kwanza - FASES 3, 4 e 5: Testes de Validação Completos

**Data:** Janeiro 2025  
**Status:** 🧪 Pronto para execução após confirmação do webhook

---

## 🎯 Objetivo das Fases 3-5

Validar que TODOS os 3 métodos de pagamento estão 100% funcionais em produção com os novos secrets configurados.

---

## ✅ FASE 3: Testar QR Code É-kwanza (5 min)

### Pré-requisitos
- [x] Secret `EKWANZA_BASE_URL` configurado
- [x] Secret `EKWANZA_NOTIFICATION_TOKEN` configurado
- [x] Edge function `ekwanza-create-payment` deployado

### Passo a Passo

1. **Acessar Painel de Configuração**
   ```
   URL: /admin/ekwanza-payments
   Tab: 🚀 Configuração
   ```

2. **Executar Teste**
   - Clicar em "Testar QR Code"
   - Aguardar 2-3 segundos
   - Verificar resultado

3. **Validação de Sucesso** ✅
   ```
   ✅ QR Code gerado
   ✅ Código É-kwanza exibido (formato: EKZ-XXXXXX)
   ✅ Data de expiração válida (24h)
   ✅ Imagem do QR Code carregada
   ✅ Instruções de pagamento visíveis
   ```

4. **Verificar Logs**
   ```
   Supabase Dashboard → Functions → ekwanza-create-payment → Logs

   Logs Esperados:
   ✅ "🎫 Attempting QR Code payment"
   ✅ "✅ QR Code payment created via https://ekz-partnersapi.e-kwanza.ao"
   ✅ "Response normalized successfully"
   ✅ "QR code MIME type: image/png"
   ```

5. **Verificar Banco de Dados**
   ```sql
   SELECT 
     id,
     payment_method,
     status,
     ekwanza_code,
     qr_code_base64 IS NOT NULL as has_qr,
     expiration_date,
     created_at
   FROM ekwanza_payments
   WHERE payment_method = 'qrcode'
   ORDER BY created_at DESC
   LIMIT 1;
   
   Resultado Esperado:
   payment_method: 'qrcode'
   status: 'pending'
   has_qr: true
   ekwanza_code: 'EKZ-...'
   ```

6. **Verificar Métricas**
   ```sql
   SELECT *
   FROM payment_metrics
   WHERE payment_method = 'qrcode'
   ORDER BY created_at DESC
   LIMIT 1;
   
   Resultado Esperado:
   status: 'success'
   response_time_ms: < 3000
   error_code: NULL
   ```

### Resultado da FASE 3
- [ ] QR Code gerado com sucesso
- [ ] Logs confirmam operação
- [ ] Métricas registradas
- [ ] Sem erros

**Status:** ⏳ Aguardando execução

---

## ✅ FASE 4: Testar Multicaixa Express (MCX) (10 min)

### Pré-requisitos
- [x] Secret `EKWANZA_OAUTH_URL` = `https://login.microsoftonline.com/auth.appypay.co.ao/oauth2/token`
- [x] Secret `EKWANZA_CLIENT_ID` configurado
- [x] Secret `EKWANZA_CLIENT_SECRET` configurado
- [x] Secret `EKWANZA_RESOURCE` configurado
- [x] Secret `EKWANZA_GPO_PAYMENT_METHOD` = `0d23d2b0-c19c-42ca-b423-38c150acac5e`

### Passo a Passo

1. **Acessar Painel de Configuração**
   ```
   URL: /admin/ekwanza-payments
   Tab: 🚀 Configuração
   ```

2. **Executar Teste**
   - Clicar em "Testar MCX Express"
   - Inserir número de teste: `+244923456789`
   - Aguardar 3-5 segundos
   - Verificar resultado

3. **Validação de Sucesso** ✅
   ```
   ✅ Código MCX gerado (formato: MCX-XXXXXX)
   ✅ Número de telefone confirmado
   ✅ Instruções de confirmação exibidas
   ✅ Sem erros de OAuth ou DNS
   ```

4. **Verificar Logs Críticos**
   ```
   Supabase Dashboard → Functions → ekwanza-create-payment → Logs

   Logs CRÍTICOS a Verificar:
   ✅ "🔐 Requesting OAuth2 token from: https://login.microsoftonline.com/auth.appypay.co.ao/oauth2/token"
   ✅ "OAuth Request Config: { oauth_url: 'https://login.microsoftonline.com/...' }"
   ✅ "OAuth2 token obtained successfully"
   ✅ "💳 Attempting MCX payment"
   ✅ "✅ MCX payment created via https://ekz-partnersapi.e-kwanza.ao"
   
   Logs que NÃO DEVEM aparecer:
   ❌ "fetch failed"
   ❌ "ENOTFOUND ekz-partnersapi.e-kwanza.ao"
   ❌ "OAuth2 failed: 401"
   ❌ "OAuth2 failed: 404"
   ```

5. **Verificar Banco de Dados**
   ```sql
   SELECT 
     id,
     payment_method,
     status,
     ekwanza_code,
     mobile_number,
     raw_response,
     created_at
   FROM ekwanza_payments
   WHERE payment_method = 'mcx'
   ORDER BY created_at DESC
   LIMIT 1;
   
   Resultado Esperado:
   payment_method: 'mcx'
   status: 'pending'
   ekwanza_code: 'MCX-...'
   mobile_number: '+244923456789'
   raw_response: {...} (JSON válido)
   ```

6. **Verificar Métricas**
   ```sql
   SELECT *
   FROM payment_metrics
   WHERE payment_method = 'mcx'
   ORDER BY created_at DESC
   LIMIT 1;
   
   Resultado Esperado:
   status: 'success'
   response_time_ms: < 5000
   error_code: NULL
   gateway_response: {...}
   ```

### Validação Extra: OAuth2

Para confirmar que o OAuth2 está funcionando corretamente:

```bash
# Testar OAuth2 manualmente (opcional)
curl -X POST https://login.microsoftonline.com/auth.appypay.co.ao/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=af273fba-d170-40c6-8500-d23e5b696456" \
  -d "client_secret=rgK8Q~Zhqwy73dHifQsrtsns8xCNtC3UjZH~Cajn" \
  -d "resource=bee57785-7a19-4f1c-9c8d-aa03f2f0e333"

Resultado Esperado:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3599
}
```

### Resultado da FASE 4
- [ ] MCX gerado com sucesso
- [ ] OAuth2 funcionando
- [ ] Logs confirmam operação
- [ ] Métricas registradas
- [ ] Sem erros de DNS/OAuth

**Status:** ⏳ Aguardando execução

---

## ✅ FASE 5: Testar Referência EMIS (NOVIDADE!) (10 min)

### Pré-requisitos
- [x] Secret `ENABLE_REFERENCIA_EMIS` = `true`
- [x] Secret `EKWANZA_OAUTH_URL` = `https://login.microsoftonline.com/auth.appypay.co.ao/oauth2/token`
- [x] Secret `EKWANZA_REF_PAYMENT_METHOD` = `8d9c9851-4d33-4d8d-82b5-3d3b4cea5d92`

### Passo a Passo

1. **Acessar Painel de Configuração**
   ```
   URL: /admin/ekwanza-payments
   Tab: 🚀 Configuração
   ```

2. **Executar Teste**
   - Clicar em "Testar Referência EMIS"
   - Aguardar 2-4 segundos
   - Verificar resultado

3. **Validação de Sucesso** ✅
   ```
   ✅ Referência bancária gerada (9 dígitos)
   ✅ Código de operação É-kwanza exibido
   ✅ Instruções de pagamento EMIS visíveis
   ✅ Sem erro 404
   ```

4. **Verificar Logs CRÍTICOS**
   ```
   Supabase Dashboard → Functions → ekwanza-create-payment → Logs

   Logs CRÍTICOS a Verificar:
   ✅ "ENABLE_REFERENCIA_EMIS=true" (ou variável está setada)
   ✅ "🔐 Requesting OAuth2 token from: https://login.microsoftonline.com/..."
   ✅ "OAuth2 token obtained successfully"
   ✅ "📄 Attempting Referência payment"
   ✅ "✅ Referência payment created via https://ekz-partnersapi.e-kwanza.ao"
   ✅ "Payment Method ID: 8d9c9851-4d33-4d8d-82b5-3d3b4cea5d92"
   
   Logs que NÃO DEVEM aparecer:
   ❌ "Referência EMIS is disabled"
   ❌ "POST /api/v1/REF - 404"
   ❌ "ENDPOINT_NOT_FOUND"
   ❌ "OAuth2 failed"
   ```

5. **Verificar Banco de Dados**
   ```sql
   SELECT 
     id,
     payment_method,
     status,
     ekwanza_code,
     ekwanza_operation_code,
     reference_number,
     expiration_date,
     raw_response,
     created_at
   FROM ekwanza_payments
   WHERE payment_method = 'referencia'
   ORDER BY created_at DESC
   LIMIT 1;
   
   Resultado Esperado:
   payment_method: 'referencia'
   status: 'pending'
   ekwanza_code: 'REF-...'
   ekwanza_operation_code: 'OP-...'
   reference_number: '123456789' (9 dígitos)
   raw_response: {...} (JSON válido)
   ```

6. **Verificar Métricas**
   ```sql
   SELECT *
   FROM payment_metrics
   WHERE payment_method = 'referencia'
   ORDER BY created_at DESC
   LIMIT 1;
   
   Resultado Esperado:
   status: 'success'
   response_time_ms: < 4000
   error_code: NULL
   gateway_response: {...}
   ```

### Validação Extra: Endpoint /api/v1/REF

Confirmar que o endpoint REF não retorna mais 404:

```bash
# Este teste requer OAuth token válido
# Apenas para verificação manual se necessário
```

### Resultado da FASE 5
- [ ] Referência EMIS gerada com sucesso
- [ ] OAuth2 funcionando
- [ ] Logs confirmam operação
- [ ] Métricas registradas
- [ ] Sem erro 404
- [ ] **PRIMEIRA VEZ FUNCIONAL!** 🎉

**Status:** ⏳ Aguardando execução

---

## 📊 Resumo de Validação das Fases 3-5

### Checklist Geral

**FASE 3 - QR Code:**
- [ ] Teste executado com sucesso
- [ ] Logs confirmam operação
- [ ] Métricas registradas no banco
- [ ] QR Code visível na UI

**FASE 4 - MCX Express:**
- [ ] OAuth2 funcionando (Microsoft endpoint)
- [ ] Código MCX gerado
- [ ] Logs confirmam operação
- [ ] Sem erros de DNS/OAuth
- [ ] Métricas registradas

**FASE 5 - Referência EMIS:**
- [ ] `ENABLE_REFERENCIA_EMIS=true` confirmado
- [ ] OAuth2 funcionando
- [ ] Referência bancária gerada
- [ ] Sem erro 404
- [ ] Métricas registradas
- [ ] **MÉTODO AGORA DISPONÍVEL!**

### Métricas Consolidadas

Após executar os 3 testes, verificar:

```sql
-- Resumo geral das métricas
SELECT 
  payment_method,
  COUNT(*) as total_tests,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
  AVG(response_time_ms) as avg_response_time,
  MAX(created_at) as last_test
FROM payment_metrics
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY payment_method
ORDER BY payment_method;

Resultado Esperado:
qrcode      | 1+ | 1+ | ~2000-3000ms | [timestamp recente]
mcx         | 1+ | 1+ | ~3000-5000ms | [timestamp recente]
referencia  | 1+ | 1+ | ~2000-4000ms | [timestamp recente]
```

---

## 🚨 Troubleshooting Durante os Testes

### Problema: QR Code não aparece

**Solução:**
1. Verificar `EKWANZA_BASE_URL` no Supabase
2. Verificar `EKWANZA_NOTIFICATION_TOKEN`
3. Consultar logs para erro específico
4. Tentar outro método (MCX/REF) para isolar problema

---

### Problema: MCX retorna erro de OAuth

**Solução:**
1. Verificar `EKWANZA_OAUTH_URL` = `https://login.microsoftonline.com/auth.appypay.co.ao/oauth2/token`
2. Verificar `EKWANZA_CLIENT_ID`, `CLIENT_SECRET`, `RESOURCE`
3. Testar OAuth manualmente (curl acima)
4. Verificar logs para erro específico

---

### Problema: Referência EMIS retorna 404

**Solução:**
1. Confirmar `ENABLE_REFERENCIA_EMIS=true`
2. Verificar `EKWANZA_REF_PAYMENT_METHOD` = `8d9c9851-4d33-4d8d-82b5-3d3b4cea5d92`
3. Confirmar OAuth2 funcionando
4. Verificar logs para caminho/endpoint usado

---

## ✅ Critérios de Conclusão

**As Fases 3-5 estão concluídas quando:**

1. ✅ Todos os 3 métodos testados com sucesso
2. ✅ Métricas registradas no banco para cada método
3. ✅ Logs confirmam operação sem erros
4. ✅ Dashboard de monitoramento mostra dados
5. ✅ Zero erros críticos (404, OAuth failed, DNS)

---

## 📅 Próximos Passos Após FASES 3-5

Quando todos os testes passarem:

1. ✅ Marcar FASES 3-5 como concluídas
2. ⏭️ Iniciar FASE 6: Validar Webhooks
3. ⏭️ Continuar com FASE 7-9 (Documentação, Monitoramento, Comunicação)

---

**Responsável pela Execução:** Equipa Técnica SMS.AO  
**Tempo Estimado Total:** 25 minutos  
**Data de Execução:** Após confirmação do webhook pela É-kwanza  

---

*Este documento será atualizado com resultados dos testes executados.*
