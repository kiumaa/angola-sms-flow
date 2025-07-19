# Especificação de Alto Nível: SMS Marketing Angola - Produção Ready

## 1. Correções de Bugs e QA Completa

### 1.1 Auditoria de Fluxos Críticos

#### 1.1.1 Fluxo de Autenticação
```typescript
// Validações necessárias
interface AuthFlowTests {
  login: {
    email_validation: boolean;
    password_strength: boolean;
    session_persistence: boolean;
    redirect_after_login: boolean;
  };
  register: {
    email_uniqueness: boolean;
    password_confirmation: boolean;
    profile_creation: boolean;
    role_assignment: boolean;
    email_confirmation: boolean;
  };
  logout: {
    session_cleanup: boolean;
    redirect_to_login: boolean;
    token_invalidation: boolean;
  };
}
```

**Bugs Identificados a Corrigir:**
- [ ] Novos usuários não aparecem imediatamente em "Gestão de Usuários"
- [ ] Confirmação de email pode estar bloqueando testes
- [ ] Redirecionamento após login inconsistente

#### 1.1.2 Gestão de Usuários e Créditos
```typescript
// Fluxo de aprovação de créditos
interface CreditRequestFlow {
  request_creation: {
    package_selection: boolean;
    payment_reference: boolean;
    receipt_upload: boolean;
  };
  admin_review: {
    request_visibility: boolean;
    approval_process: boolean;
    credit_addition: boolean;
    notification_system: boolean;
  };
}
```

**Correções Prioritárias:**
- [ ] Sistema de notificação para novos pedidos de crédito
- [ ] Validação de saldo antes de envios
- [ ] Logs de auditoria para ajustes de crédito

#### 1.1.3 Sistema de SMS e Fallback
```typescript
// Validação do sistema de gateways
interface SMSSystemValidation {
  primary_gateway: {
    connection_test: boolean;
    balance_check: boolean;
    sender_id_validation: boolean;
    message_sending: boolean;
  };
  fallback_logic: {
    failure_detection: boolean;
    automatic_retry: boolean;
    log_registration: boolean;
    status_update: boolean;
  };
  webhook_handling: {
    delivery_confirmation: boolean;
    status_update: boolean;
    log_correlation: boolean;
  };
}
```

### 1.2 Testes Automatizados

#### 1.2.1 Testes de Integração
```typescript
// cypress/integration/sms-flow.spec.ts
describe('SMS Marketing Flow', () => {
  it('should complete full campaign flow', () => {
    cy.login('admin@test.com', 'password');
    cy.visit('/campaigns/new');
    cy.createCampaign('Test Campaign', 'Hello World');
    cy.selectContacts(['244900000000']);
    cy.sendCampaign();
    cy.verifyDeliveryStatus();
  });

  it('should handle gateway fallback', () => {
    cy.mockGatewayFailure('bulksms');
    cy.sendSMS('244900000001', 'Fallback test');
    cy.verifyFallbackToGateway('bulkgate');
  });
});
```

#### 1.2.2 Testes de API
```typescript
// tests/api/gateways.test.ts
describe('Gateway API Tests', () => {
  test('BulkSMS send and status', async () => {
    const response = await sendSMS({
      to: '+244900000000',
      message: 'Test message',
      gateway: 'bulksms'
    });
    expect(response.status).toBe('sent');
    expect(response.message_id).toBeDefined();
  });

  test('BulkGate fallback functionality', async () => {
    // Simulate BulkSMS failure
    await mockGatewayDown('bulksms');
    const response = await sendSMS({
      to: '+244900000000',
      message: 'Fallback test'
    });
    expect(response.gateway_used).toBe('bulkgate');
  });
});
```

## 2. Implementação das Próximas Funcionalidades

### 2.1 Importação de Contatos

