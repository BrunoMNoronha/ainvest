# Documentação da API

## Visão Geral

A API do AInvest é exposta através de uma Edge Function que atua como proxy para as fontes de dados externas, adicionando cache e normalização.

**Base URL**: `https://{project-id}.supabase.co/functions/v1/market-data`

**Especificação OpenAPI**: [/openapi/v1.yaml](/openapi/v1.yaml)

## Autenticação

Atualmente a API não requer autenticação. Requisições são validadas por CORS (apenas domínios autorizados).

> **Nota**: Autenticação será adicionada em versão futura para suportar funcionalidades personalizadas.

## Endpoints

### GET /market-overview

Retorna visão geral do mercado com principais índices e indicadores macro.

#### Parâmetros

Nenhum.

#### Resposta

```json
{
  "ibov": {
    "name": "IBOVESPA",
    "value": 128500.00,
    "change": 1250.00,
    "changePercent": 0.98,
    "updatedAt": "2026-02-03T17:00:00Z"
  },
  "ifix": {
    "name": "IFIX",
    "value": 3150.00,
    "change": -15.00,
    "changePercent": -0.47,
    "updatedAt": "2026-02-03T17:00:00Z"
  },
  "sp500Proxy": {
    "name": "IVVB11",
    "value": 285.50,
    "change": 3.20,
    "changePercent": 1.13,
    "updatedAt": "2026-02-03T17:00:00Z"
  },
  "usdBrl": {
    "buy": 5.25,
    "sell": 5.26,
    "change": 0.15,
    "updatedAt": "2026-02-03T17:00:00Z"
  },
  "selic": 12.75,
  "cdi": 12.65,
  "updatedAt": "2026-02-03T17:00:00Z",
  "marketStatus": {
    "isOpen": true,
    "phase": "open",
    "isHoliday": false
  },
  "cached": true,
  "cacheAge": 120
}
```

#### Campos de Cache

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `cached` | boolean | Se dados vieram do cache |
| `cacheAge` | number | Idade do cache em segundos |

---

### GET /quote

Retorna cotações para um ou mais símbolos.

#### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `symbols` | string | Sim | Lista de símbolos separados por vírgula |

#### Exemplo

```
GET /quote?symbols=PETR4,VALE3,ITUB4
```

#### Resposta

```json
{
  "data": [
    {
      "symbol": "PETR4",
      "name": "PETROBRAS PN",
      "price": 38.50,
      "change": 0.75,
      "changePercent": 1.98,
      "volume": 45000000,
      "updatedAt": "2026-02-03T17:00:00Z"
    },
    {
      "symbol": "VALE3",
      "name": "VALE ON",
      "price": 68.20,
      "change": -0.80,
      "changePercent": -1.16,
      "volume": 32000000,
      "updatedAt": "2026-02-03T17:00:00Z"
    }
  ],
  "cached": false
}
```

---

### GET /historical

Retorna dados históricos OHLCV para um símbolo.

#### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `symbol` | string | Sim | Símbolo do ativo |
| `range` | string | Não | Período (padrão: 1mo) |

#### Valores de Range

| Range | Descrição | Intervalo |
|-------|-----------|-----------|
| `1d` | 1 dia | 15 minutos |
| `5d` | 5 dias | 15 minutos |
| `1mo` | 1 mês | 1 dia |
| `3mo` | 3 meses | 1 dia |
| `6mo` | 6 meses | 1 dia |
| `1y` | 1 ano | 1 dia |
| `2y` | 2 anos | 1 semana |
| `5y` | 5 anos | 1 semana |

#### Exemplo

```
GET /historical?symbol=PETR4&range=3mo
```

#### Resposta

```json
{
  "data": [
    {
      "date": "2025-11-03",
      "open": 35.20,
      "high": 35.80,
      "low": 34.90,
      "close": 35.50,
      "volume": 42000000
    },
    {
      "date": "2025-11-04",
      "open": 35.50,
      "high": 36.10,
      "low": 35.30,
      "close": 36.00,
      "volume": 38000000
    }
  ],
  "cached": true,
  "cacheAge": 1800
}
```

---

### GET /status

Retorna status atual do mercado.

#### Parâmetros

Nenhum.

#### Resposta

```json
{
  "isOpen": true,
  "phase": "open",
  "nextOpen": null,
  "isHoliday": false,
  "holidayName": null
}
```

#### Valores de Phase

| Phase | Descrição |
|-------|-----------|
| `pre-market` | Pré-abertura (09:45-10:00) |
| `open` | Pregão normal (10:00-17:00) |
| `after-hours` | After-market (17:25-17:45) |
| `closed` | Mercado fechado |

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 400 | Parâmetros inválidos |
| 404 | Símbolo não encontrado |
| 429 | Rate limit excedido |
| 500 | Erro interno do servidor |
| 502 | Erro na API externa |
| 503 | Serviço indisponível |

### Formato de Erro

```json
{
  "error": {
    "code": "INVALID_SYMBOL",
    "message": "Symbol 'XYZ123' not found in B3",
    "details": {
      "symbol": "XYZ123"
    }
  }
}
```

---

## Headers de Cache

### Request Headers

| Header | Descrição |
|--------|-----------|
| `Cache-Control: no-cache` | Força revalidação do cache |

### Response Headers

| Header | Valores | Descrição |
|--------|---------|-----------|
| `X-Cache` | HIT, MISS | Status do cache |
| `X-Cache-Age` | número | Idade do cache em segundos |
| `Cache-Control` | max-age=300 | TTL para cache do cliente |

---

## Exemplos de Uso

### JavaScript/TypeScript

```typescript
import { supabase } from "@/integrations/supabase/client";

// Usando o client Supabase
const { data, error } = await supabase.functions.invoke(
  'market-data/quote',
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }
);

// Query params devem ir na URL
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/market-data/quote?symbols=PETR4,VALE3`,
  {
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  }
);
```

### cURL

```bash
# Market Overview
curl -X GET \
  'https://iycqotgkopbyxpfdojal.supabase.co/functions/v1/market-data/market-overview' \
  -H 'Authorization: Bearer eyJhbG...'

# Cotações
curl -X GET \
  'https://iycqotgkopbyxpfdojal.supabase.co/functions/v1/market-data/quote?symbols=PETR4,VALE3' \
  -H 'Authorization: Bearer eyJhbG...'

# Histórico
curl -X GET \
  'https://iycqotgkopbyxpfdojal.supabase.co/functions/v1/market-data/historical?symbol=PETR4&range=1mo' \
  -H 'Authorization: Bearer eyJhbG...'
```

---

## Rate Limiting

A API implementa rate limiting por IP:

| Limite | Valor |
|--------|-------|
| Requests/minuto | 60 |
| Requests/hora | 1000 |

Ao exceder o limite, a API retorna:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please retry after 60 seconds.",
    "retryAfter": 60
  }
}
```

---

**Anterior**: [Arquitetura](./05-arquitetura.md) | **Próximo**: [Segurança](./07-seguranca.md)
