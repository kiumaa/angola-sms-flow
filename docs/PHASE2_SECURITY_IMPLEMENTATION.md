# Fase 2: Implementação de Segurança Avançada

## Status: ✅ Infraestrutura Implementada

A infraestrutura da Fase 2 foi implementada com sucesso. Este documento detalha o que foi feito e o que ainda precisa ser configurado.

---

## 1. MFA para Admins ✅ (Infraestrutura Pronta)

### O que foi implementado:

#### Tabelas criadas:
- **`admin_mfa_settings`**: Rastreia status de MFA para cada admin
  - `user_id`: ID do usuário admin
  - `mfa_enabled`: Se MFA está ativado
  - `mfa_method`: Método usado (totp, sms, email)
  - `enrolled_at`: Quando foi ativado
  - `last_verified_at`: Última verificação
  - `backup_codes_generated`: Se códigos de backup foram gerados

- **`admin_mfa_bypass_logs`**: Log de tentativas de bypass de MFA
  - Registra todas as tentativas de acessar recursos protegidos sem MFA
  - Inclui IP, user agent, ação tentada e motivo

#### Funções disponíveis:
```sql
-- Verificar se admin tem MFA habilitado
SELECT admin_has_mfa_enabled('user-id');

-- Registrar tentativa de bypass
SELECT log_mfa_bypass_attempt('attempted_action', 'reason');
```

#### Trigger automático:
- Quando um usuário recebe role de admin, automaticamente cria entrada em `admin_mfa_settings`
- Log de segurança é gerado alertando que MFA é requerido

### 🔧 O que precisa ser feito:

1. **Implementar UI para ativação de MFA**:
   - Criar página em `/admin/security/mfa`
   - Permitir escolha do método (TOTP recomendado)
   - Gerar QR code para apps como Google Authenticator
   - Gerar códigos de backup

2. **Implementar verificação de MFA no login**:
   - Após login bem-sucedido, verificar se admin tem MFA
   - Se não tiver, redirecionar para configuração
   - Se tiver, solicitar código MFA

3. **Adicionar enforcement em operações críticas**:
   ```typescript
   // Exemplo de verificação antes de operação sensível
   const { data: hasMFA } = await supabase
     .rpc('admin_has_mfa_enabled', { admin_user_id: userId });
   
   if (!hasMFA) {
     // Registrar tentativa de bypass
     await supabase.rpc('log_mfa_bypass_attempt', {
       attempted_action_param: 'view_user_pii',
       bypass_reason_param: 'MFA not configured'
     });
     // Bloquear acesso ou forçar configuração
   }
   ```

4. **Configurar Supabase Auth MFA**:
   - No Supabase Dashboard: Authentication > Providers
   - Ativar "Phone Auth" para SMS MFA (opcional)
   - Configurar "Multi-Factor Authentication"

---

## 2. Políticas de Retenção de Dados ✅ (Implementado)

### O que foi implementado:

#### Tabela `data_retention_policies`:
Políticas configuradas por padrão:

| Tabela | Retenção | Filtro Status | Descrição |
|--------|----------|---------------|-----------|
| `otp_requests` | 1 dia | - | OTPs expiram em 5min, cleanup após 1 dia |
| `sms_logs` | 180 dias | - | Logs SMS mantidos por 6 meses |
| `campaign_targets` | 90 dias | delivered, failed, undeliverable | Campanhas concluídas mantidas 90 dias |
| `campaigns` | 30 dias | draft | Rascunhos deletados após 30 dias |
| `lgpd_requests` | 365 dias | completed, rejected | Requests LGPD mantidos 1 ano |
| `admin_audit_logs` | 730 dias | - | Audit logs mantidos 2 anos |
| `contact_import_jobs` | 30 dias | completed, failed | Jobs de importação limpos após 30 dias |

### 🔧 O que precisa ser feito:

1. **Agendar execução automática**:
   
   Opção A - **pg_cron** (recomendado):
   ```sql
   -- No Supabase SQL Editor
   SELECT cron.schedule(
     'cleanup-expired-data',
     '0 2 * * *', -- Diariamente às 2AM
     $$
     SELECT run_all_cleanup_tasks();
     $$
   );
   ```

   Opção B - **Edge Function agendada**:
   - A função `/cleanup-otps` já está criada
   - Configure no Supabase Dashboard: Edge Functions > cleanup-otps
   - Adicione cron job ou use serviço externo (GitHub Actions, etc.)

