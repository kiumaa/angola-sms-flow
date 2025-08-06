# SMS.AO - Especificação Completa de Design
## Sistema de Design Moderno, Clean e Minimalista

---

## 1. 🎨 Paleta de Cores

### Cores Primárias
```css
/* Cinza Escuro Primário (85% Preto) */
--primary: 220 39% 11%;           /* #1a1a1b */
--primary-foreground: 0 0% 100%;  /* #ffffff */

/* Neutras - Tons de Branco e Cinza */
--background: 220 14% 96%;        /* #f6f7f8 */
--card: 0 0% 100%;               /* #ffffff */
--muted: 220 14% 96%;            /* #f6f7f8 */
--border: 220 13% 86%;           /* #dddee0 */
```

### Escala de Cinzas SMS.AO
```css
--gray-50: 220 14% 98%;   /* #fafbfc - Mais claro */
--gray-100: 220 14% 96%;  /* #f6f7f8 - Background principal */
--gray-200: 220 13% 91%;  /* #e8e9eb - Separadores */
--gray-300: 220 13% 86%;  /* #dddee0 - Bordas */
--gray-400: 220 9% 76%;   /* #c1c4c7 - Texto placeholder */
--gray-500: 220 9% 56%;   /* #8b9196 - Texto secundário */
--gray-600: 220 14% 32%;  /* #4a505a - Texto principal */
--gray-700: 215 16% 24%;  /* #363c47 - Headers */
--gray-800: 215 20% 17%;  /* #252b36 - Elementos ativos */
--gray-900: 220 26% 14%;  /* #1e2329 - Texto escuro */
--gray-950: 220 39% 11%; /* #1a1a1b - Primária */
```

### Destaques Sutis (Apenas Hover)
```css
/* Estados de Hover - Elevação minimalista */
--shadow-glass: 0 2px 6px 0 hsl(220 39% 11% / 0.05);
--shadow-glow: 0 4px 12px 0 hsl(220 39% 11% / 0.08);
--shadow-elevated: 0 8px 24px 0 hsl(220 39% 11% / 0.12);
```

---

## 2. 📝 Tipografia

### Fontes
- **Primária:** Inter (preferida)
- **Secundária:** Sora (alternativa)
- **Fallback:** -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

### Hierarquia Tipográfica
```css
/* Tamanhos e Pesos */
font-family: 'Inter', 'Sora', sans-serif;

/* Corpo de Texto */
--text-body: 1rem;        /* 16px */
--weight-light: 300;      /* Light - padrão para textos */
--weight-regular: 400;    /* Regular - para elementos importantes */

/* Títulos */
--text-h1: 1.75rem;       /* 28px - Títulos principais */
--text-h2: 1.25rem;       /* 20px - Subtítulos */
--text-h3: 1rem;          /* 16px - Labels de seção */

/* Line Heights */
--leading-tight: 1.25;    /* Para títulos */
--leading-normal: 1.5;    /* Para corpo de texto */

/* Letter Spacing */
--tracking-tight: -0.01em;  /* Títulos */
--tracking-normal: 0;       /* Corpo */
```

### Aplicação Prática
```tsx
// Exemplo de uso em componentes
<h1 className="text-h1 font-light tracking-tight text-gray-950">
  Dashboard SMS.AO
</h1>

<p className="text-body font-light leading-normal text-gray-600">
  Gerencie suas campanhas de SMS de forma eficiente.
</p>
```

---

## 3. 🏗️ Layout e Componentes

### Grid Fluido Responsivo
```css
/* Container Principal */
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem; /* 32px */
}

/* Grid de Cards */
.metrics-grid {
  display: grid;
  gap: 1.5rem; /* 24px */
  
  /* Desktop: 3 colunas */
  grid-template-columns: repeat(3, 1fr);
  
  /* Tablet: 2 colunas */
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  /* Mobile: 1 coluna */
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}
```

