# 👤 Manual do Usuário - SMS AO

Guia completo para utilizar todas as funcionalidades da plataforma SMS AO.

## 📊 Dashboard

### Visão Geral
O dashboard é sua central de comando, mostrando:

- **Créditos Disponíveis**: Saldo atual e histórico
- **Campanhas Recentes**: Últimas 5 campanhas
- **Estatísticas do Mês**: Enviados, entregues, falhas
- **Quick Actions**: Ações rápidas mais usadas

### Widgets Principais
- **Saldo de Créditos**: Acompanhe seus créditos em tempo real
- **Taxa de Entrega**: Percentual de SMS entregues com sucesso
- **Campanhas Ativas**: Status das campanhas em andamento
- **Contatos Totais**: Número de contatos na sua base

## 📱 Gestão de Contatos

### Adicionar Contatos

#### Individual
1. Vá para **Contatos** → **Adicionar Contato**
2. Preencha os campos obrigatórios:
   - Nome completo
   - Telefone (formato internacional: +244...)
3. Campos opcionais:
   - Email
   - Tags (para organização)
   - Notas (informações adicionais)

#### Importação em Massa (CSV)
1. Baixe o modelo CSV
2. Preencha seguindo o formato:
   ```csv
   Nome,Telefone,Email,Tags,Notas
   João Silva,+244912345678,joao@email.com,cliente,VIP
   Maria Santos,+244923456789,maria@email.com,prospect,Interessada
   ```
3. Envie o arquivo via **Importar Contatos**

### Organização

#### Tags
Use tags para categorizar contatos:
- **Clientes**: Compradores ativos
- **Prospects**: Potenciais clientes
- **VIP**: Clientes importantes
- **Inativos**: Não compraram recentemente

#### Listas Dinâmicas
Crie listas que se atualizam automaticamente:
1. Vá para **Contatos** → **Listas**
2. Clique **"Nova Lista"**
3. Defina critérios (tags, data de criação, etc.)

### Gerenciamento

#### Editar Contatos
1. Encontre o contato na lista
2. Clique no ícone de edição
3. Altere as informações necessárias
4. Salve as alterações

#### Bloquear Contatos
Para contatos que solicitaram opt-out:
1. Abra o contato
2. Marque **"Bloqueado"**
3. Contato não receberá mais SMS

## 📨 Campanhas SMS

### Tipos de Campanha

#### Campanha Tradicional
Para envios planejados e grandes volumes:
1. **Nome e Mensagem**: Defina título e conteúdo
2. **Destinatários**: Selecione contatos ou listas
3. **Agendamento**: Imediato ou programado
4. **Revisão**: Confirme dados antes do envio

#### Quick Send
Para envios rápidos e testes:
1. Digite números diretamente (separados por vírgula)
2. Escreva a mensagem
3. Envie imediatamente

### Criação de Campanhas

#### Passo 1: Informações Básicas
- **Nome da Campanha**: Identificação interna
- **Mensagem**: Máximo 160 caracteres
- **Sender ID**: Escolha quem aparece como remetente

#### Passo 2: Seleção de Destinatários
- **Contatos Individuais**: Selecione manualmente
- **Listas**: Use listas pré-criadas
- **Filtros**: Aplique critérios específicos

#### Passo 3: Agendamento
- **Envio Imediato**: Sai assim que confirmar
- **Agendamento**: Escolha data e hora
- **Timezone**: Automático (Luanda, Africa/Luanda)

#### Passo 4: Revisão e Envio
- Verifique quantidade de destinatários
- Confira estimativa de créditos
- Revise a mensagem final
- Confirme o envio

### Monitoramento
Acompanhe suas campanhas em **Campanhas** → **Histórico**:
- **Status**: Enviando, Concluída, Pausada
- **Progresso**: Percentual enviado
- **Estatísticas**: Entregues, falhas, custos

## 💳 Sistema de Créditos

### Como Funciona
- **1 Crédito = 1 SMS** para Angola
- **Dedução automática** ao enviar
- **Sem expiração** dos créditos
- **Histórico completo** de transações

### Comprar Créditos

#### Pacotes Disponíveis
| Pacote | Créditos | Preço | Desconto |
|--------|----------|-------|----------|
| Starter | 1.000 | 15.000 Kz | - |
| Business | 5.000 | 60.000 Kz | 20% |
| Enterprise | 10.000 | 100.000 Kz | 33% |
| Corporate | 25.000 | 200.000 Kz | 47% |