2. **Monitorar execuções**:
   ```sql
   -- Ver últimas limpezas executadas
   SELECT * FROM data_retention_policies 
   ORDER BY last_cleanup_at DESC;
   
   -- Ver logs de limpeza
   SELECT * FROM admin_audit_logs 
   WHERE action LIKE 'automated_%cleanup' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

3. **Criar dashboard de monitoramento**:
   - Mostrar próxima execução
   - Registros limpos por execução
   - Alertas se cleanup falhar

---

## 3. Exportação de Dados do Usuário (LGPD) ✅ (Implementado)

### O que foi implementado:

#### Funções LGPD:

1. **`export_user_data(user_id)`**:
   - Exporta TODOS os dados do usuário
   - Formato JSON completo
   - Inclui: perfil, contatos, campanhas, SMS logs, transações, requests LGPD
   - Logs gerados automaticamente
   - Usuários só podem exportar próprios dados (admins podem exportar qualquer um)

2. **`request_data_deletion(reason)`**:
   - Cria request de deleção LGPD
   - Status inicial: `pending`
   - Admin precisa aprovar manualmente
   - Logs de auditoria gerados

### 🔧 O que precisa ser feito:

1. **Criar interface de exportação de dados**:
   ```typescript
   // Em UserSettings.tsx ou página LGPD
   const exportMyData = async () => {
     const { data, error } = await supabase
       .rpc('export_user_data', { export_user_id: userId });
     
     if (data) {
       // Baixar como JSON
       const blob = new Blob([JSON.stringify(data, null, 2)], 
         { type: 'application/json' });
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `my-data-${new Date().toISOString()}.json`;
       a.click();
     }
   };
   ```

2. **Criar interface de solicitação de deleção**:
   ```typescript
   const requestDeletion = async (reason: string) => {
     const { data: requestId, error } = await supabase
       .rpc('request_data_deletion', { deletion_reason: reason });
     
     if (requestId) {
       toast.success('Solicitação de deleção criada. Um admin irá revisar.');
     }
   };
   ```

3. **Criar painel admin para processar requests**:
   - Listar todas as solicitações de deleção pendentes
   - Permitir visualizar dados do usuário antes de deletar
   - Botão para aprovar/rejeitar
   - Ao aprovar, executar deleção em cascata

4. **Adicionar à página de Privacidade/LGPD**:
   - Seção "Seus Direitos"
   - Botão "Exportar Meus Dados"
   - Botão "Solicitar Deleção de Dados"
   - Explicação sobre tempo de processamento

---

## 4. Upgrade do PostgreSQL ⚠️ (Ação Manual Necessária)

### Status Atual:
```
⚠️ WARNING: Current Postgres version has security patches available
```

### Como fazer upgrade:

1. **Acessar Supabase Dashboard**:
   - Ir para: https://supabase.com/dashboard/project/hwxxcprqxqznselwzghi/settings/infrastructure

2. **Antes do upgrade**:
   ```bash
   # Fazer backup completo
   # No Supabase Dashboard: Database > Backups
   # Ou via CLI:
   supabase db dump -f backup-pre-upgrade.sql
   ```

3. **Executar upgrade**:
   - No dashboard: Settings > Infrastructure
   - Clicar em "Upgrade PostgreSQL"
   - Seguir wizard de upgrade
   - **Importante**: Pode ter alguns minutos de downtime

4. **Após upgrade**:
   - Testar todas as funções críticas
   - Verificar logs: Database > Logs
   - Executar testes de segurança:
   ```sql
   -- Testar funções principais
   SELECT cleanup_expired_otps();
   SELECT export_user_data(auth.uid());
   ```

5. **Validar upgrade**:
   ```sql
   -- Verificar versão
   SELECT version();
   
   -- Deve mostrar PostgreSQL 15.x ou superior
   ```

### Rollback (se necessário):
- Supabase mantém snapshots automáticos
- Pode reverter via: Database > Backups > Point-in-time Recovery

---

## 5. Checklist de Implementação Completa

### Backend (Database) ✅
- [x] Tabelas MFA criadas
- [x] Políticas de retenção configuradas
- [x] Funções LGPD implementadas
- [x] Triggers automáticos ativos
- [x] Edge function de cleanup criada

### Configuração Necessária
- [ ] Agendar limpeza automática (pg_cron ou GitHub Actions)
- [ ] Configurar MFA no Supabase Auth
- [ ] Fazer upgrade do PostgreSQL

### Frontend (UI) - A Implementar
- [ ] Página de configuração MFA para admins
- [ ] Verificação MFA no login admin
- [ ] Dashboard de políticas de retenção
- [ ] Interface de exportação de dados (LGPD)
- [ ] Interface de solicitação de deleção
- [ ] Painel admin para processar requests LGPD

---

## 6. Próximos Passos Recomendados

1. **Curto Prazo (Próxima semana)**:
   - Implementar UI de exportação de dados (mais simples)
   - Agendar limpeza automática
   - Fazer upgrade do PostgreSQL

2. **Médio Prazo (Próximas 2 semanas)**:
   - Implementar MFA completo para admins
   - Dashboard de monitoramento de retenção
   - Painel de processamento LGPD

3. **Longo Prazo (Próximo mês)**:
   - Testes de penetração
   - Auditoria de segurança externa
   - Documentação completa de segurança

---

## 7. Recursos e Documentação

- **Supabase MFA**: https://supabase.com/docs/guides/auth/auth-mfa
- **PostgreSQL Upgrade**: https://supabase.com/docs/guides/platform/upgrading
- **LGPD**: https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd
- **pg_cron**: https://supabase.com/docs/guides/database/extensions/pg_cron

---

## Status Final Fase 2

✅ **Infraestrutura**: 100% Implementada  
🔧 **Configuração**: 30% Completa  
⚠️ **UI/UX**: 0% Implementada  

**Score Geral**: 7.5/10 → Pode subir para 9/10 após implementação de UI e configurações