### Cards de Métricas (Dashboard)
```tsx
// Componente Card Minimalista
const MetricCard = ({ title, value, subtitle }) => (
  <div className="bg-card rounded-minimal p-6 shadow-glass border border-border transition-all duration-300 hover:shadow-glow">
    <h3 className="text-h3 font-light text-gray-600 mb-2">{title}</h3>
    <p className="text-2xl font-light text-gray-950 mb-1">{value}</p>
    <p className="text-sm font-light text-gray-500">{subtitle}</p>
  </div>
);

// Métricas Principais
const dashboardMetrics = [
  { title: "Créditos Disponíveis", value: "1,234", subtitle: "R$ 247,80 em valor" },
  { title: "Campanhas Enviadas", value: "42", subtitle: "Este mês" },
  { title: "Usuários Ativos", value: "156", subtitle: "+12% vs mês anterior" },
  { title: "SMS Falhados", value: "3", subtitle: "0.2% taxa de falha" },
  { title: "Receita Total", value: "R$ 8.456", subtitle: "Últimos 30 dias" },
  { title: "Taxa de Conversão", value: "94.8%", subtitle: "SMS entregues" }
];
```

### Menu Lateral
```tsx
// Layout do Sidebar
const Sidebar = () => (
  <aside className="w-64 bg-sidebar border-r border-sidebar-border min-h-screen">
    <nav className="p-4 space-y-1">
      {navigation.map(item => (
        <Link 
          key={item.name}
          to={item.href}
          className={`flex items-center px-3 py-3 rounded-minimal text-sm font-light transition-all duration-300 ${
            item.current 
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" 
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          }`}
        >
          <item.icon className="h-4 w-4 mr-3" />
          <span>{item.name}</span>
        </Link>
      ))}
    </nav>
  </aside>
);
```

### Header Minimalista
```tsx
const Header = () => (
  <header className="h-16 bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-50">
    <div className="flex items-center justify-between h-full px-6">
      {/* Logo à esquerda */}
      <div className="flex items-center">
        <Logo className="h-8 w-auto" />
        <span className="ml-3 text-h2 font-light text-gray-950">SMS.AO</span>
      </div>
      
      {/* Toggle Dark Mode à direita */}
      <ThemeToggle />
    </div>
  </header>
);
```

---

## 4. 📱 Páginas Principais

### 1. Login / Registro
```tsx
const LoginPage = () => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <Card className="p-8 shadow-elevated border-border">
        <div className="text-center mb-8">
          <Logo className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-h1 font-light text-gray-950">Acesso SMS.AO</h1>
          <p className="text-body font-light text-gray-500 mt-2">
            Entre com suas credenciais
          </p>
        </div>
        
        <form className="space-y-4">
          <Input 
            placeholder="Email" 
            className="h-12 rounded-minimal border-gray-300 focus:border-primary focus:ring-primary/20"
          />
          <Input 
            type="password" 
            placeholder="Senha"
            className="h-12 rounded-minimal border-gray-300 focus:border-primary focus:ring-primary/20" 
          />
          <Button className="w-full h-12 rounded-minimal font-light">
            Entrar
          </Button>
        </form>
      </Card>
    </div>
  </div>
);
```

### 2. Dashboard (Home)
```tsx
const Dashboard = () => (
  <div className="p-6 space-y-8">
    {/* Header da Página */}
    <div>
      <h1 className="text-h1 font-light text-gray-950 mb-2">Dashboard</h1>
      <p className="text-body font-light text-gray-600">
        Visão geral das suas campanhas de SMS
      </p>
    </div>
    
    {/* Grid de Métricas */}
    <div className="metrics-grid">
      {dashboardMetrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
    
    {/* Seções Adicionais */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h2 className="text-h2 font-light text-gray-950 mb-4">Campanhas Recentes</h2>
        {/* Lista de campanhas */}
      </Card>
      
      <Card className="p-6">
        <h2 className="text-h2 font-light text-gray-950 mb-4">Atividade do Sistema</h2>
        {/* Log de atividades */}
      </Card>
    </div>
  </div>
);
```

