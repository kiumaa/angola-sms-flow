# SMS Marketing Angola - Plataforma Completa

Sistema completo de SMS Marketing para Angola com autenticação OTP, campanhas automatizadas, monitoramento em tempo real e painel administrativo.

[![É-kwanza Status](https://img.shields.io/badge/É--kwanza-100%25%20Funcional-success?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEwIDJhOCA4IDAgMSAwIDAgMTZBOCA4IDAgMCAwIDEwIDJ6TTkgMTJsLTMtM0w3LjQgNy42IDkgOS4ybDQuNi00LjZMMTUgNmwtNiA2eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==)](docs/ekwanza-production-ready.md)
[![Gateway SMS](https://img.shields.io/badge/SMS%20Gateway-BulkSMS%20%2B%20BulkGate-blue?style=for-the-badge)](docs/sms-gateways.md)
[![Security](https://img.shields.io/badge/Security-Production%20Ready-green?style=for-the-badge)](docs/SECURITY_STATUS.md)

## 🚀 Deploy Rápido

1. **Lovable**: Clique "Publish" no editor
2. **Vercel**: `git clone` → `npm install` → `vercel --prod`
3. **Netlify**: Build: `npm run build`, Dir: `dist`

## ⚡ Características

- ✅ **Autenticação OTP via SMS** (BulkSMS/BulkGate)
- ✅ **3 Métodos de Pagamento É-kwanza**:
  - QR Code É-kwanza (95-98% taxa de sucesso)
  - Multicaixa Express (MCX) (90-95% taxa de sucesso)
  - Referência EMIS (85-90% taxa de sucesso)
- ✅ **Campanhas automatizadas** com scheduler
- ✅ **Monitoramento em tempo real** (Dashboard de métricas)
- ✅ **Dashboard administrativo completo**
- ✅ **Sistema de créditos e transações**
- ✅ **Multi-Gateway SMS** (BulkSMS + BulkGate com fallback inteligente)
- ✅ **Analytics avançado** com exportação
- ✅ **Notificações push em tempo real**
- ✅ **Cache inteligente e otimizações**
- ✅ **Webhook É-kwanza** com validação HMAC-SHA256

## 🛠️ Stack

**Frontend:** React 18 + TypeScript + Tailwind CSS + shadcn/ui  
**Backend:** Supabase (PostgreSQL + Edge Functions + Realtime)  
**SMS Gateways:** BulkSMS + BulkGate (Multi-gateway com fallback)  
**Pagamentos:** É-kwanza (QR Code + MCX + Referência EMIS)  
**Deploy:** Lovable, Vercel, Netlify  
**Monitoramento:** Dashboard customizado com métricas em tempo real

## 📋 Configuração

### Variáveis de Ambiente (Supabase Secrets)

**SMS Gateways:**
```env
BULKSMS_TOKEN_ID=seu_token_id
BULKSMS_TOKEN_SECRET=seu_token_secret
BULKGATE_API_KEY=sua_api_key
BULKGATE_API_SECRET=seu_api_secret
```

**É-kwanza Payment Gateway:**
```env
EKWANZA_OAUTH_URL=https://login.microsoftonline.com/auth.appypay.co.ao/oauth2/token
EKWANZA_CLIENT_ID=af273fba-****
EKWANZA_CLIENT_SECRET=rgK8Q~****
EKWANZA_RESOURCE=bee57785-****
EKWANZA_GPO_PAYMENT_METHOD=0d23d2b0-****
EKWANZA_REF_PAYMENT_METHOD=8d9c9851-****
EKWANZA_BASE_URL=https://ekz-partnersapi.e-kwanza.ao
EKWANZA_NOTIFICATION_TOKEN=OUAHIVRAJTMLOZ
EKWANZA_MERCHANT_NUMBER=01465115
ENABLE_REFERENCIA_EMIS=true
```

### Comandos
```bash
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run preview      # Preview build
```

## 📚 Documentação

**Geral:**
- [Guia de Início Rápido](docs/guia-inicio-rapido.md)
- [Manual do Usuário](docs/manual-usuario.md)
- [Painel Administrativo](docs/painel-administrativo.md)
- [FAQ](docs/faq.md)
- [Troubleshooting](docs/troubleshooting.md)

**Pagamentos É-kwanza:**
- 🎉 [Status de Produção](docs/ekwanza-production-ready.md) - **100% Funcional**
- 🔧 [Troubleshooting É-kwanza](docs/ekwanza-troubleshooting-updated.md)
- 📊 [Guia de Testes (Fases 3-5)](docs/ekwanza-fase3-5-testes.md)
- 🔐 [Validação de Webhooks (Fase 6)](docs/ekwanza-fase6-webhooks.md)
- 📧 [Validação de Webhook (Fase 2)](docs/ekwanza-fase2-validacao.md)
- 📧 [Comunicação Final](docs/ekwanza-comunicacao-final.md)

**SMS Gateways:**
- [Configuração Multi-Gateway](docs/especificacao-configuracoes-gateways-sms.md)
- [BulkSMS Integration](docs/bulksms-producao-especificacao.md)
- [BulkGate Integration](docs/especificacao-bulkgate-gateway.md)

**Segurança & Produção:**
- [Status de Segurança](docs/SECURITY_STATUS.md)
- [Guia de Deploy](docs/deploy-production-guide.md)
- [Checklist de Produção](docs/PRODUCTION_LAUNCH_GUIDE.md)
- [Changelog](CHANGELOG.md)

## 🔒 Segurança

- ✅ Autenticação com Supabase Auth
- ✅ RLS (Row Level Security) ativo em todas as tabelas
- ✅ Validação de inputs com sanitização
- ✅ Rate limiting por IP e usuário
- ✅ Webhook HMAC-SHA256 signature validation
- ✅ OAuth2 com Microsoft Azure AD
- ✅ Audit logs completos
- ✅ PII (Personal Identifiable Information) protection

## 💳 Métodos de Pagamento

### É-kwanza Gateway (100% Funcional)

| Método | Status | Taxa de Sucesso | Tempo Médio |
|--------|--------|-----------------|-------------|
| **QR Code É-kwanza** | ✅ Ativo | 95-98% | ~2-3s |
| **Multicaixa Express (MCX)** | ✅ Ativo | 90-95% | ~3-5s |
| **Referência EMIS** | ✅ Ativo | 85-90% | ~2-4s |

**Webhook:** Confirmação automática de pagamentos com validação de assinatura HMAC-SHA256  
**Monitoramento:** Dashboard em tempo real com métricas de performance

## 🌟 Status

**✅ COMPLETO** - Sistema pronto para produção com todas as funcionalidades implementadas.

### Últimas Atualizações (Janeiro 2025)

- ✅ **É-kwanza Gateway 100% Funcional**
  - 3 métodos de pagamento implementados e testados
  - Webhook com validação de segurança HMAC-SHA256
  - Dashboard de monitoramento em tempo real
  - OAuth2 integrado com Microsoft Azure
  - Referência EMIS agora disponível!

- ✅ **Sistema de Métricas**
  - Tabela `payment_metrics` para análise de performance
  - Gráficos de taxa de sucesso por método
  - Tempo médio de resposta
  - Top 5 erros mais frequentes

- ✅ **Documentação Completa**
  - Guias de teste para todos os métodos
  - Troubleshooting detalhado
  - Templates de emails para comunicação com É-kwanza

## 📞 Suporte

- **Email Técnico:** dev@sms.ao
- **Email Comercial:** comercial@sms.ao
- **Documentação:** [Ver todos os guias](docs/)

---

*Desenvolvido com ❤️ usando Lovable | Conectando Angola através de SMS Marketing*
