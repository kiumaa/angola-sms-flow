# Projeto SaaS de SMS Marketing para Angola
*Documentação Completa do Sistema*

---

## 1. Visão Geral

### Objetivo da Plataforma
O sistema SaaS de SMS Marketing para Angola é uma plataforma digital que permite a empresas angolanas realizar campanhas de marketing via SMS de forma eficiente e escalável. A solução oferece uma interface intuitiva para gestão de contatos, criação de campanhas e monitoramento de resultados.

### Fluxo de Uso pelo Cliente Final

1. **Registro e Autenticação**
   - Cliente se registra na plataforma com dados da empresa
   - Validação de e-mail e criação de conta

2. **Aquisição de Créditos**
   - Compra de pacotes de SMS pagos em Kwanzas
   - Processamento via transferência bancária (fase inicial)
   - Créditos creditados na conta após confirmação do pagamento

3. **Gestão de Contatos**
   - Upload de listas de contatos via CSV/Excel
   - Segmentação e organização de grupos

4. **Criação de Campanhas**
   - Composição de mensagem com variáveis personalizadas
   - Seleção de destinatários e agendamento
   - Pré-visualização e validação

5. **Envio e Monitoramento**
   - Envio automático via integração BulkSMS
   - Acompanhamento em tempo real do status
   - Relatórios de entrega e engajamento

---

## 2. Funcionalidades Principais

### 2.1 Autenticação e Gestão de Usuários
- **Registro**: Cadastro com validação de e-mail e dados empresariais
- **Login**: Autenticação segura com opção "Lembrar-me"
- **Recuperação de Senha**: Envio de link por e-mail para redefinição
- **Perfil do Usuário**: Edição de dados pessoais e empresariais
- **Autenticação 2FA**: Implementação futura para maior segurança

### 2.2 Gestão de Créditos
- **Carregamento de Créditos**: 
  - Seleção de pacotes pré-definidos
  - Processamento de pagamento via transferência bancária
  - Confirmação manual pelo administrador
- **Consulta de Saldos**: 
  - Visualização em tempo real de créditos disponíveis
  - Histórico de transações e consumo
- **Alertas de Saldo**: 
  - Notificações quando saldo estiver baixo
  - Sugestões de recarga automática

### 2.3 Envio de Campanhas
- **Gestão de Listas**:
  - Upload via CSV/Excel com validação de números
  - Criação de grupos e segmentação avançada
  - Limpeza automática de números inválidos
- **Composição de Mensagem**:
  - Editor com contador de caracteres
  - Variáveis personalizadas ({nome}, {empresa}, etc.)
  - Pré-visualização em tempo real
- **Agendamento**:
  - Envio imediato ou programado
  - Fuso horário automático (Angola - WAT)
  - Recorrência de campanhas
- **Monitoramento**:
  - Status em tempo real (enviado, entregue, falhou)
  - Pause/retomar campanhas ativas
  - Relatórios detalhados por destinatário

### 2.4 Dashboard do Cliente
- **Painel Principal**:
  - Resumo de créditos (disponíveis vs. usados)
  - Últimas campanhas enviadas
  - Métricas de performance atual
- **Gráficos e Análises**:
  - Envios por período (diário, semanal, mensal)
  - Taxa de entrega e falhas
  - Comparativo de campanhas
- **Histórico Completo**:
  - Lista de todas as campanhas
  - Filtros por data, status e performance
  - Exportação de relatórios em PDF/Excel

### 2.5 Área de Administração
- **Gestão de Clientes**:
  - Lista completa de usuários registrados
  - Controle de status (ativo, suspenso, cancelado)
  - Histórico de atividades por cliente
- **Controles da API BulkSMS**:
  - Monitoramento de status da integração
  - Logs de envio e resposta
  - Configuração de parâmetros globais
- **Relatórios Financeiros**:
  - Receita por período e pacote
  - Análise de uso agregado
  - Projeções e tendências
- **Parametrização**:
  - Configuração de preços por SMS
  - Gestão de pacotes e promoções
  - Regras de negócio globais

