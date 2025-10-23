# É-kwanza - FASE 2: Email de Validação do Webhook

**Data:** Janeiro 2025  
**Para:** Equipe É-kwanza  
**De:** SMS.AO - Equipe Técnica  
**Assunto:** Confirmação de URL de Notificação (Webhook) - Merchant ID 01465115

---

## 📧 Email para Enviar à É-kwanza

```
Assunto: Confirmação de URL de Notificação (Webhook) - SMS.AO

Prezada Equipa É-kwanza,

Obrigado pelos dados de produção fornecidos!

Estamos finalizando a integração dos métodos de pagamento (QR Code, Multicaixa Express e Referência EMIS) e precisamos confirmar a configuração do webhook de notificações.

DADOS DO NOSSO SISTEMA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Merchant ID: 01465115
Nº Registo: 6254-25/250222

URL de Notificação (Webhook):
https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/ekwanza-webhook

Token de Notificação: OUAHIVRAJTMLOZ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SOLICITAÇÃO:
Poderiam confirmar se esta URL de notificação está configurada no sistema para o nosso Merchant ID?

Caso não esteja, solicitamos que seja configurada para recebermos notificações automáticas de:
  ✅ Pagamentos QR Code É-kwanza
  ✅ Multicaixa Express (GPO)
  ✅ Referência EMIS (REF)

VALIDAÇÕES TÉCNICAS:
Nosso webhook implementa:
  - Validação de assinatura HMAC-SHA256
  - Verificação do token de notificação
  - Processamento idempotente de pagamentos
  - Log completo de todas as requisições

MÉTODOS HTTP ACEITOS:
  - POST (preferencial)
  - GET (fallback)

FORMATO DE RESPOSTA ESPERADA:
  - Sucesso: HTTP 200 com status "0"
  - Erro: HTTP 4xx/5xx com descrição

TIMEOUT:
  - Máximo de 30 segundos para processar webhook

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRÓXIMOS PASSOS APÓS CONFIRMAÇÃO:
1. Realizar testes de integração end-to-end
2. Validar fluxo completo de confirmação de pagamento
3. Ativar monitoramento em produção
4. Iniciar processamento de transações reais

INFORMAÇÕES DE CONTACTO:
Email: suporte@sms.ao
Telefone: +244 XXX XXX XXX (atualizar com telefone real)
Disponibilidade: Segunda a Sexta, 8h-18h

Aguardamos confirmação para iniciarmos os testes finais.

Atenciosamente,
Equipa Técnica SMS.AO
```

---

## ✅ Checklist Pré-Envio

Antes de enviar o email, confirmar:

- [x] Merchant ID correto: `01465115`
- [x] URL do webhook correta
- [x] Token de notificação correto: `OUAHIVRAJTMLOZ`
- [x] Webhook implementado e testado localmente
- [x] Validação HMAC-SHA256 funcionando
- [x] Sistema de logs ativo
- [x] Edge function `ekwanza-webhook` deployada

---

## 📋 Informações Técnicas do Webhook

### Endpoint do Webhook
```
https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/ekwanza-webhook
```

### Autenticação
- **Método:** Header `x-signature` com HMAC-SHA256
- **Segredo:** `EKWANZA_CLIENT_SECRET`
- **Algoritmo:** `hash_hmac_sha256(ekwanzaCode + "|" + operationCode, secret)`

### Payload Esperado (POST)
```json
{
  "code": "EKZ-123456",
  "operationCode": "OP-789012",
  "amount": 5000.00,
  "status": "PAID",
  "merchantNumber": "01465115",
  "paymentMethod": "QR",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Resposta de Sucesso
```json
{
  "status": "0",
  "message": "Payment confirmed successfully",
  "paymentId": "uuid-aqui",
  "creditsAdded": 500
}
```

### Resposta de Erro
```json
{
  "status": "1",
  "message": "Payment not found or already processed",
  "error": "PAYMENT_NOT_FOUND"
}
```

---

## 🧪 Como Testar Após Confirmação da É-kwanza

### 1. Teste Manual de Webhook

```bash
# Simular webhook da É-kwanza
curl -X POST https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/ekwanza-webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: HASH_CALCULADO_AQUI" \
  -d '{
    "code": "EKZ-TEST123",
    "operationCode": "OP-TEST456",
    "amount": 1000,
    "status": "PAID",
    "merchantNumber": "01465115"
  }'
```

### 2. Verificar Logs do Webhook

Acessar: `https://supabase.com/dashboard/project/hwxxcprqxqznselwzghi/functions/ekwanza-webhook/logs`

**O que procurar:**
- ✅ Requisições recebidas
- ✅ Validação de assinatura bem-sucedida
- ✅ Pagamento encontrado e atualizado
- ✅ Créditos adicionados ao usuário
- ✅ Sem erros no processamento

### 3. Validar no Dashboard Admin

1. Acessar: **Admin → Pagamentos É-kwanza**
2. Localizar o pagamento de teste
3. Verificar status atualizado para "Pago"
4. Confirmar que créditos foram adicionados

---

## 🔍 Possíveis Respostas da É-kwanza

### Resposta Positiva ✅
```
"Confirmamos que a URL de notificação foi configurada com sucesso 
para o Merchant ID 01465115. Podem iniciar os testes."
```

**Próximo Passo:** Executar FASE 3 (Testar QR Code)

---

### Resposta com Pendências ⏳
```
"Recebemos a solicitação. A URL será configurada nos próximos 2 dias úteis."
```

**Próximo Passo:** Aguardar confirmação e continuar com testes locais (sem webhook)

---

### Resposta com Requisitos Adicionais 📋
```
"Precisamos de mais informações: IP do servidor, certificado SSL, etc."
```

**Próximo Passo:** Fornecer informações adicionais:
- IP do Supabase Edge Function (dinâmico, explicar que é serverless)
- Certificado SSL (Supabase gerencia automaticamente)
- Formato de payload desejado

---

## 📞 Contatos de Emergência

Se não houver resposta em 3 dias úteis:

**Escalar para:**
- Gerente de Conta É-kwanza
- Suporte técnico prioritário: suporte-tech@e-kwanza.ao
- WhatsApp/Telefone de emergência (solicitar previamente)

---

## ✅ Confirmação Recebida - Próximos Passos

Quando a É-kwanza confirmar a configuração do webhook:

1. [ ] Atualizar este documento com confirmação
2. [ ] Executar teste manual do webhook
3. [ ] Validar logs do Supabase
4. [ ] Criar pagamento real de teste (valor mínimo)
5. [ ] Confirmar recebimento automático de créditos
6. [ ] Marcar FASE 2 como concluída
7. [ ] Iniciar FASE 3 (Testar QR Code em produção)

---

**Status da FASE 2:** ⏳ Aguardando confirmação da É-kwanza

**Data de Envio do Email:** ___/___/2025  
**Data de Confirmação:** ___/___/2025  

---

*Este documento será atualizado conforme respostas da É-kwanza.*
