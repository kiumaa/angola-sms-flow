# PostgreSQL Upgrade Guide - Phase 2

## Overview
Este documento fornece instruções detalhadas para o upgrade do PostgreSQL para aplicar patches de segurança importantes.

## ⚠️ Status Atual
- **Versão Atual**: PostgreSQL 15.x
- **Ação Necessária**: Upgrade para versão mais recente
- **Criticidade**: MÉDIA (patches de segurança disponíveis)
- **Impacto**: Baixo (compatibilidade garantida)

## 📋 Pré-requisitos

### 1. Backup Completo
Antes de iniciar o upgrade, é OBRIGATÓRIO criar um backup completo:

```bash
# Via Supabase Dashboard:
1. Acesse: https://supabase.com/dashboard/project/hwxxcprqxqznselwzghi/settings/database
2. Clique em "Create Backup"
3. Aguarde conclusão e verifique o backup
```

### 2. Teste em Ambiente de Staging
Se possível, teste o upgrade em um ambiente de staging primeiro:
- Clone o projeto
- Execute o upgrade
- Teste todas as funcionalidades críticas

### 3. Janela de Manutenção
- **Duração estimada**: 30-60 minutos
- **Downtime esperado**: 5-10 minutos
- **Horário recomendado**: Madrugada ou baixa utilização

## 🚀 Processo de Upgrade

### Método 1: Via Supabase Dashboard (Recomendado)

1. **Acesse o Dashboard**
   ```
   https://supabase.com/dashboard/project/hwxxcprqxqznselwzghi/settings/database
   ```

2. **Inicie o Upgrade**
   - Localize seção "Database Version"
   - Clique em "Upgrade Database"
   - Selecione a versão mais recente disponível
   - Confirme o upgrade

3. **Aguarde a Conclusão**
   - O processo é automático
   - Você receberá notificações de progresso
   - Não interrompa o processo

### Método 2: Via Supabase CLI

```bash
# 1. Login no Supabase
supabase login

# 2. Link ao projeto
supabase link --project-ref hwxxcprqxqznselwzghi

# 3. Verificar versão atual
supabase db version

# 4. Executar upgrade
supabase db upgrade
```

## ✅ Validação Pós-Upgrade

### 1. Verificar Versão
```sql
SELECT version();
```

### 2. Testar Funções Críticas
```sql
-- Teste funções de segurança
SELECT admin_has_mfa_enabled('test-uuid');
SELECT * FROM export_user_data('test-uuid');

-- Teste funções de limpeza
SELECT cleanup_expired_otps();

-- Teste criptografia
SELECT encrypt_smtp_password('test');
SELECT encrypt_pii('test data');
```

### 3. Verificar Políticas RLS
```sql
-- Executar queries de teste para cada tabela crítica
SELECT * FROM profiles LIMIT 1;
SELECT * FROM contacts LIMIT 1;
SELECT * FROM sms_logs LIMIT 1;
```

### 4. Teste Funcional Completo
- [ ] Login de usuário
- [ ] Login de admin
- [ ] Envio de SMS
- [ ] Criação de contatos
- [ ] Criação de campanhas
- [ ] Visualização de relatórios
- [ ] Funções de admin

## 🔄 Rollback (Se Necessário)

### Opção 1: Restore do Backup
```bash
# Via Dashboard
1. Acesse: Settings > Database
2. Localize o backup pré-upgrade
3. Clique em "Restore"
4. Confirme a operação
```

### Opção 2: Via CLI
```bash
supabase db backup restore <backup-id>
```

## 📊 Checklist de Upgrade

### Antes do Upgrade
- [ ] Backup completo criado e verificado
- [ ] Documentação de todas as configurações
- [ ] Comunicação enviada aos usuários
- [ ] Equipe de suporte em standby
- [ ] Ambiente de teste validado (se possível)

### Durante o Upgrade
- [ ] Monitoramento ativo do processo
- [ ] Log de todos os eventos
- [ ] Comunicação de status atualizada

### Após o Upgrade
- [ ] Versão do PostgreSQL verificada
- [ ] Todas as funções testadas
- [ ] Políticas RLS validadas
- [ ] Testes funcionais completos passaram
- [ ] Performance verificada
- [ ] Logs revisados
- [ ] Usuários notificados da conclusão

## 🎯 Benefícios Esperados

1. **Patches de Segurança**
   - Vulnerabilidades conhecidas corrigidas
   - Melhorias no sistema de autenticação
   - Proteção contra exploits recentes

2. **Performance**
   - Otimizações de query planner
   - Melhor uso de índices
   - Redução no uso de memória

3. **Recursos Novos**
   - Funcionalidades adicionais do PostgreSQL
   - Melhor suporte a JSON
   - Novas funções built-in

## 📞 Suporte

### Em Caso de Problemas

1. **Suporte Supabase**
   - Discord: https://discord.supabase.com
   - Email: support@supabase.io
   - Docs: https://supabase.com/docs/guides/platform/upgrading

2. **Logs para Análise**
   ```bash
   # Coletar logs do upgrade
   supabase db logs --level error
   ```

3. **Equipe Interna**
   - Revisar logs de erro
   - Executar rollback se necessário
   - Documentar problemas encontrados

## 📝 Notas Importantes

- O upgrade NÃO afetará seus dados
- As conexões existentes podem ser temporariamente interrompidas
- Edge functions podem ter breve indisponibilidade
- Recomenda-se executar em horário de baixa utilização
- Backup é ESSENCIAL antes de qualquer upgrade

## 🔒 Considerações de Segurança

- Senhas e credenciais permanecem criptografadas
- Políticas RLS são preservadas
- Funções SECURITY DEFINER mantêm suas permissões
- Audit logs são preservados
- Não há exposição de dados durante o processo

## Conclusão

Este upgrade é recomendado para manter a segurança e performance do sistema. Seguindo este guia, o processo deve ser seguro e sem problemas.

**Data de Criação**: 2025-10-04  
**Última Atualização**: 2025-10-04  
**Status**: PENDENTE