### 2.6 Sistema de Pagamentos
- **Fase Atual - Transferência Bancária**:
  - Geração de dados bancários únicos por pedido
  - Upload de comprovante pelo cliente
  - Validação manual e creditação automática
- **Roadmap - Integração AppyPay**:
  - Pagamento online via cartão e mobile money
  - Processamento automático e instantâneo
  - Webhook para confirmação em tempo real

---

## 3. Arquitetura e Stack Técnico

### 3.1 Backend
**Tecnologia Recomendada**: Node.js com Express.js
- **Framework**: Express.js para APIs REST
- **Autenticação**: JWT com refresh tokens
- **Validação**: Joi ou Yup para validação de dados
- **Criptografia**: bcrypt para senhas, crypto para dados sensíveis
- **Queue System**: Bull/Redis para processamento assíncrono de SMS

### 3.2 Banco de Dados
**Tecnologia**: PostgreSQL
- **ORM**: Prisma ou Sequelize
- **Estrutura**:
  ```sql
  - users (id, email, password, company_name, status, created_at)
  - credits (id, user_id, amount, type, reference, status, created_at)
  - contacts (id, user_id, name, phone, groups, created_at)
  - campaigns (id, user_id, name, message, status, scheduled_at, created_at)
  - sms_logs (id, campaign_id, phone, status, sent_at, delivered_at)
  ```

### 3.3 Frontend
**Tecnologia**: React.js com TypeScript
- **Framework**: Next.js para SSR e otimização
- **UI Library**: Tailwind CSS + Headless UI
- **Estado Global**: Zustand ou Redux Toolkit
- **Gráficos**: Chart.js ou Recharts
- **Formulários**: React Hook Form com validação

### 3.4 DevOps e Infraestrutura
- **Containerização**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Hospedagem**: 
  - **Backend**: DigitalOcean Droplets ou AWS EC2
  - **Database**: PostgreSQL gerenciado (DigitalOcean ou AWS RDS)
  - **Frontend**: Vercel ou Netlify
- **Monitoramento**: PM2 + Nginx para produção
- **Backup**: Automated daily backups com retenção de 30 dias

### 3.5 Integração BulkSMS
- **API Endpoint**: `https://bulksms.vsms.net/eapi/submission/send_sms/2/2.0`
- **Autenticação**: Username/Password via Basic Auth
- **Funcionalidades**:
  - Envio individual e em lote
  - Consulta de status de entrega
  - Verificação de saldo da conta
  - Webhook para status updates

---

## 4. Endpoints da API

### 4.1 Autenticação
```http
POST /api/auth/register
Content-Type: application/json
{
  "email": "empresa@exemplo.ao",
  "password": "senhaSegura123",
  "company_name": "Empresa Exemplo Lda",
  "phone": "+244900000000"
}

POST /api/auth/login
Content-Type: application/json
{
  "email": "empresa@exemplo.ao",
  "password": "senhaSegura123"
}

POST /api/auth/forgot-password
Content-Type: application/json
{
  "email": "empresa@exemplo.ao"
}
```

### 4.2 Gestão de Créditos
```http
GET /api/credits/balance
Authorization: Bearer {jwt_token}

POST /api/credits/purchase
Authorization: Bearer {jwt_token}
Content-Type: application/json
{
  "package": "basic",
  "amount": 100,
  "payment_method": "bank_transfer"
}

GET /api/credits/history?page=1&limit=20
Authorization: Bearer {jwt_token}
```

### 4.3 Campanhas SMS
```http
POST /api/sms/send
Authorization: Bearer {jwt_token}
Content-Type: application/json
{
  "recipients": ["+244900000001", "+244900000002"],
  "message": "Olá {nome}, temos uma oferta especial para si!",
  "variables": [
    {"phone": "+244900000001", "nome": "João"},
    {"phone": "+244900000002", "nome": "Maria"}
  ],
  "scheduled_at": "2024-01-15T10:00:00Z"
}

GET /api/campaigns?status=sent&page=1
Authorization: Bearer {jwt_token}

GET /api/campaigns/{id}/reports
Authorization: Bearer {jwt_token}
```

