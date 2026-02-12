# Arquitetura Técnica

## Stack Tecnológico

### Frontend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 18.3 | UI library |
| Vite | 5.x | Build tool |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | - | Componentes UI |
| React Query | 5.x | Data fetching |
| Recharts | 2.x | Gráficos |
| React Router | 6.x | Roteamento |

### Backend

| Tecnologia | Propósito |
|------------|-----------|
| Supabase Edge Functions | API proxy e coleta |
| Supabase PostgreSQL | Persistência de dados |
| pg_cron | Agendamento de coleta |
| pg_net | Chamadas HTTP do banco |
| Upstash Redis | Cache SWR |
| Deno | Runtime das Edge Functions |

### Infraestrutura

| Serviço | Uso |
|---------|-----|
| Hospedagem estatica | Hosting e deploy |
| Supabase | Backend as a Service |
| Upstash | Managed Redis |

## Banco de Dados

### Tabelas Principais

| Tabela | Propósito |
|--------|-----------|
| `market_candles_daily` | Candles diários (OHLCV) |
| `quotes_latest` | Cache de cotações atuais |
| `macro_indicators` | SELIC, CDI, USD/BRL |
| `market_calendar` | Feriados B3 |
| `daily_closure_log` | Controle de idempotência |
| `market_data_logs` | Logs de execução |

### Coleta Automática (pg_cron)

```sql
-- A cada 30 minutos durante pregão
schedule: '0,30 10-17 * * 1-5'
command: SELECT collect_market_data()
```

Fluxo:
1. `pg_cron` dispara `collect_market_data()`
2. Função verifica `is_market_open()` consultando `market_calendar`
3. Chama Edge Function `/collect` via `pg_net`
4. `process_collected_data()` persiste com UPSERT
5. Após 17h, fecha candle diário

## Padrão de Coleta de Dados

Para otimizar a performance e reduzir a dependência de APIs externas em tempo real, o AInvest utiliza um padrão de coleta assíncrona.

```
┌───────────┐      ┌────────────────────────┐      ┌────────────────────┐      ┌───────────────┐
│  pg_cron  │───▶ │ collect_market_data()  │───▶ │ Edge Function      │───▶ │ External APIs │
│ (Scheduler) │      │ (PostgreSQL Function)  │      │ (/collect Endpoint)│      │ (BRAPI, etc.) │
└───────────┘      └──────────────┬─────────┘      └──────────┬─────────┘      └───────────────┘
                                  │                         │
                                  └───────────────────┬─────┘
                                                      │ INSERT/UPDATE
                                                      ▼
                                       ┌────────────────────────┐
                                       │   PostgreSQL DB        │
                                       │ (quotes_latest, etc)   │
                                       └────────────────────────┘
```

1.  **Agendamento**: `pg_cron` executa a função `collect_market_data()` em intervalos regulares (e.g., a cada 30 minutos).
2.  **Chamada Segura**: A função `collect_market_data()` usa `pg_net` para fazer uma chamada POST para o endpoint `/collect` da Edge Function.
3.  **Coleta**: A Edge Function busca os dados mais recentes das APIs externas (BRAPI, HG Brasil).
4.  **Persistência**: Os dados coletados são então inseridos ou atualizados (UPSERT) nas tabelas do banco de dados, como `quotes_latest` e `market_candles_daily`.

Este ciclo garante que o banco de dados local tenha um "cache quente" dos dados de mercado mais importantes durante o pregão.

## Fluxo de Dados (Estratégia "DB-First")

A aplicação frontend adota uma estratégia **"DB-first"** para buscar dados, priorizando a leitura do banco de dados PostgreSQL antes de recorrer à Edge Function. Isso resulta em menor latência e maior resiliência.

### Diagrama de Fluxo

```
                                    ┌───────────────────────┐
                               ┌───▶│   PostgreSQL DB       │
                               │    │ (leitura principal)   │
             (1) Read DB First │    └───────────────────────┘
                               │
┌──────────┐      ┌────────────┴───┐      ┌────────────────────┐      ┌───────────────┐
│ Frontend │───▶  │ marketApi.ts   │      │ Edge Function      │      │ External APIs │
│  (Hook)  │      │ (DB-first logic) │───▶  │ (/quote Endpoint)  │───▶  │ (BRAPI, etc.) │
└──────────┘      └────────────┬───┘ (3)  └──────────┬─────────┘      └───────────────┘
                               │ Fallback           │
                 (2) DB stale? │                    │ (4) Cache
                               │                    │
                               └───────────────────▶│ Upstash Redis  │
                                                    └────────────────┘
```

### Request de Cotação (DB-First)