#### 2.1.1 Interface de Upload
```typescript
// src/components/contacts/ContactImporter.tsx
interface ContactImportConfig {
  file_formats: ['csv', 'xlsx', 'xls'];
  max_file_size: '10MB';
  required_columns: ['phone'];
  optional_columns: ['name', 'email', 'tags'];
  validation_rules: {
    phone: 'angola_format'; // +244XXXXXXXXX
    email: 'email_format';
    duplicates: 'auto_dedupe';
  };
}

// Fluxo de importação
const importSteps = [
  'file_upload',
  'column_mapping',
  'data_preview',
  'validation_results',
  'import_confirmation',
  'processing_status'
];
```

#### 2.1.2 Processamento e Validação
```typescript
// src/lib/contacts/ContactProcessor.ts
export class ContactProcessor {
  async processFile(file: File): Promise<ImportResult> {
    const data = await this.parseFile(file);
    const validated = await this.validateContacts(data);
    const deduplicated = await this.deduplicateContacts(validated);
    return await this.saveContacts(deduplicated);
  }

  private validateContacts(contacts: RawContact[]): ValidatedContact[] {
    return contacts.map(contact => ({
      ...contact,
      phone: this.formatAngolianPhone(contact.phone),
      isValid: this.isValidAngolianPhone(contact.phone)
    }));
  }

  private formatAngolianPhone(phone: string): string {
    // Converte para formato +244XXXXXXXXX
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('244')) return `+${cleaned}`;
    if (cleaned.length === 9) return `+244${cleaned}`;
    return phone; // Retorna original se não conseguir formatar
  }
}
```

### 2.2 Sistema de Pagamentos

#### 2.2.1 Pagamento Offline (Transferência Bancária)
```typescript
// src/components/payment/OfflinePayment.tsx
interface OfflinePaymentFlow {
  package_selection: {
    credit_packages: CreditPackage[];
    bank_details: {
      bank_name: 'BAI' | 'BFA' | 'Millennium';
      account_number: string;
      account_holder: string;
      iban: string;
    };
  };
  payment_proof: {
    reference_number: string;
    transfer_receipt: File;
    whatsapp_confirmation: string; // Número para confirmação
  };
  admin_verification: {
    manual_review: boolean;
    auto_approval_rules: ApprovalRule[];
    notification_system: NotificationConfig;
  };
}
```

#### 2.2.2 Integração AppyPay (Futuro)
```typescript
// src/lib/payments/AppyPayGateway.ts
export class AppyPayGateway {
  async createPayment(amount: number, reference: string): Promise<PaymentResponse> {
    const payload = {
      merchant_id: process.env.APPYPAY_MERCHANT_ID,
      amount: amount * 100, // Centavos
      currency: 'AOA',
      reference,
      callback_url: `${process.env.SITE_URL}/api/payments/appypay/callback`,
      return_url: `${process.env.SITE_URL}/payment-success`
    };

    return await this.apiCall('/payments', payload);
  }
}
```

### 2.3 Ativação Produção BulkGate