### 4.4 Gestão de Contatos
```http
POST /api/contacts/upload
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data
{
  "file": contacts.csv,
  "group": "clientes_vip"
}

GET /api/contacts?group=clientes_vip&search=joão
Authorization: Bearer {jwt_token}

DELETE /api/contacts/{id}
Authorization: Bearer {jwt_token}
```

---

## 5. Cronograma Inicial

### Fase 1: Levantamento de Requisitos (1 semana)
- **Dias 1-2**: Análise detalhada dos requisitos funcionais
- **Dias 3-4**: Definição de requisitos não-funcionais e restrições
- **Dias 5-7**: Validação com stakeholders e ajustes finais

### Fase 2: Design de Arquitetura e BD (1 semana)
- **Dias 1-3**: Modelagem do banco de dados e relacionamentos
- **Dias 4-5**: Definição da arquitetura de microsserviços
- **Dias 6-7**: Criação de wireframes e protótipos das telas principais

### Fase 3: Desenvolvimento Backend + Integração BulkSMS (2-3 semanas)
- **Semana 1**: 
  - Configuração do ambiente de desenvolvimento
  - Implementação da API de autenticação
  - Modelagem e criação do banco de dados
- **Semana 2**:
  - Desenvolvimento das APIs de créditos e campanhas
  - Integração com BulkSMS para envio de SMS
  - Sistema de queue para processamento assíncrono
- **Semana 3**:
  - Implementação de logs e monitoramento
  - Testes unitários e de integração
  - Documentação da API

### Fase 4: Desenvolvimento Frontend (2-3 semanas)
- **Semana 1**:
  - Setup do projeto React com TypeScript
  - Implementação das telas de autenticação
  - Dashboard principal e navegação
- **Semana 2**:
  - Páginas de gestão de contatos e campanhas
  - Integração com APIs do backend
  - Implementação de gráficos e relatórios
- **Semana 3**:
  - Responsividade e otimizações de UX
  - Testes end-to-end
  - Ajustes visuais e de performance

### Fase 5: Módulo de Pagamentos por Transferência (1 semana)
- **Dias 1-3**: Implementação do fluxo de compra de créditos
- **Dias 4-5**: Sistema de upload e validação de comprovantes
- **Dias 6-7**: Dashboard administrativo para gestão de pagamentos

### Fase 6: Testes e Deploy (1-2 semanas)
- **Semana 1**:
  - Testes de carga e performance
  - Correção de bugs identificados
  - Configuração do ambiente de produção
- **Semana 2**:
  - Deploy em produção
  - Monitoramento pós-deploy
  - Treinamento da equipe de suporte

**Total Estimado**: 8-10 semanas

---

## 6. Site de Apresentação e Página de Vendas

### 6.1 Estrutura da Landing Page

#### Hero Section
- **Título Principal**: "SMS Marketing Profissional para Empresas Angolanas"
- **Subtítulo**: "Alcance seus clientes de forma direta e eficaz. Envie milhares de SMS com poucos cliques e acompanhe resultados em tempo real."
- **CTA Principal**: "Começar Grátis" (trial de 50 SMS)
- **CTA Secundário**: "Ver Preços"
- **Visual**: Mockup do dashboard + ilustração de smartphone recebendo SMS

#### Seção de Funcionalidades
1. **Envio em Massa**: "Envie para milhares de contatos simultaneamente"
2. **Personalização**: "Mensagens personalizadas com nome e dados do cliente"
3. **Agendamento**: "Programe campanhas para o melhor momento"
4. **Relatórios**: "Acompanhe entregas e engajamento em tempo real"
5. **API Integration**: "Integre com seus sistemas existentes"
6. **Suporte Local**: "Atendimento em português com conhecimento do mercado angolano"

#### Seção de Preços
- Tabela clara com 3 pacotes
- Destaque para o plano intermediário
- "Sem mensalidade, pague apenas pelo que usar"
- CTA: "Comprar Agora"

