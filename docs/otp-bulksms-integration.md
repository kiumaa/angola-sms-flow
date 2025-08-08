# Integração OTP com BulkSMS

Este documento descreve a implementação do envio de códigos OTP via BulkSMS.

## 1. Implementação do Gateway BulkSMS

O método `sendOtpCode` foi adicionado ao `BulkSMSGateway`:

```typescript
async sendOtpCode(phone: string, code: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch('https://api.bulksms.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthHeader()
      },
      body: JSON.stringify({
        messages: [{
          to: phone,
          from: 'SMSAO',
          content: `Seu código de acesso é: ${code}`
        }]
      })
    });

    const result = await response.json();
    // Handle response...
  } catch (error) {
    // Handle error...
  }
}
```

## 2. Edge Function `/send-otp`

Uma edge function foi criada para lidar com o envio de OTP:

- **URL**: `/functions/v1/send-otp`  
- **Método**: POST
- **Autenticação**: Bearer Token (JWT)
- **Body**: `{ phone: string, code: string }`

### Funcionalidades:
- Autenticação do usuário via Supabase JWT
- Envio do SMS via BulkSMS API
- Log do SMS na tabela `sms_logs`
- Tratamento de erros de rede/API

## 3. Integração com useOTP Hook

O hook `useOTP` foi atualizado para:
- Chamar a edge function `send-otp` após criar o registro OTP
- Tratar erros de envio de SMS
- Manter a mesma interface pública

## 4. Configuração de Credenciais

As seguintes variáveis de ambiente são necessárias:

```bash
BULKSMS_TOKEN_ID=sua_token_id
BULKSMS_TOKEN_SECRET=sua_token_secret
```

## 5. Teste Manual com cURL

```bash
# Teste direto da API BulkSMS
curl -u "${BULKSMS_TOKEN_ID}:${BULKSMS_TOKEN_SECRET}" \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"to":"+244923456789","from":"SMSAO","content":"Seu código é 123456"}]}' \
     https://api.bulksms.com/v1/messages

# Teste da edge function
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"phone":"+244923456789","code":"123456"}' \
     https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/send-otp
```

## 6. Logs e Monitoramento

Todos os SMS enviados são registrados na tabela `sms_logs` com:
- `gateway`: 'bulksms'
- `sender`: 'SMSAO'
- `to`: número de destino
- `message`: conteúdo do SMS
- `batch_id`: ID da mensagem do BulkSMS
- `status`: 'submitted'
- `user_id`: ID do usuário solicitante

## 7. Tratamento de Erros

A implementação trata os seguintes cenários de erro:
- Credenciais BulkSMS não configuradas
- Falha na API do BulkSMS
- Problemas de rede
- Usuário não autenticado
- Parâmetros inválidos

Em caso de falha, retorna status HTTP 500 com `{ error: 'Falha ao enviar OTP' }`.