1.  **Chamada do Hook**: Um componente de UI (e.g., `Watchlist`) chama o hook `useQuotes()`.
2.  **Estratégia DB-First**: O hook invoca `getQuotesDBFirst()` no `marketApi.ts`.
    *   **Tentativa 1 (Banco de Dados)**: A função primeiro consulta a tabela `quotes_latest` no PostgreSQL.
    *   **Validação de "Frescor"**: Se os dados existem e foram atualizados nos últimos 5 minutos (`MAX_DATA_AGE_MS`), eles são retornados imediatamente ao frontend.
3.  **Fallback para Edge Function**: Se os dados no banco de dados estão ausentes ou "velhos" (stale):
    *   A função `getQuotes()` é chamada como fallback.
    *   Ela invoca a Edge Function `/quote`.
4.  **Cache SWR na Edge Function**: A Edge Function, por sua vez, possui sua própria lógica de cache com Upstash Redis, funcionando como um segundo nível de cache para proteger as APIs externas.
5.  **Renderização**: Os dados (do DB ou da Edge Function) são armazenados no cache do React Query e renderizados na UI.

## Edge Function: market-data

### Estrutura

```typescript
supabase/functions/market-data/
└── index.ts    # Handler principal com rotas
```

### Rotas

| Rota | Método | Descrição |
|------|--------|-----------|
| `/market-overview` | GET | Índices e macro |
| `/quote?symbols=X,Y` | GET | Cotações de ativos |
| `/historical?symbol=X&range=1mo` | GET | Dados históricos |
| `/status` | GET | Status do mercado |

### Lógica SWR

```typescript
async function getWithSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<{ data: T; cached: boolean; cacheAge?: number }> {
  
  // 1. Tenta buscar do cache
  const cached = await redis.get(key);
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    // 2. Se ainda válido, retorna
    if (age < ttl * 1000) {
      return { data, cached: true, cacheAge: Math.floor(age / 1000) };
    }
    
    // 3. Se expirado, revalida em background
    fetcher().then(fresh => {
      redis.set(key, JSON.stringify({
        data: fresh,
        timestamp: Date.now()
      }), { ex: ttl * 2 });
    });
    
    // 4. Retorna stale imediatamente
    return { data, cached: true, cacheAge: Math.floor(age / 1000) };
  }
  
  // 5. Cache miss: busca e armazena
  const data = await fetcher();
  await redis.set(key, JSON.stringify({
    data,
    timestamp: Date.now()
  }), { ex: ttl * 2 });
  
  return { data, cached: false };
}
```

## Hooks React Query

### useMarketOverview

```typescript
export function useMarketOverview() {
  const { shouldPoll } = useMarketStatus();

  return useQuery<MarketOverview>({
    queryKey: ['market-overview'],
    queryFn: getMarketOverview,
    staleTime: 5 * 60 * 1000,           // 5 minutos
    refetchInterval: shouldPoll ? 5 * 60 * 1000 : false,
    placeholderData: keepPreviousData,
    retry: 2,
  });
}
```

### useMarketStatus

Hook que determina se o mercado está aberto:

```typescript
export function useMarketStatus() {
  const [status, setStatus] = useState<MarketStatusInfo>({
    isOpen: false,
    shouldPoll: false,
    phase: 'closed'
  });

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hour = now.getUTCHours() - 3; // BRT = UTC-3
      const day = now.getDay();
      const date = now.toISOString().split('T')[0];

      // Fim de semana
      if (day === 0 || day === 6) {
        return { isOpen: false, shouldPoll: false, phase: 'closed' };
      }

      // Feriado
      if (B3_HOLIDAYS_2026.includes(date)) {
        return { isOpen: false, shouldPoll: false, phase: 'closed', isHoliday: true };
      }

      // Horário de pregão
      if (hour >= 10 && hour < 17) {
        return { isOpen: true, shouldPoll: true, phase: 'open' };
      }

      return { isOpen: false, shouldPoll: false, phase: 'after-hours' };
    };

    setStatus(check());
    const interval = setInterval(() => setStatus(check()), 60000);
    return () => clearInterval(interval);
  }, []);

  return status;
}
```

## Otimizações

### Frontend

1. **React Query caching**: Evita re-fetches desnecessários
2. **keepPreviousData**: Evita loading states em transições
3. **Conditional polling**: Só busca dados quando mercado aberto
4. **Code splitting**: Lazy loading de páginas

### Backend

1. **SWR cache**: Latência reduzida, resiliência a falhas
2. **Parallel fetching**: BRAPI e HG Brasil em paralelo
3. **TTL otimizado**: Dados macro com TTL maior
4. **Early return**: Retorna cache stale enquanto revalida

### Rede

1. **Edge deployment**: Edge Function próxima ao usuário
2. **Compression**: Gzip em respostas JSON
3. **Cache headers**: Cache-Control para assets estáticos

---

**Anterior**: [Dados](./04-dados.md) | **Próximo**: [API](./06-api.md)
