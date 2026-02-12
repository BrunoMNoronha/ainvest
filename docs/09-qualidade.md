# Qualidade

## Estratégia de Testes

### Pirâmide de Testes

```
          ┌─────────────┐
          │    E2E      │  Poucos, lentos, alto valor
          │   Tests     │
          ├─────────────┤
          │ Integration │  Alguns, médios
          │   Tests     │
          ├─────────────┤
          │    Unit     │  Muitos, rápidos, baixo custo
          │   Tests     │
          └─────────────┘
```

### Tipos de Teste

| Tipo | Ferramenta | Cobertura Alvo |
|------|------------|----------------|
| Unit | Vitest | 80% funções utilitárias |
| Integration | Vitest + MSW | 60% hooks/services |
| E2E | Playwright | Fluxos críticos |

## Testes Unitários

### Configuração

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Exemplos

```typescript
// formatRelativeTime.test.ts
import { describe, it, expect, vi } from 'vitest';
import { formatRelativeTime } from '@/hooks/useMarketData';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T15:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "agora" for less than 1 minute ago', () => {
    const date = new Date('2026-02-03T14:59:30Z');
    expect(formatRelativeTime(date.toISOString())).toBe('agora');
  });

  it('returns "há 1 min" for exactly 1 minute ago', () => {
    const date = new Date('2026-02-03T14:59:00Z');
    expect(formatRelativeTime(date.toISOString())).toBe('há 1 min');
  });

  it('returns "há X min" for multiple minutes', () => {
    const date = new Date('2026-02-03T14:45:00Z');
    expect(formatRelativeTime(date.toISOString())).toBe('há 15 min');
  });

  it('returns "há 1 hora" for exactly 1 hour ago', () => {
    const date = new Date('2026-02-03T14:00:00Z');
    expect(formatRelativeTime(date.toISOString())).toBe('há 1 hora');
  });
});
```

```typescript
// validateSymbol.test.ts
import { describe, it, expect } from 'vitest';
import { validateSymbol, sanitizeSymbols } from '@/utils/validation';

describe('validateSymbol', () => {
  it('accepts valid B3 symbols', () => {
    expect(validateSymbol('PETR4')).toBe(true);
    expect(validateSymbol('VALE3')).toBe(true);
    expect(validateSymbol('BOVA11')).toBe(true);
  });

  it('rejects invalid symbols', () => {
    expect(validateSymbol('PETR')).toBe(false);
    expect(validateSymbol('petr4')).toBe(false);
    expect(validateSymbol('P4TR4')).toBe(false);
    expect(validateSymbol('')).toBe(false);
  });
});

describe('sanitizeSymbols', () => {
  it('parses comma-separated symbols', () => {
    expect(sanitizeSymbols('PETR4,VALE3')).toEqual(['PETR4', 'VALE3']);
  });

  it('filters invalid symbols', () => {
    expect(sanitizeSymbols('PETR4,invalid,VALE3')).toEqual(['PETR4', 'VALE3']);
  });

  it('limits to 20 symbols', () => {
    const input = Array(25).fill('PETR4').join(',');
    expect(sanitizeSymbols(input)).toHaveLength(20);
  });
});
```

## Testes de Integração

### Mocking de APIs

```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('*/market-data/market-overview', () => {
    return HttpResponse.json({
      ibov: { name: 'IBOVESPA', value: 128500, change: 1250, changePercent: 0.98 },
      usdBrl: { buy: 5.25, sell: 5.26, change: 0.15 },
      cached: true,
      cacheAge: 120
    });
  }),

  http.get('*/market-data/quote', ({ request }) => {
    const url = new URL(request.url);
    const symbols = url.searchParams.get('symbols')?.split(',') || [];
    
    return HttpResponse.json({
      data: symbols.map(symbol => ({
        symbol,
        name: `${symbol} Company`,
        price: 100,
        change: 1,
        changePercent: 1
      })),
      cached: false
    });
  }),
];
```

### Teste de Hook

```typescript
// useMarketOverview.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMarketOverview } from '@/hooks/useMarketData';

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useMarketOverview', () => {
  it('fetches market overview data', async () => {
    const { result } = renderHook(() => useMarketOverview(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.ibov.name).toBe('IBOVESPA');
    expect(result.current.data?.usdBrl.buy).toBe(5.25);
  });
});
```

## Cobertura de Código

### Configuração

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        'src/components/ui/', // shadcn components
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
});
```

### Relatório

```bash
# Gerar relatório de cobertura
npm run test:coverage
```

**Alvos por área**:

| Área | Cobertura Alvo |
|------|----------------|
| Utils/Helpers | 90% |
| Hooks | 80% |
| Services | 80% |
| Components | 60% |

## Linting e Formatação

### ESLint

```javascript
// eslint.config.js
export default [
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
    },
  },
];
```

### Prettier

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Scripts

```json
// package.json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx}\""
  }
}
```

## Métricas de Qualidade

### Métricas Técnicas

| Métrica | Alvo | Ferramenta |
|---------|------|------------|
| Cobertura de testes | > 70% | Vitest |
| Complexidade ciclomática | < 10 | ESLint |
| Duplicação de código | < 5% | SonarQube |
| Débito técnico | < 2 dias | SonarQube |

### Métricas de Performance

| Métrica | Alvo | Ferramenta |
|---------|------|------------|
| Lighthouse Score | > 90 | Lighthouse CI |
| FCP (First Contentful Paint) | < 1.5s | Web Vitals |
| TTI (Time to Interactive) | < 3s | Web Vitals |
| Bundle size | < 500KB | Vite |

### Métricas de Produto

| Métrica | Alvo | Frequência |
|---------|------|------------|
| Taxa de acerto dos sinais | > 55% | Mensal |
| Uptime | > 99.5% | Contínuo |
| Latência P95 | < 2s | Contínuo |
| NPS | > 40 | Trimestral |

## CI/CD Pipeline

### GitHub Actions (Exemplo)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
      
      - name: Lint
        run: bun run lint
      
      - name: Type check
        run: bun run typecheck
      
      - name: Test
        run: bun run test
      
      - name: Coverage
        run: bun run test:coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
      
      - name: Build
        run: bun run build
      
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
```

## Definition of Done

### Para código ser considerado "pronto":

- [ ] Testes unitários escritos e passando
- [ ] Cobertura de código mantida ou aumentada
- [ ] Sem erros de lint
- [ ] Documentação atualizada (se aplicável)
- [ ] Code review aprovado
- [ ] Funciona em produção (verificação pós-deploy)

---

**Anterior**: [Operação](./08-operacao.md) | **Índice**: [README](./README.md)
