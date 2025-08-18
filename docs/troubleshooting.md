# Troubleshooting Guide - SMS Marketing Angola

## 🚨 Problemas Comuns & Soluções

### 📱 Problemas com SMS

#### SMS não está sendo enviado
**Sintomas:** Campanhas ficam com status "Enviando" indefinidamente

**Soluções:**
1. Verifique se há gateways ativos configurados:
   ```
   Admin → Gateways SMS → Verificar status
   ```

2. Confirme se há créditos suficientes:
   ```
   Dashboard → Verificar saldo de créditos
   ```

3. Verifique os logs dos workers:
   ```bash
   # No console do Supabase
   SELECT * FROM postgres_logs WHERE event_message LIKE '%campaign-worker%'
   ```

#### Mensagens chegam com atraso
**Causa:** Rate limiting ou problemas no gateway

**Soluções:**
1. Verifique a configuração de rate limiting
2. Considere usar múltiplos gateways
3. Monitore o status dos gateways em tempo real

#### SMS não é entregue
**Sintomas:** Status mostra "Enviado" mas não "Entregue"

**Verificações:**
1. Números de telefone estão no formato correto (+244...)
2. Gateway está respondendo aos webhooks
3. Verifique logs de entrega no painel admin

### 🔐 Problemas de Autenticação

#### OTP não chega
**Soluções:**
1. Verificar configuração dos gateways SMS
2. Confirmar se o número está no formato internacional
3. Verificar se não há bloqueios por rate limiting

#### Usuário não consegue fazer login
**Verificações:**
1. Conta está ativa (não bloqueada)
2. Email foi confirmado
3. Tentar redefinir senha

### 💾 Problemas com Banco de Dados

#### Erro de conexão com Supabase
```
Error: Failed to fetch
```

**Soluções:**
1. Verificar se as keys estão corretas
2. Confirmar se o projeto Supabase está ativo
3. Verificar políticas RLS

#### Dados não aparecem
**Verificações:**
1. RLS policies estão configuradas corretamente
2. Usuário tem permissões adequadas
3. Dados existem na tabela

### 🚀 Problemas de Performance

#### Interface lenta
**Soluções:**
1. Ativar cache no browser
2. Verificar conexão de internet
3. Limpar cache e cookies

#### Campanhas demoram para processar
**Otimizações:**
1. Reduzir tamanho das listas de contatos
2. Verificar se workers estão funcionando
3. Aumentar rate limiting se necessário

### 📊 Problemas com Relatórios

#### Dados não aparecem no dashboard
**Verificações:**
1. Aguardar sincronização (até 2 minutos)
2. Verificar se há dados no período selecionado
3. Confirmar permissões de acesso

#### Exportação falha
**Soluções:**
1. Reduzir período de exportação
2. Tentar em horário de menor uso
3. Verificar se há dados para exportar

## 🔧 Comandos de Debug

### Verificar Status do Sistema
```javascript
// No console do browser
console.log('Health Check:', await fetch('/api/health').then(r => r.json()));
```

### Limpar Cache Local
```javascript
// No console do browser
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Verificar Conectividade Supabase
```javascript
// No console
import { supabase } from './src/integrations/supabase/client';
const { data, error } = await supabase.from('profiles').select('id').limit(1);
console.log('Supabase test:', { data, error });
```

## 📞 Quando Contatar o Suporte

Entre em contato se:
- ✅ Problema persiste após tentar as soluções
- ✅ Múltiplos usuários reportam o mesmo problema
- ✅ Problemas críticos que afetam o negócio
- ✅ Suspeita de problemas de segurança

## 🛠️ Informações para Suporte

Ao reportar problemas, inclua:

**Informações Básicas:**
- URL da página onde ocorreu o problema
- Mensagem de erro completa
- Horário aproximado do problema
- Browser e versão

**Para Problemas de SMS:**
- ID da campanha afetada
- Números de telefone (últimos 4 dígitos)
- Gateway usado
- Logs relevantes

**Para Problemas de Performance:**
- Tamanho da lista de contatos
- Tipo de operação sendo realizada
- Horário do problema

## 📱 Contatos de Suporte

**Email:** suporte@smsmarketing.ao
**WhatsApp:** +244 XXX XXX XXX
**Horário:** Segunda a Sexta, 8h às 18h (WAT)

**Discord:** [Lovable Community](https://discord.com/channels/1119885301872070706/1280461670979993613)

## 🔄 Status do Sistema

Verifique o status em tempo real:
- **Status Page:** [status.smsmarketing.ao](status.smsmarketing.ao)
- **Monitoramento:** Admin Panel → System Health

---

**💡 Dica:** Mantenha este guia sempre atualizado conforme novos problemas são identificados e solucionados.