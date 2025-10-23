# É-kwanza - FASE 6: Validação de Webhooks (15 min)

**Data:** Janeiro 2025  
**Status:** ⏳ Aguardando confirmação da É-kwanza e conclusão das Fases 3-5

---

## 🎯 Objetivo da FASE 6

Validar que o webhook recebe confirmações automáticas de pagamento da É-kwanza para TODOS os 3 métodos e processa corretamente (atualiza status + adiciona créditos).

---

## 📋 Pré-requisitos

### Secrets Configurados
- [x] `EKWANZA_CLIENT_SECRET` (usado para validar assinatura HMAC)
- [x] `EKWANZA_NOTIFICATION_TOKEN`
- [x] `EKWANZA_MERCHANT_NUMBER`

### Webhook Configurado pela É-kwanza
- [ ] URL confirmada: `https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/ekwanza-webhook`
- [ ] Token de notificação: `OUAHIVRAJTMLOZ`
- [ ] Métodos habilitados: QR Code, MCX, Referência EMIS

### Fases Anteriores Concluídas
- [ ] FASE 3: QR Code testado
- [ ] FASE 4: MCX testado
- [ ] FASE 5: Referência EMIS testada

---

## 🧪 Teste 1: Webhook do QR Code É-kwanza

### Passo a Passo

1. **Criar Pagamento de Teste**
   ```
   Método: Admin → Pagamentos É-kwanza → 🚀 Configuração → "Testar QR Code"
   Valor: 1000 AOA
   ```

2. **Anotar Informações**
   ```
   Código É-kwanza: EKZ-XXXXXX
   Reference Code: SMSAO-XXXXX
   Transaction ID: uuid-aqui
   Payment ID: uuid-aqui
   ```

3. **Simular Pagamento (Opção A: Ambiente de Testes)**
   - Se a É-kwanza forneceu ambiente de testes, efetuar pagamento real
   - Escanear QR Code com app de teste
   - Confirmar pagamento

4. **Simular Pagamento (Opção B: Webhook Manual)**
   ```
   Admin → Pagamentos É-kwanza → "Simular Webhook"
   
   Ou manualmente:
   ```

   ```bash
   # Calcular assinatura HMAC-SHA256
   MESSAGE="${EKWANZA_CODE}|${OPERATION_CODE}"
   SECRET="rgK8Q~Zhqwy73dHifQsrtsns8xCNtC3UjZH~Cajn"
   SIGNATURE=$(echo -n "$MESSAGE" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)
   
   # Enviar webhook
   curl -X POST https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/ekwanza-webhook \
     -H "Content-Type: application/json" \
     -H "x-signature: $SIGNATURE" \
     -d '{
       "code": "EKZ-XXXXXX",
       "operationCode": "OP-YYYYYY",
       "amount": 1000,
       "status": "PAID",
       "merchantNumber": "01465115",
       "paymentMethod": "QR"
     }'
   ```

5. **Verificar Logs do Webhook**
   ```
   Supabase Dashboard → Functions → ekwanza-webhook → Logs
   
   Logs Esperados:
   ✅ "📥 Webhook received: POST"
   ✅ "Validating signature..."
   ✅ "✅ Signature valid"
   ✅ "Found payment: [payment_id]"
   ✅ "Payment already 'paid' (idempotency)"
   OU
   ✅ "Updating payment status to 'paid'"
   ✅ "Adding [X] credits to user [user_id]"
   ✅ "✅ Payment confirmed and credits added"
   ```