#### Processo de Compra
1. Escolha o pacote em **Créditos**
2. Clique **"Comprar Agora"**
3. Anote os dados bancários:
   - **Banco**: BAI
   - **IBAN**: AO06.0040.0000.4033.6182.1013.3
   - **Beneficiário**: SMS AO, LDA
4. Faça a transferência
5. Envie comprovativo via WhatsApp: +244 933 493 788

#### Confirmação
- Créditos adicionados em até 2 horas úteis
- Notificação por email e SMS
- Histórico disponível em **Transações**

### Solicitação de Crédito
Para volumes maiores ou condições especiais:
1. Vá para **Créditos** → **Solicitar Créditos**
2. Preencha quantidade desejada
3. Anexe comprovativo de pagamento
4. Aguarde aprovação administrativa

## 📊 Relatórios e Analytics

### Dashboard de Métricas
Visualize dados em tempo real:
- **Campanhas do Mês**: Quantidade e performance
- **Taxa de Entrega Média**: Sucesso das entregas
- **Créditos Utilizados**: Gastos do período
- **Contatos Ativos**: Base de dados atual

### Relatórios Detalhados

#### Relatório de Campanhas
1. Vá para **Relatórios** → **Campanhas**
2. Selecione período (último mês, trimestre, ano)
3. Analise métricas:
   - Volume enviado por campanha
   - Taxa de entrega por operadora
   - Custos e ROI
   - Horários de maior engajamento

#### Relatório de Contatos
- **Crescimento da Base**: Novos contatos por período
- **Segmentação**: Distribuição por tags
- **Qualidade**: Números válidos vs inválidos
- **Engajamento**: Contatos que mais recebem SMS

#### Logs de SMS
Histórico detalhado de cada SMS:
- **Status**: Enviado, Entregue, Falhou
- **Operadora**: Unitel, Africell, Movicel
- **Hora de Envio**: Timestamp completo
- **Custo**: Créditos utilizados
- **Erro**: Descrição de falhas

### Exportação de Dados
Baixe relatórios em:
- **Excel (.xlsx)**: Para análise avançada
- **CSV**: Para importar em outras ferramentas
- **PDF**: Para apresentações

## ⚙️ Configurações

### Perfil de Usuário
Em **Configurações** → **Perfil**:
- **Dados Pessoais**: Nome, email, telefone
- **Dados da Empresa**: Nome, setor, site
- **Sender ID Padrão**: ID usado por padrão
- **Timezone**: Fuso horário das campanhas

### Sender IDs

#### Criar Sender ID Personalizado
1. Vá para **Sender IDs** → **Adicionar**
2. Digite seu ID (máximo 11 caracteres)
3. Aguarde aprovação (24-48h úteis)
4. Use em suas campanhas

#### Regras para Sender IDs
- **Alfanumérico**: Apenas letras e números
- **Sem espaços**: Use hífen ou underscore
- **Máximo 11 caracteres**
- **Sem palavras proibidas**: Spam, test, etc.

### Notificações
Configure como receber alertas:
- **Email**: Campanhas concluídas, créditos baixos
- **SMS**: Apenas alertas críticos
- **Dashboard**: Notificações em tempo real

## 🔒 Segurança e Privacidade

### Autenticação
- **Login Tradicional**: Email e senha
- **OTP via SMS**: Código de verificação
- **Sessões Seguras**: Logout automático

### Proteção de Dados
- **Criptografia**: Todos os dados são criptografados
- **LGPD Compliant**: Conforme legislação angolana
- **Backup Automático**: Seus dados sempre seguros
- **Auditoria**: Log de todas as ações

### Controle de Privacidade
- **Opt-out Automático**: Respeita solicitações PARE
- **Consentimento**: Gestão de permissões
- **Bloqueio**: Lista de números bloqueados
- **Retenção**: Políticas de retenção de dados

## 📞 Suporte e Ajuda

### Canais de Suporte
- **WhatsApp**: +244 933 493 788 (24/7)
- **Email**: suporte@sms.ao
- **Portal**: Abertura de tickets
- **Documentação**: Guias e tutoriais

### FAQ Rápido

**P: Por que meu SMS não foi entregue?**
R: Verifique se o número está correto, se há créditos e se o contato não está bloqueado.

**P: Posso recuperar créditos de SMS não entregues?**
R: Sim, créditos são devolvidos automaticamente para falhas de sistema.

**P: Como alterar meu Sender ID padrão?**
R: Vá em Configurações → Perfil → Sender ID Padrão.

**P: Qual o limite de SMS por hora?**
R: Não há limite, mas recomendamos máximo 1000/hora para melhor entrega.

---

*Para dúvidas específicas, consulte nossa [FAQ completa](./faq.md) ou entre em contato.*