#### Depoimentos (Social Proof)
- 3-4 depoimentos de empresas angolanas fictícias
- Logos de empresas conhecidas (com permissão)
- Estatísticas: "Mais de X empresas confiam em nós"

#### FAQ Section
- Perguntas comuns sobre preços, integração, suporte
- "Como funciona o processo de pagamento em Kwanzas?"
- "Qual a taxa de entrega dos SMS?"

#### Rodapé
- Links para políticas de privacidade e termos
- Dados de contato da empresa
- Redes sociais

### 6.2 Fluxo de Conversão
1. **Landing Page** → CTA "Começar Grátis"
2. **Página de Registro** → Formulário simplificado
3. **Dashboard de Boas-vindas** → Tour guiado
4. **Primeira Campanha** → Wizard step-by-step
5. **Upgrade** → Página de pacotes quando créditos acabarem

---

## 7. Diretrizes de Design e UX

### 7.1 Estilo Visual

#### Paleta de Cores
- **Primária**: #2563eb (Azul profissional)
- **Secundária**: #10b981 (Verde para sucesso)
- **Neutras**: #f8fafc (backgrounds), #64748b (textos secundários)
- **Alertas**: #ef4444 (erros), #f59e0b (avisos)

#### Tipografia
- **Principal**: Inter ou Poppins (sem serifa, moderna)
- **Hierarquia**: H1 (32px), H2 (24px), H3 (20px), Body (16px), Small (14px)
- **Peso**: Regular (400), Medium (500), SemiBold (600), Bold (700)

#### Componentes
- **Bordas**: Raio de 12px (2xl) para cards e botões
- **Sombras**: Suaves com opacidade baixa para profundidade
- **Espaçamento**: Sistema de 8px (4, 8, 12, 16, 24, 32, 48, 64)

### 7.2 Grid e Layout
- **Responsivo**: Mobile-first com breakpoints em 640px, 768px, 1024px, 1280px
- **Container**: Máximo de 1200px com padding lateral
- **Grid**: 12 colunas com gap de 24px
- **Sidebar**: 280px de largura, colapsível em mobile

### 7.3 Acessibilidade
- **Contraste**: Mínimo 4.5:1 para textos normais, 3:1 para textos grandes
- **Labels**: Descritivos e claros para screen readers
- **Foco**: Indicador visual claro para navegação por teclado
- **Alt Text**: Descrições adequadas para todas as imagens
- **ARIA**: Labels e roles adequados para componentes interativos

### 7.4 Performance e UX
- **Loading States**: Skeletons para carregamento de listas
- **Lazy Loading**: Imagens e componentes não críticos
- **Feedback Visual**: Confirmações, erros e sucessos claros
- **Transições**: Suaves (300ms) para mudanças de estado
- **Offline Support**: Mensagens informativas quando sem conexão

---

## 8. Modelos de Preços e Pacotes

### 8.1 Tabela de Preços (em Kwanzas)

| Pacote | SMS Incluídos | Preço (Kz) | Preço por SMS | Economia |
|--------|---------------|------------|---------------|-----------|
| **Básico** | 100 | 10.000 | 100 Kz | - |
| **Intermediário** | 400 | 38.000 | 95 Kz | 5% |
| **Avançado** | 1.000 | 90.000 | 90 Kz | 10% |
| **Empresarial** | 2.500 | 212.500 | 85 Kz | 15% |
| **Corporate** | 5.000 | 400.000 | 80 Kz | 20% |

### 8.2 Características dos Pacotes

#### Básico (100 SMS - 10.000 Kz)
- Ideal para pequenas empresas
- Suporte por email
- Dashboard básico
- Validade: 90 dias

#### Intermediário (400 SMS - 38.000 Kz) ⭐ **Mais Popular**
- Ideal para médias empresas
- Suporte prioritário
- Relatórios avançados
- Agendamento de campanhas
- Validade: 120 dias

#### Avançado (1.000 SMS - 90.000 Kz)
- Ideal para grandes empresas
- API access
- Webhooks personalizados
- Suporte por telefone
- Validade: 180 dias