6. **Verificar Banco de Dados**
   ```sql
   -- Verificar status do pagamento
   SELECT 
     id,
     status,
     paid_at,
     callback_received_at,
     raw_callback
   FROM ekwanza_payments
   WHERE ekwanza_code = 'EKZ-XXXXXX';
   
   Resultado Esperado:
   status: 'paid'
   paid_at: [timestamp]
   callback_received_at: [timestamp]
   raw_callback: {...}
   ```

   ```sql
   -- Verificar transação
   SELECT 
     id,
     status,
     credits_purchased,
     updated_at
   FROM transactions
   WHERE id = '[transaction_id]';
   
   Resultado Esperado:
   status: 'completed'
   credits_purchased: [valor]
   ```

   ```sql
   -- Verificar créditos do usuário
   SELECT 
     id,
     credits,
     updated_at
   FROM profiles
   WHERE user_id = '[user_id]';
   
   Resultado Esperado:
   credits: [valor anterior] + [créditos comprados]
   updated_at: [timestamp recente]
   ```

7. **Verificar na UI**
   ```
   Admin → Pagamentos É-kwanza → Tab "Pagos"
   
   Verificar que:
   ✅ Pagamento aparece na lista
   ✅ Status mostra "Pago" com badge verde
   ✅ Data de pagamento está preenchida
   ```

### Resultado do Teste 1
- [ ] Webhook recebido
- [ ] Assinatura validada
- [ ] Status atualizado para 'paid'
- [ ] Créditos adicionados ao usuário
- [ ] Transação marcada como 'completed'
- [ ] Logs confirmam operação

---

## 🧪 Teste 2: Webhook do Multicaixa Express (MCX)

### Passo a Passo

1. **Criar Pagamento de Teste**
   ```
   Método: Admin → Pagamentos É-kwanza → 🚀 Configuração → "Testar MCX Express"
   Telefone: +244923456789
   Valor: 2000 AOA
   ```

2. **Anotar Informações**
   ```
   Código MCX: MCX-XXXXXX
   Operation Code: OP-YYYYYY
   Reference Code: SMSAO-XXXXX
   ```

3. **Simular Pagamento**
   - Usar app Multicaixa Express de teste (se disponível)
   - OU simular webhook manualmente (como no Teste 1)

4. **Verificar Logs do Webhook** (mesma estrutura do Teste 1)

5. **Verificar Banco de Dados** (mesmas queries do Teste 1)

6. **Verificar na UI** (mesma validação do Teste 1)

### Resultado do Teste 2
- [ ] Webhook MCX recebido
- [ ] Assinatura validada
- [ ] Status atualizado
- [ ] Créditos adicionados
- [ ] Sem erros

---

## 🧪 Teste 3: Webhook da Referência EMIS

### Passo a Passo

1. **Criar Pagamento de Teste**
   ```
   Método: Admin → Pagamentos É-kwanza → 🚀 Configuração → "Testar Referência EMIS"
   Valor: 5000 AOA
   ```

2. **Anotar Informações**
   ```
   Referência Bancária: 123456789
   Operation Code: OP-ZZZZZZ
   Código É-kwanza: REF-XXXXXX
   ```

3. **Simular Pagamento**
   - Pagar via banco de teste (se disponível)
   - OU simular webhook manualmente

4. **Verificar Logs do Webhook** (mesma estrutura)

5. **Verificar Banco de Dados** (mesmas queries)

6. **Verificar na UI** (mesma validação)

### Resultado do Teste 3
- [ ] Webhook Referência recebido
- [ ] Assinatura validada
- [ ] Status atualizado
- [ ] Créditos adicionados
- [ ] Sem erros

---

## 🔒 Validação de Segurança do Webhook

### Teste de Assinatura Inválida

```bash
# Enviar webhook com assinatura INCORRETA
curl -X POST https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/ekwanza-webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: assinatura_invalida_aqui" \
  -d '{
    "code": "EKZ-FAKE123",
    "operationCode": "OP-FAKE456",
    "amount": 999999,
    "status": "PAID"
  }'

Resultado Esperado:
HTTP 403 Forbidden
{
  "error": "Invalid signature"
}

Logs Esperados:
❌ "Invalid webhook signature"
❌ "Blocking webhook - security alert logged"
```

### Teste de Idempotência

