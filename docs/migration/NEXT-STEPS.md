# Próximos Passos da Migração - AÇÃO NECESSÁRIA

## ⚠️ ANTES DE CONTINUAR

### 1. Documentar Valores dos Secrets (URGENTE)

Aceder ao Supabase Dashboard e preencher os valores em `docs/migration/secrets-documentation.md`:

**Como obter os valores:**
```bash
1. Ir para: Supabase Dashboard > Project Settings > Edge Functions > Secrets
2. Copiar valores de cada secret:
   - BULKSMS_TOKEN_ID
   - BULKSMS_TOKEN_SECRET
   - BULKGATE_API_KEY
   - Todos os EKWANZA_* (12 secrets)
   - OTP_PEPPER
```

**⚠️ CRÍTICO:** Guardar estes valores num local seguro (password manager), pois serão necessários para reconfigurar no Lovable Cloud.

---

### 2. Decisão sobre SMTP

**Pergunta:** O projeto precisa de enviar emails (confirmação, recuperação password)?

- [ ] **SIM** - Documentar configuração SMTP atual ou definir provider
- [ ] **NÃO** - Remover funções de email antes da migração

**Se SIM, adicionar estes secrets:**
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASSWORD
- SMTP_FROM_EMAIL
- SMTP_FROM_NAME

---

### 3. Verificar Dados de Produção

**Executar no Supabase SQL Editor:**

```sql
-- Obter contagem de registos para validação pós-migração
SELECT 
  'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'contacts', COUNT(*) FROM contacts
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'sms_logs', COUNT(*) FROM sms_logs
UNION ALL
SELECT 'campaigns', COUNT(*) FROM campaigns
UNION ALL
SELECT 'sender_ids', COUNT(*) FROM sender_ids;
```

**Guardar resultado para comparação após migração.**

---

### 4. Agendar Janela de Manutenção

**Quando fazer a migração?**

**Downtime estimado:** 30 min - 2 horas

**Opções recomendadas:**
- [ ] Madrugada (02h00 - 04h00) - Menos utilizadores
- [ ] Fim-de-semana (Sábado à tarde)
- [ ] Feriado

**Data proposta:** _______________________

**Comunicar aos utilizadores:**
```
📢 Manutenção Programada

Data: [DATA]
Horário: [HORA INÍCIO] - [HORA FIM]
Impacto: Plataforma indisponível temporariamente

Motivo: Atualização de infraestrutura para melhor 
desempenho e gestão.

Durante a manutenção:
- Não será possível enviar SMS
- Não será possível fazer login
- Pagamentos não estarão disponíveis

Agradecemos a compreensão.
```

---

## ✅ Após Completar os 4 Passos Acima

### Próxima Fase: Consolidação de Schema

**O que vou fazer:**
1. Consolidar as 186 migrações SQL num único ficheiro
2. Extrair todas as funções PostgreSQL
3. Extrair todas as políticas RLS
4. Extrair todos os triggers
5. Criar script de validação

**Tempo estimado:** 30-60 minutos

**Comando para continuar:**
```
"Continuar com a consolidação do schema SQL"
```

---

## 📋 Checklist de Preparação

### Documentação
- [ ] Valores dos 18 secrets documentados
- [ ] Decisão sobre SMTP tomada
- [ ] Contagem de registos obtida
- [ ] Janela de manutenção agendada
- [ ] Utilizadores notificados

### Backups
- [ ] Backup automático do Supabase ativo
- [ ] Export manual via Dashboard feito
- [ ] Código em git commitado
- [ ] Screenshots de configurações importantes

### Comunicação
- [ ] Email de aviso enviado aos utilizadores
- [ ] Status page atualizado (se existir)
- [ ] Equipa de suporte preparada

---

## 🚨 Riscos Identificados

### Alto Risco
1. **Migração de auth.users** - Pode requerer re-registo de utilizadores
2. **Secrets incorretos** - Bloqueiam SMS e pagamentos
3. **Webhooks externos** - URLs podem precisar atualização

### Médio Risco
4. **RLS Policies** - Erros de permissão se mal aplicadas
5. **Downtime prolongado** - Se houver problemas imprevistos

### Baixo Risco
6. **Performance** - Lovable Cloud pode ter latência diferente
7. **Logs temporários** - Alguns logs podem não migrar

---

## 📞 Suporte Durante Migração

**Equipa disponível:**
- [ ] Desenvolvedor principal: _________________
- [ ] Admin de sistemas: _________________
- [ ] Suporte ao cliente: _________________

**Contactos de emergência:**
- Lovable Support: Chat no dashboard
- Supabase Support: support@supabase.com
- eKwanza Support: ekwanzapartnersao@e-kwanza.co.ao

---

## 🎯 Objetivo Final

Após migração completa:
- ✅ Todos os utilizadores podem fazer login
- ✅ Envio de SMS funciona (BulkSMS + BulkGate)
- ✅ Pagamentos eKwanza funcionam (Ticket + MCX + Referência)
- ✅ Webhooks recebem confirmações
- ✅ Admin pode gerir sistema
- ✅ Zero perda de dados
- ✅ Performance igual ou superior

---

**Última atualização:** 2025-11-27
**Status:** Aguardando documentação de secrets e decisão sobre SMTP
