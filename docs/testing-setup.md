# Configuração de Testes

## Dependências Instaladas

- **vitest**: Framework de testes rápido e moderno
- **@testing-library/react**: Utilitários para testar componentes React
- **@testing-library/jest-dom**: Matchers personalizados para testes DOM
- **jsdom**: Ambiente DOM para testes
- **@vitejs/plugin-react**: Plugin React para Vite/Vitest

## Configuração

### vitest.config.ts
- Configurado com ambiente jsdom
- Globals habilitados (describe, it, expect)
- Aliases configurados (@/ para src/)
- Setup file configurado

### src/test/setup.ts
- Importa @testing-library/jest-dom para matchers
- Declara globals do vitest para TypeScript

## Como Usar

### Executar Testes
```bash
# Executar todos os testes
npx vitest

# Executar testes em modo watch
npx vitest --watch

# Executar testes uma vez
npx vitest run

# Executar com coverage
npx vitest --coverage
```

### Estrutura de Testes
- Componentes: `src/components/__tests__/`
- Utilitários: `src/lib/__tests__/`
- Hooks: `src/hooks/__tests__/`

### Exemplo de Teste
```tsx
import { render } from '@testing-library/react'
import MeuComponente from '../MeuComponente'

describe('MeuComponente', () => {
  it('renderiza corretamente', () => {
    const { getByText } = render(<MeuComponente />)
    expect(getByText('Texto esperado')).toBeInTheDocument()
  })
})
```

## Testes Incluídos

### ErrorBoundary
- ✅ Testa renderização normal de componentes filhos
- ✅ Testa captura e exibição de erros

## Próximos Passos

1. Adicionar testes para componentes críticos (QuickSend, auth, etc.)
2. Configurar coverage reports
3. Adicionar testes E2E com Playwright
4. Configurar CI para executar testes automaticamente