### 8.3 Política de Preços
- **Preço Fixo**: Sem flutuação baseada em demanda
- **Sem Mensalidade**: Pay-as-you-go model
- **Créditos não Expiram**: Para pacotes Avançado e superiores
- **Descontos por Volume**: Negociação para +10.000 SMS/mês
- **Promoções Sazonais**: Black Friday, fim de ano, etc.

---

## 9. SLA e Termos de Uso

### 9.1 Service Level Agreement (SLA)

#### Disponibilidade do Sistema
- **Uptime Garantido**: 99,9% (máximo 8,76 horas de downtime/ano)
- **Janela de Manutenção**: Domingos 02:00-04:00 WAT (notificação prévia)
- **Monitoramento**: 24/7 com alertas automáticos

#### Performance de Entrega
- **Taxa de Entrega**: ≥ 95% para números válidos
- **Tempo de Processamento**: 90% dos SMS enviados em até 30 segundos
- **Latência da API**: Resposta média < 200ms
- **Throughput**: Até 1.000 SMS/minuto por cliente

#### Suporte ao Cliente
- **Email**: Resposta garantida em ≤ 4 horas (horário comercial)
- **Horário**: Segunda a Sexta, 08:00-17:00 WAT
- **Idiomas**: Português (Angola) e Inglês
- **Escalação**: Supervisor disponível para casos críticos

### 9.2 Termos de Uso e Políticas

#### Uso Aceitável
- **Conteúdo Permitido**: 
  - Marketing promocional legítimo
  - Notificações transacionais
  - Alertas de serviço
- **Conteúdo Proibido**:
  - Spam não solicitado
  - Conteúdo adulto ou ofensivo
  - Fraudes ou esquemas pirâmide
  - Mensagens políticas não autorizadas

#### Responsabilidades do Cliente
- **Conformidade Legal**: Respeitar leis angolanas de proteção de dados
- **Consentimento**: Garantir opt-in dos destinatários
- **Qualidade de Dados**: Manter listas de contatos atualizadas
- **Limites de Uso**: Respeitar rate limits e cotas estabelecidas

#### Limitação de Responsabilidade
- **Força Maior**: Não responsabilidade por eventos fora do controle
- **Falhas de Terceiros**: Operadoras de telefonia, provedores de internet
- **Dados do Cliente**: Backup e recuperação de responsabilidade compartilhada
- **Perdas Financeiras**: Limitado ao valor pago no período afetado

#### Rescisão de Conta
- **Pelo Cliente**: A qualquer momento, com reembolso proporcional
- **Pela Empresa**: 
  - Violação dos termos (efeito imediato)
  - Não pagamento (30 dias de aviso)
  - Uso inadequado (aviso prévio quando possível)

#### Alterações de Termos
- **Notificação**: 30 dias de antecedência por email
- **Aceitação**: Uso continuado implica aceitação
- **Rejeição**: Cliente pode cancelar conta sem penalidades

#### Proteção de Dados
- **RGPD Compliance**: Adequação às melhores práticas internacionais
- **Criptografia**: Dados sensíveis protegidos em trânsito e repouso
- **Retenção**: Dados mantidos pelo período necessário legal
- **Direitos**: Acesso, correção e eliminação de dados pessoais

#### Jurisdição
- **Lei Aplicável**: República de Angola
- **Foro**: Comarca de Luanda
- **Mediação**: Preferência por resolução amigável antes de litígio

---

## Conclusão

Esta documentação fornece uma base sólida para o desenvolvimento do projeto SaaS de SMS Marketing para Angola. A implementação deve seguir uma abordagem iterativa, com feedback constante dos usuários e melhorias contínuas baseadas em dados de uso real.

**Próximos Passos**:
1. Validação desta documentação com stakeholders
2. Criação de protótipos das telas principais
3. Setup do ambiente de desenvolvimento
4. Início da implementação seguindo o cronograma estabelecido

**Considerações Importantes**:
- Manter foco na simplicidade e usabilidade
- Priorizar performance e confiabilidade
- Estabelecer processos de monitoramento desde o início
- Planejar escalabilidade desde a arquitetura inicial