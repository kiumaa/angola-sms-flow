# Especificação: Fluxo de Sender ID Customizado via BulkSMS

## Visão Geral
Sistema de aprovação interna de Sender IDs personalizados, controlado 100% pela SMS.AO, sem dependência de aprovações externas de gateways. Os usuários solicitam Sender IDs que são aprovados internamente pelos administradores e depois utilizados para envio via BulkSMS.

---

## 1. Estrutura do Banco de Dados

### Tabela `sender_ids` (Já Implementada) ✅

```sql
CREATE TABLE public.sender_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  sender_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending'::text CHECK (status IN ('pending', 'approved', 'rejected')),
  is_default BOOLEAN DEFAULT false,
  bulksms_status TEXT DEFAULT 'pending'::text,
  bulkgate_status TEXT DEFAULT 'pending'::text,
  supported_gateways TEXT[] DEFAULT ARRAY['bulksms'::text],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies já configuradas
-- Users can view/create/update own sender IDs
-- Admins can manage all sender IDs
```

### Campos Principais:
- `id`: Chave primária
- `user_id`: FK para o usuário solicitante
- `sender_id`: O nome do remetente (max. 11 caracteres)
- `status`: Estado geral (`pending`, `approved`, `rejected`)
- `is_default`: Se é o sender padrão do usuário
- `supported_gateways`: Gateways onde o sender será usado
- `bulksms_status`/`bulkgate_status`: Status específico por gateway

---

## 2. Endpoints CRUD (Já Implementados) ✅

### Usuário - Via Interface Web:

**Criar Novo Sender ID:**
- **UI**: `/sender-ids` → Botão "Adicionar Novo Sender ID"
- **Backend**: Insertion direto via Supabase client
- **Dados**: `{ sender_id: string, user_id: auth.uid(), status: 'pending' }`

**Listar Sender IDs Próprios:**
- **UI**: `/sender-ids` → Tabela de Sender IDs do usuário
- **Query**: `SELECT * FROM sender_ids WHERE user_id = auth.uid()`

### Admin - Via Interface Web:

**Listar Pendentes:**
- **UI**: `/admin/sender-ids` → Filtro por status pendente
- **Query**: `SELECT * FROM sender_ids WHERE status = 'pending'`

**Aprovar/Rejeitar:**
- **UI**: `/admin/sender-ids` → Botões "Aprovar"/"Rejeitar"
- **Update**: `UPDATE sender_ids SET status = 'approved'|'rejected' WHERE id = ?`

---

## 3. Fluxo de Envio de SMS ✅

### Endpoint Existente: `/functions/v1/send-sms`

**Payload Aceito:**
```json
{
  "contacts": ["+244912345678", "+244987654321"],
  "message": "Texto da campanha",
  "senderId": "CUSTOM_SENDER",
  "campaignId": "optional-uuid",
  "isTest": false
}
```

### Validação de Sender ID (A Implementar):

**Código de Validação Necessário:**
```javascript
// No edge function send-sms/index.ts
async function validateSenderID(userId: string, senderId: string) {
  const { data: sender, error } = await supabase
    .from('sender_ids')
    .select('*')
    .eq('user_id', userId)
    .eq('sender_id', senderId)
    .eq('status', 'approved')
    .single();
    
  if (error || !sender) {
    throw new Error('Sender ID não aprovado ou não encontrado');
  }
  
  return sender;
}
```

### Integração com BulkSMS:

**Gateway Atual**: Routee (conforme edge function existente)
**Necessária Migração para BulkSMS** para usar Sender IDs aprovados

---

## 4. Interface do Usuário (Já Implementada) ✅

### Área do Usuário: `/sender-ids`
- ✅ Tabela com `sender_id`, `status`, `created_at`
- ✅ Botão "Adicionar Novo Sender ID" → Modal para inserir
- ✅ Badge de status (Pendente/Aprovado/Rejeitado)
- ✅ Opção "Definir como Padrão" para IDs aprovados

### Área Admin: `/admin/sender-ids`
- ✅ Tabela de solicitações com informações do usuário
- ✅ Botões "Aprovar" e "Rejeitar"
- ✅ Filtro de busca por ID, email ou nome
- ✅ Informações de critérios de aprovação

### Ao Criar Campanha:
- ✅ Dropdown pré-populado com Sender IDs aprovados
- ✅ Integração com perfil para Sender ID padrão

---

## 5. Configuração BulkSMS (A Implementar)

### Requisitos da Conta BulkSMS:
1. **Account Settings → Sender IDs**: Habilitar "Alphanumeric Senders"
2. **Pre-aprovação**: Todos os Sender IDs aprovados internamente devem estar liberados na conta admin BulkSMS
3. **API Credentials**: Token ID e Token Secret configurados nos secrets

