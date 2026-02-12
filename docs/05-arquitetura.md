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

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Pages      │  │  Components  │  │    Hooks     │          │
│  │              │  │              │  │              │          │
│  │  - Index     │  │  - Market    │  │  - useMarket │          │
│  │  - Signals   │  │    Overview  │  │    Overview  │          │
│  │  - Analysis  │  │  - PriceChart│  │  - useQuotes │          │
│  │  - Alerts    │  │  - WatchList │  │  - useHistor │          │
│  │              │  │  - SignalCard│  │    ical      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│                    ┌──────▼───────┐                             │
│                    │   Services   │                             │
│                    │              │                             │
│                    │  marketApi   │                             │
│                    └──────┬───────┘                             │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                      EDGE FUNCTION                                 │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                    market-data                              │   │
│  │                                                             │   │
│  │   ┌─────────────┐    ┌─────────────┐    ┌──────────────┐  │   │
│  │   │   Router    │───▶│    Cache    │───▶│   Fetchers   │  │   │
│  │   │             │    │   (Upstash) │    │              │  │   │
│  │   │ /overview   │    │             │    │  - BRAPI     │  │   │
│  │   │ /quote      │    │  SWR Logic  │    │  - HG Brasil │  │   │
│  │   │ /historical │    │             │    │              │  │   │
│  │   │ /status     │    │             │    │              │  │   │
│  │   └─────────────┘    └─────────────┘    └──────────────┘  │   │
│  │                                                             │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                     EXTERNAL APIs                                  │
│                                                                    │
│  ┌──────────────────────┐    ┌──────────────────────┐            │
│  │      BRAPI.dev       │    │     HG Brasil        │            │
│  │                      │    │                      │            │
│  │  - Cotações B3       │    │  - USD/BRL           │            │
│  │  - Histórico OHLCV   │    │  - SELIC/CDI         │            │
│  │  - Info de ativos    │    │  - Indicadores macro │            │
│  │                      │    │                      │            │
│  └──────────────────────┘    └──────────────────────┘            │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

## Fluxo de Dados

### Request de Cotação

```
1. Usuário abre Dashboard
      │
      ▼
2. useMarketOverview() é chamado
      │
      ▼
3. React Query verifica cache local
      │
      ├──▶ Cache FRESH: retorna dados
      │
      └──▶ Cache STALE ou MISS:
            │
            ▼
4. marketApi.getMarketOverview()
      │
      ▼
5. supabase.functions.invoke('market-data/market-overview')
      │
      ▼
6. Edge Function verifica Upstash Redis
      │
      ├──▶ Cache HIT (fresh): retorna com X-Cache: HIT
      │
      └──▶ Cache MISS ou STALE:
            │
            ▼
7. Fetch paralelo: BRAPI + HG Brasil
      │
      ▼
8. Processa e combina dados
      │
      ▼
9. Armazena no Upstash com TTL
      │
      ▼
10. Retorna para frontend com X-Cache: MISS
      │
      ▼
11. React Query armazena em cache local
      │
      ▼
12. Componente renderiza dados
```

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