#### 2.3.1 Configuração de Produção
```typescript
// supabase/functions/setup-bulkgate-production/index.ts
export async function setupBulkGateProduction() {
  const config = {
    api_endpoint: 'https://api.bulkgate.com/v2.0/sms',
    api_key: Deno.env.get('BULKGATE_API_KEY_PROD'),
    webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/bulkgate-webhook`,
    webhook_secret: Deno.env.get('BULKGATE_WEBHOOK_SECRET'),
    fallback_enabled: true,
    priority: 'secondary' // BulkSMS primary, BulkGate secondary
  };

  // Atualizar configurações no banco
  await supabase.from('sms_gateways')
    .update({
      is_active: true,
      api_endpoint: config.api_endpoint
    })
    .eq('name', 'bulkgate');

  return config;
}
```

## 3. Refinamento UI/UX e Performance

### 3.1 Interface de Checkout Aprimorada

#### 3.1.1 Design System para Checkout
```typescript
// src/components/checkout/CheckoutPage.tsx
interface CheckoutDesign {
  layout: {
    step_indicator: boolean;
    progress_bar: boolean;
    mobile_optimized: boolean;
  };
  payment_methods: {
    bank_transfer: {
      icon: 'CreditCard';
      description: 'Transferência bancária com confirmação rápida';
      processing_time: '2-4 horas úteis';
    };
    future_methods: ['appypay', 'multicaixa'];
  };
  trust_indicators: {
    ssl_badge: boolean;
    security_text: boolean;
    company_info: boolean;
  };
}
```

#### 3.1.2 Landing Page Otimizada
```typescript
// src/pages/Landing.tsx
const optimizations = {
  hero_section: {
    value_proposition: 'Envie SMS em massa para Angola com 98% de entrega',
    cta_buttons: ['Começar Gratuitamente', 'Ver Demonstração'],
    social_proof: 'Mais de 1.000 mensagens enviadas'
  },
  features_highlight: [
    'Integração com BulkSMS e BulkGate',
    'Fallback automático para 99.9% uptime',
    'Gestão completa de contatos',
    'Relatórios detalhados em tempo real'
  ],
  pricing_transparency: {
    show_credit_costs: true,
    calculator: 'SMS Cost Calculator',
    no_hidden_fees: true
  }
};
```

### 3.2 Otimizações de Performance

#### 3.2.1 Lazy Loading e Code Splitting
```typescript
// src/components/shared/LazyComponents.tsx
export const LazyDashboard = lazy(() => import('@/pages/Dashboard'));
export const LazyCampaigns = lazy(() => import('@/pages/Campaigns'));
export const LazyReports = lazy(() => import('@/pages/Reports'));
export const LazyAdmin = lazy(() => import('@/pages/AdminDashboard'));

// Implementar Suspense em App.tsx
function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/dashboard" element={<LazyDashboard />} />
        {/* Outras rotas */}
      </Routes>
    </Suspense>
  );
}
```

#### 3.2.2 Cache de Configurações
```typescript
// src/hooks/useBrandSettings.tsx
export function useBrandSettings() {
  return useQuery({
    queryKey: ['brand-settings'],
    queryFn: fetchBrandSettings,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false
  });
}
```

### 3.3 Acessibilidade

#### 3.3.1 Melhorias de Contraste e Navegação
```css
/* src/index.css - Acessibilidade */
:root {
  --focus-ring: hsl(var(--primary)) 0 0 0 2px;
  --high-contrast-text: hsl(0, 0%, 20%);
  --accessible-link: hsl(210, 100%, 40%);
}

.focus-visible {
  outline: var(--focus-ring);
  outline-offset: 2px;
}

/* Botões com contraste adequado */
.btn-primary {
  background: hsl(var(--primary));
  color: white;
  min-height: 44px; /* Touch target */
}