### Secrets Necessários:
```
BULKSMS_TOKEN_ID=your_token_id
BULKSMS_TOKEN_SECRET=your_token_secret
```

### Gateway Configuration:
```javascript
// Exemplo de configuração BulkSMS
const bulkSMSConfig = {
  tokenId: Deno.env.get('BULKSMS_TOKEN_ID'),
  tokenSecret: Deno.env.get('BULKSMS_TOKEN_SECRET'),
  baseUrl: 'https://api.bulksms.com/v1'
};
```

---

## 6. Tratamento de Erros & Validações ✅

### Validações Implementadas:
- ✅ Máximo 11 caracteres para Sender ID
- ✅ Apenas usuários autenticados podem criar
- ✅ RLS impede acesso não autorizado
- ✅ Status deve ser válido ('pending', 'approved', 'rejected')

### Tratamento de Erros a Implementar:

**Se BulkSMS retornar "Invalid Sender":**
```json
{
  "success": false,
  "error": "Sender ID inválido ou não suportado pelo provedor."
}
```

**Validação antes do envio:**
```javascript
try {
  await validateSenderID(user.id, senderId);
  // Proceder com envio via BulkSMS
} catch (error) {
  return {
    success: false,
    error: error.message
  };
}
```

---

## 7. Testes (Guia para Implementação)

### Testes Automatizados Sugeridos:
1. **Fluxo Completo**: Solicitação → Aprovação → Envio bem-sucedido
2. **Rejeição**: Tentativa de envio com sender não-aprovado → Falha controlada
3. **Validação**: Campos obrigatórios e limites de caracteres

### Testes Manuais:

**Teste via cURL:**
```bash
curl -X POST https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/send-sms \
  -H "Authorization: Bearer <supabase_anon_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "contacts":["+244912345678"],
    "message":"Teste de envio",
    "senderId":"MINHAREMETENTE"
  }'
```

**Teste via Interface:**
1. Criar novo Sender ID
2. Admin aprovar o Sender ID
3. Definir como padrão
4. Enviar campanha teste

---

## 8. Implementações Pendentes

### 🔄 Migração de Gateway:
- **Atual**: Routee
- **Necessário**: BulkSMS para suporte completo a Sender IDs customizados
- **Localização**: `supabase/functions/send-sms/index.ts`

### 🔄 Validação de Sender ID:
- Adicionar validação no edge function `send-sms`
- Verificar se Sender ID está aprovado antes do envio

### ✅ Interface Completa:
- Interface do usuário implementada
- Interface do admin implementada
- Integração com campanhas implementada

---

## 9. Fluxo de Uso Completo

### Para o Usuário:
1. **Solicitar**: Ir em `/sender-ids` → "Adicionar Novo Sender ID"
2. **Aguardar**: Status fica "Pendente" até aprovação admin
3. **Usar**: Após aprovação, definir como padrão ou usar em campanhas

### Para o Admin:
1. **Revisar**: Ir em `/admin/sender-ids` → Ver solicitações pendentes
2. **Avaliar**: Verificar se atende critérios (relacionado ao negócio, max 11 chars, etc.)
3. **Aprovar/Rejeitar**: Clicar em "Aprovar" ou "Rejeitar"

### Para Envio de SMS:
1. **Selecionar**: Escolher Sender ID aprovado na criação da campanha
2. **Validar**: Sistema verifica se está aprovado
3. **Enviar**: Via BulkSMS usando conta admin da SMS.AO

---

## 10. Status da Implementação

| Componente | Status | Localização |
|-----------|--------|-------------|
| Banco de Dados | ✅ Implementado | Tabela `sender_ids` |
| Interface Usuário | ✅ Implementado | `/sender-ids` |
| Interface Admin | ✅ Implementado | `/admin/sender-ids` |
| RLS Policies | ✅ Implementado | Supabase |
| Edge Function Base | ✅ Implementado | `send-sms/index.ts` |
| Validação Sender ID | 🔄 Pendente | `send-sms/index.ts` |
| Gateway BulkSMS | 🔄 Pendente | Migrar de Routee |
| Testes Automatizados | 📋 Planejado | - |

**Próximos Passos:**
1. Implementar validação de Sender ID no edge function
2. Considerar migração para BulkSMS se necessário
3. Adicionar testes automatizados
4. Documentar processo de configuração BulkSMS

---

**Documentação gerada em:** `docs/sender-id-customizado-especificacao.md`
**Última atualização:** Janeiro 2025
**Versão:** 1.0