```bash
# Enviar webhook duplicado (mesmo código 2x)
# Primeira chamada: deve processar normalmente
# Segunda chamada: deve detectar idempotência

Resultado Esperado (Segunda Chamada):
HTTP 200 OK
Logs: "Payment already 'paid' (idempotency check)"
Sem duplicação de créditos
```

---

## 📊 Dashboard de Validação

Após executar os 3 testes, verificar no Dashboard de Monitoramento:

```
Admin → Pagamentos É-kwanza → 📊 Monitoramento

Métricas a Verificar:
✅ 3+ transações processadas (1 por método)
✅ Taxa de sucesso: 100%
✅ Tempo médio de webhook: < 2s
✅ Zero erros de assinatura
✅ Zero duplicações de créditos
```

---

## 🚨 Troubleshooting

### Problema: Webhook não recebe notificação

**Causas Possíveis:**
1. URL do webhook não configurada pela É-kwanza
2. Firewall bloqueando requisições
3. Token de notificação incorreto

**Solução:**
1. Confirmar com É-kwanza que webhook está configurado
2. Verificar logs de rede no Supabase
3. Validar `EKWANZA_NOTIFICATION_TOKEN`

---

### Problema: Assinatura sempre inválida

**Causas Possíveis:**
1. `EKWANZA_CLIENT_SECRET` incorreto
2. Algoritmo de hash incorreto
3. Formato da mensagem incorreto

**Solução:**
1. Verificar secret no Supabase Dashboard
2. Confirmar algoritmo: HMAC-SHA256
3. Verificar formato: `${code}|${operationCode}`

---

### Problema: Créditos não são adicionados

**Causas Possíveis:**
1. Função `add_user_credits` com erro
2. user_id não encontrado
3. RLS bloqueando operação

**Solução:**
1. Verificar logs do webhook para erro específico
2. Testar função manualmente no SQL editor
3. Verificar políticas RLS da tabela `profiles`

---

## ✅ Critérios de Conclusão da FASE 6

**A FASE 6 está concluída quando:**

1. ✅ Webhook recebe notificações dos 3 métodos
2. ✅ Validação de assinatura funciona corretamente
3. ✅ Status dos pagamentos é atualizado automaticamente
4. ✅ Créditos são adicionados aos usuários
5. ✅ Idempotência previne duplicações
6. ✅ Testes de segurança passam (assinatura inválida = bloqueado)
7. ✅ Dashboard mostra métricas corretas

---

## 📅 Próximos Passos Após FASE 6

Quando todos os testes de webhook passarem:

1. ✅ Marcar FASE 6 como concluída
2. ✅ Documentar configuração final
3. ⏭️ Continuar com FASES 7-9

---

## 📧 Email de Acompanhamento para É-kwanza

Se webhooks não funcionarem após 48h da configuração:

```
Assunto: Acompanhamento - Webhook É-kwanza não recebendo notificações

Prezada Equipa É-kwanza,

Estamos a testar o webhook configurado e não estamos recebendo notificações 
de confirmação de pagamento.

URL do Webhook: https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/ekwanza-webhook
Token: OUAHIVRAJTMLOZ
Merchant ID: 01465115

Poderiam confirmar:
1. Se a URL está corretamente configurada no sistema
2. Se o token de notificação está ativo
3. Se há algum log de erro ao tentar enviar notificações

Realizamos os seguintes testes:
- QR Code: [EKW-XXX] - Pagamento criado em [data] - Sem webhook recebido
- MCX: [MCX-XXX] - Pagamento criado em [data] - Sem webhook recebido
- REF: [REF-XXX] - Pagamento criado em [data] - Sem webhook recebido

Aguardamos retorno para prosseguirmos com a integração.

Atenciosamente,
Equipa SMS.AO
```

---

**Responsável pela Execução:** Equipa Técnica SMS.AO  
**Tempo Estimado:** 15 minutos  
**Status:** ⏳ Aguardando conclusão das Fases 3-5 e confirmação do webhook  

---

*Este documento será atualizado com resultados dos testes executados.*