/* Links acessíveis */
a:not(.btn) {
  color: var(--accessible-link);
  text-decoration: underline;
}
```

## 4. Documentação e Rollout

### 4.1 Payloads de API Documentados

#### 4.1.1 BulkSMS Payloads
```json
{
  "send_sms": {
    "endpoint": "POST /v1/messages",
    "headers": {
      "Authorization": "Basic base64(username:password)",
      "Content-Type": "application/json"
    },
    "payload": {
      "to": "+244900000000",
      "from": "SMSao",
      "body": "Sua mensagem aqui",
      "encoding": "TEXT"
    },
    "response": {
      "id": "message-id-123",
      "status": "SENT",
      "credits": 1.0
    }
  },
  "get_status": {
    "endpoint": "GET /v1/messages/{message-id}",
    "response": {
      "id": "message-id-123",
      "status": "DELIVERED",
      "deliveredAt": "2024-01-15T10:30:00Z"
    }
  },
  "webhook": {
    "endpoint": "POST /api/webhooks/bulksms",
    "payload": {
      "id": "message-id-123",
      "status": "DELIVERED",
      "type": "DELIVERY_REPORT"
    }
  }
}
```

#### 4.1.2 BulkGate Payloads
```json
{
  "send_sms": {
    "endpoint": "POST /v2.0/sms",
    "headers": {
      "Authorization": "Bearer {api-key}",
      "Content-Type": "application/json"
    },
    "payload": {
      "number": "+244900000000",
      "text": "Sua mensagem aqui",
      "sender_id": "SMSao",
      "unicode": false
    },
    "response": {
      "data": {
        "sms_id": "bulkgate-id-456",
        "status": "accepted"
      }
    }
  },
  "get_balance": {
    "endpoint": "GET /v2.0/credit/balance",
    "response": {
      "data": {
        "credit": 150.75,
        "currency": "EUR"
      }
    }
  },
  "webhook": {
    "endpoint": "POST /api/webhooks/bulkgate",
    "payload": {
      "sms_id": "bulkgate-id-456",
      "status": "delivered",
      "delivered_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 4.2 Guia de Configuração de Produção

#### 4.2.1 Credenciais e Secrets
```bash
# Secrets necessários no Supabase
BULKSMS_TOKEN_ID=your_production_token_id
BULKSMS_TOKEN_SECRET=your_production_token_secret
BULKGATE_API_KEY=your_production_api_key
SMTP_PASSWORD=your_smtp_password

# URLs de Webhook para configurar nos gateways
BULKSMS_WEBHOOK_URL=https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/bulksms-webhook
BULKGATE_WEBHOOK_URL=https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/bulkgate-webhook
```

#### 4.2.2 Configuração de Webhooks

**BulkSMS:**
1. Acesse https://portal.bulksms.com/webhooks
2. Adicione webhook URL: `https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/bulksms-webhook`
3. Selecione eventos: `SENT`, `DELIVERED`, `FAILED`
4. Configure método: `POST`

**BulkGate:**
1. Acesse https://portal.bulkgate.com/api/webhooks
2. Adicione webhook URL: `https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/bulkgate-webhook`
3. Selecione eventos: `delivered`, `failed`, `sent`
4. Configure autenticação se necessário

### 4.3 Plano de Rollout Gradual

#### 4.3.1 Fase 1: Staging (1-2 dias)
```typescript
// Checklist Staging
const stagingChecklist = {
  environment_setup: [
    'Deploy em staging environment',
    'Configurar credenciais de teste',
    'Testar todos os fluxos críticos'
  ],
  integration_tests: [
    'Envio de SMS via BulkSMS',
    'Fallback para BulkGate',
    'Webhooks de confirmação',
    'Sistema de créditos completo'
  ],
  user_acceptance: [
    'Teste com usuários admin',
    'Validação de todas as funcionalidades',
    'Performance e responsividade'
  ]
};
```

#### 4.3.2 Fase 2: Produção Limitada (3-5 dias)
```typescript
// Rollout gradual
const productionRollout = {
  week_1: {
    users: 'admin_only',
    features: ['basic_sms', 'contact_management'],
    monitoring: 'enhanced_logging'
  },
  week_2: {
    users: 'selected_beta_users',
    features: ['full_campaign_management', 'credit_system'],
    monitoring: 'real_time_alerts'
  },
  week_3: {
    users: 'all_users',
    features: 'all_features',
    monitoring: 'standard_production'
  }
};
```

## 5. Checklist Final de Produção

### 5.1 Validação Técnica

#### 5.1.1 Infraestrutura
- [ ] **Supabase em produção** - Verificar limites e configurações
- [ ] **Edge Functions deployadas** - Testar todas as funções
- [ ] **Secrets configurados** - Validar todas as chaves de API
- [ ] **Webhooks funcionais** - Confirmar recebimento de callbacks
- [ ] **Banco de dados otimizado** - Índices e performance

#### 5.1.2 Gateways SMS
- [ ] **BulkSMS ativo** - Teste de envio e saldo
- [ ] **BulkGate configurado** - Credenciais e webhook
- [ ] **Fallback testado** - Simulação de falha e recuperação
- [ ] **Sender IDs aprovados** - Status validado em ambos gateways
- [ ] **Logs funcionais** - Rastreamento completo de mensagens

#### 5.1.3 Sistema de Usuários
- [ ] **Autenticação robusta** - Login/logout/registro
- [ ] **Gestão de créditos** - Compra, aprovação, consumo
- [ ] **Roles e permissões** - Admin vs usuário comum
- [ ] **Perfis completos** - Dados obrigatórios preenchidos

### 5.2 Validação Funcional

#### 5.2.1 Fluxos Críticos
```typescript
// Script de teste de produção
const productionTests = async () => {
  // 1. Teste de registro e login
  const user = await registerNewUser('test@example.com');
  await loginUser('test@example.com', 'password');
  
  // 2. Teste de solicitação de créditos
  const creditRequest = await requestCredits(100, 'bank_transfer');
  await adminApproveCredits(creditRequest.id);
  
  // 3. Teste de envio de SMS
  const campaign = await createCampaign('Test Production');
  const result = await sendSMS('+244900000000', 'Teste produção');
  
  // 4. Verificar logs e status
  const logs = await getSMSLogs(campaign.id);
  expect(logs.length).toBeGreaterThan(0);
  
  // 5. Teste de fallback
  await simulateGatewayFailure('bulksms');
  const fallbackResult = await sendSMS('+244900000001', 'Teste fallback');
  expect(fallbackResult.gateway_used).toBe('bulkgate');
};
```

### 5.3 Métricas de Sucesso

#### 5.3.1 KPIs de Produção
```typescript
interface ProductionKPIs {
  technical: {
    uptime: '>99.5%';
    sms_delivery_rate: '>98%';
    api_response_time: '<500ms';
    error_rate: '<1%';
  };
  business: {
    user_registration_completion: '>80%';
    credit_approval_time: '<4_hours';
    campaign_success_rate: '>95%';
    support_tickets: '<5_per_week';
  };
  user_experience: {
    page_load_time: '<3s';
    mobile_responsiveness: '100%';
    accessibility_score: '>90%';
    user_satisfaction: '>4.5/5';
  };
}
```

### 5.4 Plano de Suporte e Monitoramento

#### 5.4.1 Alertas Críticos
```typescript
// Configuração de alertas
const alertConfig = {
  sms_failures: {
    threshold: '5_failures_in_10_minutes',
    action: 'notify_admin_immediately'
  },
  gateway_down: {
    threshold: 'any_gateway_unavailable',
    action: 'activate_fallback_and_notify'
  },
  credit_requests: {
    threshold: 'new_request_received',
    action: 'notify_admin_email_and_whatsapp'
  },
  system_errors: {
    threshold: '10_errors_in_5_minutes',
    action: 'escalate_to_technical_team'
  }
};
```

#### 5.4.2 Documentação de Suporte
```markdown
# Manual de Operação - SMS Marketing Angola

## Contatos de Emergência
- **Técnico**: dev@kbagency.me
- **Admin**: accounts@kbagency.me  
- **WhatsApp Suporte**: +244 XXX XXX XXX

## Procedimentos Comuns
1. **Aprovar Créditos**: Admin Dashboard > Solicitações de Crédito
2. **Verificar Status SMS**: Relatórios > Logs de Envio
3. **Configurar Gateway**: Configurações > Gateways SMS
4. **Backup de Dados**: Automático diário via Supabase

## Troubleshooting
- Gateway offline: Verificar página de status do provedor
- SMS não entregues: Validar número e Sender ID
- Usuário sem acesso: Verificar roles em Gestão de Usuários
```

---

## Cronograma de Implementação

### Semana 1-2: Correções e QA
- [ ] Correção de bugs identificados
- [ ] Implementação de testes automatizados
- [ ] Validação completa de fluxos

### Semana 3-4: Novas Funcionalidades
- [ ] Sistema de importação de contatos
- [ ] Pagamentos offline com validação
- [ ] Ativação produção BulkGate

### Semana 5-6: UI/UX e Performance
- [ ] Refinamento de interfaces
- [ ] Otimizações de performance
- [ ] Implementação de acessibilidade

### Semana 7: Documentação e Rollout
- [ ] Documentação completa
- [ ] Testes de produção
- [ ] Deploy gradual

### Semana 8: Lançamento e Suporte
- [ ] Lançamento oficial
- [ ] Monitoramento intensivo
- [ ] Suporte e ajustes finais

**Total Estimado: 8 semanas para produção completa**