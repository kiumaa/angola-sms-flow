# Prompt para Criação Completa - SMS Marketing Angola

## Descrição Geral
Crie uma plataforma completa de SMS marketing para Angola com as seguintes características:

**Nome:** SMS Marketing Angola  
**Objetivo:** Conectar empresas aos seus clientes através de SMS marketing eficiente e profissional  
**Público:** Empresas angolanas que precisam enviar SMS em massa  

## Stack Técnica
- **Frontend:** React + TypeScript + Vite
- **UI:** Shadcn/ui + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Autenticação:** Supabase Auth
- **Estilo:** Design system com cores primárias roxas/rosa, fonte Sora

## Funcionalidades Principais

### 1. Sistema de Autenticação
- Registro e login de usuários
- Perfis de usuário com informações da empresa
- Sistema de roles (admin/client)
- Confirmação de email

### 2. Dashboard do Cliente
- Visão geral de créditos, campanhas e estatísticas
- Navegação lateral responsiva
- Cards informativos com métricas

### 3. Gestão de Contatos
- Importação CSV de contatos
- Criação de listas de contatos
- Gestão individual de contatos
- Tags e notas para organização

### 4. Campanhas SMS
- Wizard de criação de campanhas em 3 passos:
  1. Informações básicas (nome, mensagem)
  2. Seleção de destinatários (listas ou contatos individuais)
  3. Revisão e envio
- Agendamento de campanhas
- Histórico de campanhas
- Estatísticas detalhadas

### 5. Sistema de Créditos
- Compra de créditos via pacotes pré-definidos
- Checkout com transferência bancária
- Confirmação via WhatsApp (+244 933 493 788)
- Histórico de transações
- Solicitações de crédito para aprovação administrativa

### 6. Sender IDs
- Gestão de IDs remetente personalizados
- Aprovação administrativa de Sender IDs
- Configuração de ID padrão por usuário

### 7. Relatórios
- Estatísticas de campanhas
- Logs detalhados de SMS
- Relatórios de entrega e falhas
- Análise de custos em créditos

### 8. Área Administrativa
- Dashboard com métricas globais
- Gestão de usuários (criar, editar, suspender)
- Aprovação de solicitações de crédito
- Configuração de pacotes de crédito
- Gestão de Sender IDs
- Configurações SMTP para emails
- Auditoria de ações administrativas

### 9. Personalização Global
- Configuração de marca (logo, cores, título)
- Aplicação dinâmica em toda a plataforma
- Upload de assets para storage
- Favicon customizável

## Integração com Supabase

### Tabelas Principais
- `profiles` - Perfis de usuário
- `user_roles` - Roles de usuário
- `contacts` - Contatos individuais
- `contact_lists` - Listas de contatos
- `contact_list_members` - Relacionamento contatos/listas
- `sms_campaigns` - Campanhas de SMS
- `sms_logs` - Logs de envio
- `credit_packages` - Pacotes de crédito
- `credit_requests` - Solicitações de crédito
- `transactions` - Histórico de transações
- `sender_ids` - IDs remetente
- `brand_settings` - Configurações de marca
- `smtp_settings` - Configurações de email
- `admin_audit_logs` - Auditoria administrativa
- `credit_adjustments` - Ajustes de crédito

### Edge Functions
- `send-sms` - Envio de SMS via BulkSMS API
- `confirm-email` - Confirmação de email
- `send-confirmation-email` - Envio de emails
- `test-smtp` - Teste de configurações SMTP

### RLS (Row Level Security)
- Políticas para usuários verem apenas seus dados
- Políticas administrativas para acesso completo
- Políticas públicas para brand settings na landing page

## Design e UX

### Landing Page
- Hero section com título dinâmico e logo personalizado
- Seções de funcionalidades com ícones
- Preços dos pacotes
- Depoimentos de clientes
- Call-to-action para registro
- Links de contato e ajuda no footer

### Design System
- Cores primárias: hsl(262, 83%, 58%) e hsl(346, 77%, 49%)
- Fonte: Sora
- Componentes reutilizáveis com variantes
- Modo escuro/claro
- Responsividade total

### Performance
- Lazy loading de componentes pesados
- Performance monitoring nativo
- Scroll to top button
- Otimização de assets

## Fluxos Principais

### Registro e Onboarding
1. Usuário se registra na landing page
2. Confirmação por email
3. Login automático
4. Dashboard com tutorial

### Compra de Créditos
1. Seleção de pacote na página de créditos
2. Checkout com dados de transferência
3. Confirmação via WhatsApp
4. Status "pendente" até aprovação admin
5. Admin aprova e créditos são adicionados

### Envio de SMS
1. Criação de campanha no wizard
2. Seleção de destinatários
3. Preview da mensagem
4. Envio imediato ou agendado
5. Acompanhamento em tempo real

### Gestão Administrativa
1. Admin acessa painel dedicado
2. Visualiza métricas globais
3. Gerencia usuários e solicitações
4. Configura sistema (SMTP, pacotes, etc.)
5. Monitora logs de auditoria

## Integrações Externas

### BulkSMS API
- Integração para envio de SMS
- Configuração via secrets do Supabase
- BULKSMS_TOKEN_ID e BULKSMS_TOKEN_SECRET

### WhatsApp
- Botão para confirmação de pagamento
- Número: +244 933 493 788
- Mensagem pré-formatada com código da transação

## Configurações de Deploy
- Supabase project configurado
- Storage bucket "brand-assets" público
- Edge Functions com secrets configurados
- Políticas RLS aplicadas
- Triggers e funções PL/pgSQL

## Recursos Avançados
- Upload de arquivos (CSV, imagens)
- Busca e filtros em todas as listagens
- Paginação de dados
- Notificações toast
- Validação de formulários com Zod
- Gestão de estado com React Query

## Requisitos de Qualidade
- Código TypeScript 100% tipado
- Componentes reutilizáveis e modulares
- Testes de fluxos principais
- Acessibilidade básica (ARIA labels, contraste)
- SEO otimizado na landing page
- Performance otimizada

## Observações Importantes
- Plataforma deve funcionar 100% offline após primeira carga
- Todas as configurações de marca devem ser aplicadas dinamicamente
- Sistema de créditos deve ser à prova de fraude
- Logs detalhados para auditoria e debugging
- Interface intuitiva para usuários não técnicos

Este prompt deve resultar em uma plataforma completa, profissional e pronta para produção em Angola.