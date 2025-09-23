# ⚙️ Painel Administrativo - SMS AO

Guia completo para administradores da plataforma SMS AO.

## 🚀 Acesso Administrativo

### Login de Admin
1. Acesse a plataforma normalmente
2. Faça login com sua conta administrativa
3. O painel admin aparecerá automaticamente no menu

### Permissões
Apenas usuários com role `admin` têm acesso às funcionalidades administrativas.

## 📊 Dashboard Administrativo

### Métricas Globais
- **Usuários Ativos**: Total de usuários registrados
- **SMS Enviados (Mês)**: Volume mensal da plataforma
- **Receita (Mês)**: Faturamento em Kwanzas
- **Taxa de Entrega Global**: Performance dos gateways

### Widgets de Monitoramento
- **Transações Pendentes**: Compras aguardando aprovação
- **Sender IDs Pendentes**: Solicitações para aprovar
- **Campanhas Ativas**: Campanhas em execução
- **Alertas do Sistema**: Problemas que requerem atenção

## 👥 Gestão de Usuários

### Visualizar Usuários
Em **Admin** → **Usuários**:
- Lista completa de usuários
- Filtros: Status, data registro, créditos
- Busca por nome, email ou empresa
- Exportação de dados

### Criar Usuário
1. Clique **"Novo Usuário"**
2. Preencha dados obrigatórios:
   - Nome completo
   - Email
   - Telefone
   - Nome da empresa
3. Defina créditos iniciais (opcional)
4. Envie convite por email

### Editar Usuário
1. Encontre o usuário na lista
2. Clique **"Editar"**
3. Altere informações:
   - Dados pessoais
   - Status da conta
   - Créditos disponíveis
   - Role (admin/client)

### Gerenciar Créditos

#### Ajuste Manual
1. Acesse perfil do usuário
2. Clique **"Ajustar Créditos"**
3. Escolha operação:
   - **Adicionar**: Bônus ou recarga
   - **Remover**: Correção ou penalidade
   - **Definir**: Valor absoluto
4. Inclua justificativa obrigatória

#### Histórico de Ajustes
- Visualize todos os ajustes feitos
- Administrador responsável
- Data e justificativa
- Saldo anterior e novo

### Suspender/Reativar Usuários
Para usuários problemáticos:
1. Acesse perfil do usuário
2. Altere status para "Suspenso"
3. Usuário perde acesso temporariamente
4. Para reativar, altere status para "Ativo"

## 💳 Gestão Financeira

### Transações Pendentes
Lista de compras aguardando aprovação:
- **Dados do Cliente**: Nome, empresa, contato
- **Valor**: Quantia paga em Kwanzas
- **Créditos**: Quantidade solicitada
- **Comprovativo**: Anexo da transferência
- **Data**: Quando foi solicitado

### Aprovar Transação
1. Revise comprovativo de pagamento
2. Verifique dados bancários
3. Clique **"Aprovar"**
4. Créditos são adicionados automaticamente
5. Usuário recebe notificação

### Rejeitar Transação
1. Clique **"Rejeitar"**
2. Inclua motivo da rejeição
3. Usuário é notificado por email
4. Pode reenviar com correções

### Histórico de Transações
- Todas as transações (aprovadas/rejeitadas)
- Filtros por período, status, valor
- Relatório de receita mensal
- Exportação para contabilidade

## 📦 Gestão de Pacotes

### Pacotes Ativos
Visualize e edite pacotes de crédito:
- **Nome**: Identificação do pacote
- **Créditos**: Quantidade incluída
- **Preço**: Valor em Kwanzas
- **Desconto**: Percentual de economia
- **Status**: Ativo/Inativo

### Criar Novo Pacote
1. Vá para **Admin** → **Pacotes**
2. Clique **"Novo Pacote"**
3. Defina:
   - Nome do pacote
   - Quantidade de créditos
   - Preço em Kwanzas
   - Descrição promocional
4. Ative o pacote

### Descontos Especiais
Configure promoções temporárias:
1. Selecione pacote para desconto
2. Clique **"Adicionar Desconto"**
3. Configure:
   - Tipo: Percentual ou valor fixo
   - Vigência: Data início/fim
   - Descrição da promoção

## 📱 Gestão de Sender IDs

### Solicitações Pendentes
Lista de Sender IDs aguardando aprovação:
- **Usuário**: Quem solicitou
- **Sender ID**: Texto solicitado
- **Justificativa**: Motivo para uso
- **Data**: Quando foi solicitado

### Aprovar Sender ID
1. Revise se atende critérios:
   - Máximo 11 caracteres
   - Sem palavras ofensivas
   - Representa empresa/marca real
2. Clique **"Aprovar"**
3. Usuário pode usar imediatamente

### Rejeitar Sender ID
1. Clique **"Rejeitar"**
2. Inclua motivo:
   - Muito longo
   - Inadequado
   - Já existe similar
3. Usuário é notificado

### Sender IDs Globais
Crie Sender IDs que todos podem usar:
1. Vá para **Admin** → **Sender IDs Globais**
2. Adicione ID público (ex: "PROMOCAO")
3. Fica disponível para todos os usuários

## 🔧 Configurações SMS

### Gateways Ativos
Gerencie provedores de SMS:

#### BulkSMS
- **Status**: Ativo/Inativo
- **Saldo**: Créditos disponíveis
- **Países**: Angola, outros PALOP
- **Prioridade**: Principal ou backup

#### BulkGate
- **Status**: Ativo/Inativo
- **Saldo**: Créditos disponíveis
- **Países**: Angola específico
- **Prioridade**: Principal ou backup

