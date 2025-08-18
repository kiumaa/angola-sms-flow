# SMS Marketing Angola - Plataforma Completa

Sistema completo de SMS Marketing para Angola com autenticação OTP, campanhas automatizadas, monitoramento em tempo real e painel administrativo.

## 🚀 Deploy Rápido

1. **Lovable**: Clique "Publish" no editor
2. **Vercel**: `git clone` → `npm install` → `vercel --prod`
3. **Netlify**: Build: `npm run build`, Dir: `dist`

## ⚡ Características

- ✅ Autenticação OTP via SMS
- ✅ Campanhas automatizadas com scheduler
- ✅ Monitoramento em tempo real
- ✅ Dashboard administrativo completo
- ✅ Sistema de créditos e transações
- ✅ Gateways múltiplos (BulkSMS, Africa's Talking)
- ✅ Analytics avançado com exportação
- ✅ Notificações push em tempo real
- ✅ Cache inteligente e otimizações

## 🛠️ Stack

**Frontend:** React 18 + TypeScript + Tailwind CSS + shadcn/ui  
**Backend:** Supabase (PostgreSQL + Edge Functions)  
**SMS:** BulkSMS, Africa's Talking  
**Deploy:** Lovable, Vercel, Netlify

## 📋 Configuração

### Variáveis de Ambiente
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_key
BULKSMS_TOKEN_ID=seu_token_id
BULKSMS_TOKEN_SECRET=seu_token_secret
```

### Comandos
```bash
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run preview      # Preview build
```

## 📚 Documentação

- [Troubleshooting](docs/troubleshooting.md)
- [Changelog](CHANGELOG.md)
- [Suporte](mailto:suporte@smsmarketing.ao)

## 🌟 Status

**✅ COMPLETO** - Sistema pronto para produção com todas as funcionalidades implementadas.

---
*Desenvolvido com ❤️ usando Lovable*