### 3. Páginas de Gestão (Usuários, Pacotes, etc.)
```tsx
const UsersPage = () => (
  <div className="p-6 space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-h1 font-light text-gray-950">Usuários</h1>
        <p className="text-body font-light text-gray-600">
          Gerencie os usuários da plataforma
        </p>
      </div>
      
      <Button className="rounded-minimal shadow-glass hover:shadow-glow">
        <Plus className="h-4 w-4 mr-2" />
        Novo Usuário
      </Button>
    </div>
    
    <Card className="shadow-glass border-border">
      <Table>
        {/* Tabela de usuários com design minimalista */}
      </Table>
    </Card>
  </div>
);
```

### 4. Configurações SMS & Gateways
```tsx
const SMSConfigPage = () => (
  <div className="p-6 space-y-6">
    <div>
      <h1 className="text-h1 font-light text-gray-950">Configurações SMS</h1>
      <p className="text-body font-light text-gray-600">
        Configure os gateways e Sender IDs
      </p>
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Card BulkSMS */}
      <Card className="p-6 shadow-glass">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2 font-light text-gray-950">BulkSMS</h2>
          <Badge variant="outline" className="text-xs">Primário</Badge>
        </div>
        {/* Configurações do gateway */}
      </Card>
      
      {/* Card BulkGate */}
      <Card className="p-6 shadow-glass">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2 font-light text-gray-950">BulkGate</h2>
          <Badge variant="outline" className="text-xs">Fallback</Badge>
        </div>
        {/* Configurações do gateway */}
      </Card>
    </div>
  </div>
);
```

### 5. Personalização
```tsx
const BrandPage = () => (
  <div className="p-6">
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-h1 font-light text-gray-950 mb-2">Personalização</h1>
        <p className="text-body font-light text-gray-600">
          Customize a aparência da sua plataforma
        </p>
      </div>
      
      <Card className="p-8 shadow-elevated">
        <div className="space-y-6">
          {/* Controle de Cor Primária */}
          <div>
            <label className="text-h3 font-light text-gray-950 mb-3 block">
              Cor Primária
            </label>
            <ColorPicker defaultValue="#1a1a1b" />
          </div>
          
          {/* Toggle Dark Mode */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-h3 font-light text-gray-950">Modo Escuro</label>
              <p className="text-sm font-light text-gray-500 mt-1">
                Alternar entre tema claro e escuro
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </Card>
    </div>
  </div>
);
```

---

## 5. 🌙 Dark Mode

### Transições Suaves
```css
/* Transição global para Dark Mode */
* {
  transition: background-color 300ms ease, color 300ms ease, border-color 300ms ease;
}
```

### Cores Dark Mode
```css
.dark {
  --background: 220 26% 7%;     /* #0f1114 - Fundo principal */
  --card: 220 20% 10%;          /* #171a1f - Cards */
  --foreground: 0 0% 100%;      /* #ffffff - Texto principal */
  --muted: 220 20% 10%;         /* #171a1f - Áreas secundárias */
  --border: 220 16% 15%;        /* #232832 - Bordas */
  
  /* Shadows ajustadas para leveza */
  --shadow-glass: 0 4px 12px 0 hsl(0 0% 0% / 0.4);
  --shadow-glow: 0 8px 24px 0 hsl(0 0% 0% / 0.5);
  --shadow-elevated: 0 12px 32px 0 hsl(0 0% 0% / 0.6);
}
```

---

## 6. ♿ Acessibilidade e Performance