### Configurar Roteamento
Define qual gateway usar para cada país:
1. **Angola**: Preferência BulkGate
2. **Outros PALOP**: BulkSMS
3. **Fallback**: Automático em caso de falha

### Monitoramento de Gateways
- **Taxa de Entrega**: Por gateway
- **Tempo de Resposta**: Latência média
- **Falhas**: Erros por operadora
- **Balanceamento**: Distribuição de carga

### Alertas Automáticos
Configure notificações para:
- **Saldo Baixo**: Gateway com poucos créditos
- **Falhas Altas**: Taxa de erro acima do normal
- **Inatividade**: Gateway fora do ar

## 🎨 Personalização da Marca

### Configurações Visuais
Em **Admin** → **Marca**:

#### Logos
- **Logo Principal**: Usado no header
- **Logo Escuro**: Para tema claro
- **Logo Claro**: Para tema escuro
- **Favicon**: Ícone do navegador

#### Cores
- **Cor Primária**: Botões e destaques
- **Cor Secundária**: Links e acentos
- **Cores do Tema**: Claro e escuro

#### Tipografia
- **Fonte Principal**: Interface geral
- **Tamanhos**: Escala tipográfica
- **Pesos**: Normal, médio, bold

### Textos do Site
Configure conteúdo dinâmico:
- **Título Principal**: Nome da plataforma
- **Slogan**: Descrição principal
- **Meta Descrição**: Para SEO
- **Termos de Uso**: Texto legal

### Informações de Contato
- **WhatsApp**: Número de suporte
- **Email**: Contato empresarial
- **Endereço**: Localização física
- **Redes Sociais**: Links oficiais

## 📧 Configurações SMTP

### Servidor de Email
Configure envio de emails:
1. **Host**: Servidor SMTP
2. **Porta**: 587 (TLS) ou 465 (SSL)
3. **Usuário**: Email de envio
4. **Senha**: Senha do email
5. **Criptografia**: TLS recomendado

### Testar Configuração
1. Configure os dados SMTP
2. Clique **"Testar Configuração"**
3. Envie email de teste
4. Verifique recebimento e qualidade

### Templates de Email
Personalize emails automáticos:
- **Confirmação de Conta**: Boas-vindas
- **Recuperação de Senha**: Reset
- **Compra Aprovada**: Confirmação de créditos
- **Alertas**: Notificações importantes

## 📊 Monitoramento e Logs

### Dashboard de Sistema
Monitore saúde da plataforma:
- **Uptime**: Disponibilidade do sistema
- **Performance**: Tempo de resposta
- **Uso de Recursos**: CPU, memória, BD
- **Erros**: Logs de problemas

### Logs de Auditoria
Registre todas as ações administrativas:
- **Usuário**: Admin responsável
- **Ação**: O que foi feito
- **Alvo**: Usuário/recurso afetado
- **Timestamp**: Quando ocorreu
- **IP**: Endereço de origem

### Logs de SMS
Visualize todos os SMS da plataforma:
- **Filtros**: Usuário, período, status
- **Detalhes**: Gateway usado, erro, custo
- **Exportação**: CSV, Excel
- **Estatísticas**: Agregados por período

## 🔒 Segurança e Auditoria

### Configurações de Segurança
- **Timeout de Sessão**: 2 horas para admins
- **Rate Limiting**: Proteção contra abuso
- **2FA**: Autenticação em duas etapas
- **Logs de Acesso**: Histórico de logins

### Compliance LGPD
- **Consentimentos**: Gestão de permissões
- **Retenção**: Políticas de dados
- **Exclusão**: Direito ao esquecimento
- **Portabilidade**: Exportação de dados

### Backup e Recuperação
- **Backup Diário**: Automático às 2h
- **Retenção**: 30 dias
- **Teste**: Mensal de recuperação
- **Logs**: Histórico de backups

## 📈 Relatórios Administrativos

### Relatório de Uso
- **Usuários por Período**: Crescimento da base
- **SMS por Usuário**: Ranking de uso
- **Receita por Mês**: Performance financeira
- **Churn Rate**: Taxa de cancelamento

### Relatório de Performance
- **Entrega por Gateway**: Eficiência
- **Falhas por Operadora**: Problemas de rede
- **Picos de Uso**: Horários de alta demanda
- **Otimizações**: Sugestões de melhoria

### Exportação
Baixe relatórios em:
- **Excel**: Análise detalhada
- **PDF**: Apresentações
- **CSV**: Integração com outras ferramentas

## 🚨 Alertas e Notificações

### Configurar Alertas
Defina quando ser notificado:
- **Saldo Gateway < 1000**: Recarregar urgente
- **Taxa Falha > 10%**: Problemas de entrega
- **Transação Pendente > 24h**: Revisar compras
- **Erro Sistema**: Problemas técnicos

### Canais de Notificação
- **Email**: Para todos os alertas
- **SMS**: Apenas críticos
- **Dashboard**: Notificações visuais
- **WhatsApp**: Emergências

## 🔧 Manutenção

### Tarefas Diárias
- Aprovar transações pendentes
- Revisar Sender IDs
- Verificar alertas do sistema
- Monitorar taxa de entrega

### Tarefas Semanais
- Analisar relatórios de uso
- Verificar backups
- Atualizar configurações
- Revisar logs de auditoria

### Tarefas Mensais
- Relatório financeiro
- Análise de performance
- Limpeza de dados antigos
- Reunião de equipe

---

*Para dúvidas técnicas ou suporte avançado, entre em contato com a equipe de desenvolvimento.*