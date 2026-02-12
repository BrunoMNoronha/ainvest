# Segurança

## Visão Geral

A segurança do AInvest é implementada em múltiplas camadas, seguindo o princípio de defesa em profundidade.

```
┌─────────────────────────────────────────────────────────┐
│                    CAMADAS DE SEGURANÇA                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              1. FRONTEND                         │    │
│  │  - CSP headers                                   │    │
│  │  - XSS prevention                                │    │
│  │  - HTTPS only                                    │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │              2. EDGE FUNCTION                    │    │
│  │  - CORS validation                               │    │
│  │  - Input sanitization                            │    │
│  │  - Rate limiting                                 │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │              3. SECRETS                          │    │
│  │  - Encrypted at rest                             │    │
│  │  - Never exposed to frontend                     │    │
│  │  - Rotated periodically                          │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Autenticação e Controle de Acesso

### Modelo de Acesso

| Área | Acesso |
|------|--------|
| Dashboard / Market Data | Público (somente leitura) |
| Docs: Roadmap CRUD | Admin autenticado |
| Docs: Regras CRUD | Admin autenticado |
| Docs: Histórico CRUD | Admin autenticado |

### Implementação

- **Tabela `user_roles`**: Armazena papéis separados da tabela `auth.users`
- **Enum `app_role`**: Apenas `admin` por enquanto
- **Função `has_role()`**: `SECURITY DEFINER` para evitar recursão em RLS
- **RLS**: Políticas de INSERT/UPDATE/DELETE nas tabelas `business_rules`, `roadmap_items` e `development_history` condicionadas a `has_role(auth.uid(), 'admin')`

### Fluxo de Login

1. Admin acessa `/login` com email + senha
2. `useAuth()` verifica sessão via `onAuthStateChange`
3. Consulta `user_roles` para confirmar papel admin
4. Botões de CRUD exibidos condicionalmente nas páginas de documentação

### Criação de Admin

Admins são criados manualmente via INSERT na tabela `user_roles`:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<uuid-do-usuario>', 'admin');
```

Não há cadastro público. Apenas login.

## Gestão de Secrets

### Secrets Armazenados

| Secret | Propósito | Rotação |
|--------|-----------|---------|
| `BRAPI_TOKEN` | Autenticação BRAPI.dev | Anual |
| `HG_BRASIL_KEY` | Autenticação HG Brasil | Anual |
| `UPSTASH_REDIS_REST_URL` | URL do Upstash Redis | Nunca |
| `UPSTASH_REDIS_REST_TOKEN` | Token do Upstash Redis | Anual |

### Fonte Unica

As credenciais ficam centralizadas no arquivo `.env` na raiz do projeto.
Em ambientes Supabase, sincronize essas variaveis com os secrets do projeto.

### Princípios

1. **Nunca no código**: Secrets jamais são commitados
2. **Apenas backend**: Chaves privadas só existem na Edge Function
3. **Variáveis de ambiente**: Uso de `Deno.env.get()`
4. **Criptografia em repouso**: Supabase criptografa secrets
5. **Fonte unica local**: `.env` como referencia para o desenvolvimento

### Configuração

```env
BRAPI_TOKEN=
HG_BRASIL_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

```typescript
// Edge Function - Acesso seguro
const BRAPI_TOKEN = Deno.env.get('BRAPI_TOKEN');
const HG_BRASIL_KEY = Deno.env.get('HG_BRASIL_KEY');

if (!BRAPI_TOKEN || !HG_BRASIL_KEY) {
  throw new Error('Missing required API keys');
}
```

```bash
# Sincronizar secrets no Supabase
supabase secrets set --env-file .env
```

## CORS

### Configuração

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};
```

### Domínios Permitidos

Atualmente permissivo (`*`). Restringir por dominio conforme o ambiente de deploy.

## Rate Limiting

### Implementação

```typescript
const RATE_LIMITS = {
  perMinute: 60,
  perHour: 1000
};

async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `ratelimit:${ip}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, 60);
  }
  
  return count <= RATE_LIMITS.perMinute;
}
```

### Resposta ao Exceder

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retryAfter": 60
  }
}
```

**HTTP Status**: 429 Too Many Requests

## Validação de Inputs

### Símbolos de Ativos

```typescript
const SYMBOL_REGEX = /^[A-Z]{4}[0-9]{1,2}$/;

function validateSymbol(symbol: string): boolean {
  return SYMBOL_REGEX.test(symbol.toUpperCase());
}

function sanitizeSymbols(input: string): string[] {
  return input
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(validateSymbol)
    .slice(0, 20); // Máximo 20 símbolos
}
```

### Range de Histórico

```typescript
const VALID_RANGES = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y'];

function validateRange(range: string): string {
  return VALID_RANGES.includes(range) ? range : '1mo';
}
```

## Headers de Segurança

### Frontend

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               connect-src 'self' https://*.supabase.co;">
```

### Edge Function

```typescript
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};
```

## Disclaimer Legal

### Texto Obrigatório

> ⚠️ **AVISO IMPORTANTE**
> 
> Os dados exibidos nesta plataforma possuem atraso de 15 minutos em relação 
> ao pregão da B3. As informações apresentadas são de caráter educacional e 
> informativo, não constituindo recomendação de investimento, oferta ou 
> solicitação de compra ou venda de qualquer ativo financeiro.
> 
> O AInvest não se responsabiliza por decisões de investimento tomadas com 
> base nas informações aqui apresentadas. Consulte um profissional certificado 
> antes de realizar operações no mercado financeiro.
> 
> Investimentos em renda variável envolvem riscos, inclusive a possibilidade 
> de perdas superiores ao capital investido.

### Implementação

```tsx
export function MarketDisclaimer() {
  return (
    <Alert variant="default" className="mt-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Aviso Importante</AlertTitle>
      <AlertDescription>
        Os dados exibidos possuem atraso de 15 minutos em relação ao pregão da B3. 
        Esta plataforma tem caráter informativo e educacional, não constituindo 
        recomendação de investimento.
      </AlertDescription>
    </Alert>
  );
}
```

## Checklist de Segurança

### Deploy

- [ ] Secrets configurados no Supabase
- [ ] CORS restrito aos domínios corretos
- [ ] Rate limiting ativo
- [ ] HTTPS enforçado
- [ ] Headers de segurança configurados

### Código

- [ ] Nenhum secret no código fonte
- [ ] Inputs validados e sanitizados
- [ ] Erros não expõem informações sensíveis
- [ ] Logs não contêm dados de usuários

### Monitoramento

- [ ] Alertas para rate limit excessivo
- [ ] Logs de erros de autenticação
- [ ] Monitoramento de uso anômalo

## Resposta a Incidentes

### Classificação

| Severidade | Descrição | SLA Resposta |
|------------|-----------|--------------|
| Crítica | Vazamento de dados, API keys expostas | 1 hora |
| Alta | DDoS, falha de autenticação | 4 horas |
| Média | Rate limit burlado, XSS | 24 horas |
| Baixa | Logs excessivos, erros cosméticos | 72 horas |

### Procedimento

1. **Identificar**: Confirmar natureza do incidente
2. **Conter**: Isolar sistemas afetados
3. **Erradicar**: Remover causa raiz
4. **Recuperar**: Restaurar operação normal
5. **Documentar**: Post-mortem detalhado

---

**Anterior**: [API](./06-api.md) | **Próximo**: [Operação](./08-operacao.md)