### Contraste WCAG AA
```css
/* Verificação de Contraste */
/* Texto principal sobre fundo claro: 4.5:1 ✓ */
color: hsl(220 39% 11%);    /* #1a1a1b */
background: hsl(0 0% 100%); /* #ffffff */

/* Texto secundário: 3:1 ✓ */
color: hsl(220 14% 32%);    /* #4a505a */
background: hsl(0 0% 100%); /* #ffffff */

/* Estados de foco visíveis */
.focus-visible {
  outline: 2px solid hsl(220 39% 11%);
  outline-offset: 2px;
}
```

### Performance
```html
<!-- Preload da fonte crítica -->
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>

<!-- CSS crítico inline para primeiro render -->
<style>
  /* CSS crítico para Above the Fold */
  .critical-css { ... }
</style>
```

---

## 7. 🧩 Tokens Tailwind/CSS

### Configuração Tailwind
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'Sora', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'h1': ['1.75rem', { lineHeight: '2rem', fontWeight: '300' }],
        'h2': ['1.25rem', { lineHeight: '1.5rem', fontWeight: '300' }],
        'h3': ['1rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.5rem', fontWeight: '300' }],
      },
      borderRadius: {
        'minimal': '4px',
      },
      spacing: {
        '18': '4.5rem',  // 72px
      },
      boxShadow: {
        'glass': 'var(--shadow-glass)',
        'glow': 'var(--shadow-glow)',
        'elevated': 'var(--shadow-elevated)',
      }
    }
  }
}
```

### Tokens de Espaçamento
```css
/* Sistema de Espaçamento SMS.AO */
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
```

---

## 8. 📋 Guia de Componentes

### Button Variants
```tsx
// Componente Button com variantes SMS.AO
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-minimal text-sm font-light transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-glass hover:shadow-glow",
        outline: "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        minimal: "text-gray-600 hover:text-gray-950 hover:bg-gray-100",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
      },
    },
  }
);
```

### Card Component
```tsx
const Card = ({ className, children, ...props }) => (
  <div
    className={cn(
      "rounded-minimal bg-card text-card-foreground shadow-glass border border-border",
      className
    )}
    {...props}
  >
    {children}
  </div>
);
```

### Input Component
```tsx
const Input = ({ className, ...props }) => (
  <input
    className={cn(
      "flex h-10 w-full rounded-minimal border border-border bg-background px-3 py-2 text-sm font-light ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-light placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
);
```

---

## 9. ✅ Checklist de Implementação

### Fase 1: Design System (✅ Concluído)
- [x] Atualizar tokens de cor no `index.css`
- [x] Configurar tipografia no `tailwind.config.ts`
- [x] Criar variantes de componentes
- [x] Implementar dark mode

### Fase 2: Componentes Base
- [ ] Atualizar componente Button com variantes SMS.AO
- [ ] Redesenhar Cards com novo estilo
- [ ] Implementar Input minimalista
- [ ] Criar componente MetricCard

### Fase 3: Layout Principal
- [ ] Redesenhar AdminLayout com novo sidebar
- [ ] Atualizar Header com toggle de tema
- [ ] Implementar grid responsivo
- [ ] Criar transições suaves

### Fase 4: Páginas Específicas
- [ ] Redesenhar Dashboard com métricas
- [ ] Atualizar páginas de gestão
- [ ] Redesenhar configurações SMS
- [ ] Implementar página de personalização

### Fase 5: Refinamentos
- [ ] Testar contraste de acessibilidade
- [ ] Otimizar performance de carregamento
- [ ] Implementar estados de loading
- [ ] Criar documentação de componentes

---

## 🎯 Resultado Final

O design final da SMS.AO será:
- **Minimalista**: Sem elementos desnecessários
- **Consistente**: Sistema de design unificado
- **Moderno**: Técnicas atuais de UI/UX
- **Acessível**: WCAG AA compliance
- **Performático**: Carregamento otimizado
- **Responsivo**: Adaptável a todos os dispositivos

Esta especificação serve como guia completo para a implementação do design final da plataforma SMS.AO.