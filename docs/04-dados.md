# Fontes de Dados

## Visão Geral

O AInvest utiliza duas fontes principais de dados financeiros:

| Provedor | Tipo de Dados | Endpoints |
|----------|---------------|-----------|
| BRAPI.dev | Ações, ETFs, FIIs B3 | Cotações, histórico |
| HG Brasil | Câmbio, indicadores macro | USD/BRL, SELIC, CDI |

## BRAPI.dev

### Descrição

BRAPI é uma API brasileira focada em dados da B3, oferecendo:
- Cotações em tempo real (15 min delay)
- Dados históricos OHLCV
- Informações de ativos (nome, setor, etc.)

### Endpoints Utilizados

Credenciais em `.env`: `BRAPI_TOKEN`.

#### GET /api/quote/{symbol}

Retorna cotação atual de um ou mais ativos.

```bash
GET https://brapi.dev/api/quote/PETR4,VALE3?token={BRAPI_TOKEN}
```

**Resposta**:
```json
{
  "results": [
    {
      "symbol": "PETR4",
      "shortName": "PETROBRAS PN",
      "regularMarketPrice": 38.50,
      "regularMarketChange": 0.75,
      "regularMarketChangePercent": 1.98,
      "regularMarketVolume": 45000000,
      "regularMarketTime": "2026-02-03T17:00:00.000Z"
    }
  ]
}
```

#### GET /api/quote/{symbol}/history

Retorna dados históricos OHLCV.

```bash
GET https://brapi.dev/api/quote/PETR4?range=1mo&interval=1d&token={BRAPI_TOKEN}
```

**Parâmetros**:
- `range`: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max
- `interval`: 1d, 1wk, 1mo

### Rate Limits

| Plano | Requests/minuto | Requests/dia |
|-------|-----------------|--------------|
| Free | 30 | 500 |
| Basic | 60 | 2.000 |
| Pro | 120 | 10.000 |

### Ativos Suportados

- **Ações**: PETR4, VALE3, ITUB4, BBDC4, etc.
- **ETFs**: BOVA11, IVVB11, SMAL11, etc.
- **FIIs**: HGLG11, XPML11, KNRI11, etc.
- **BDRs**: AAPL34, MSFT34, GOOGL34, etc.

## HG Brasil

### Descrição

HG Brasil fornece dados macroeconômicos e de câmbio:
- Cotação USD/BRL, EUR/BRL, etc.
- Taxa SELIC e CDI
- Indicadores de inflação

### Endpoints Utilizados

Credenciais em `.env`: `HG_BRASIL_KEY`.

#### GET /finance

Retorna dados financeiros consolidados.

```bash
GET https://api.hgbrasil.com/finance?key={HG_BRASIL_KEY}
```

**Resposta**:
```json
{
  "results": {
    "currencies": {
      "USD": {
        "buy": 5.25,
        "sell": 5.26,
        "variation": 0.15
      }
    },
    "taxes": [
      {
        "name": "SELIC",
        "value": 12.75
      },
      {
        "name": "CDI",
        "value": 12.65
      }
    ]
  }
}
```

### Rate Limits

| Plano | Requests/dia |
|-------|--------------|
| Free | 1.000 |
| Pro | 50.000 |

## IVVB11 como Proxy S&P 500

### Por que não usar S&P 500 diretamente?

1. **BRAPI não oferece** dados de índices americanos
2. **Correlação alta** (> 0.95) entre IVVB11 e S&P 500
3. **Mesmo horário** de negociação (B3)
4. **Sem conversão** de moeda necessária

### Limitações

- IVVB11 tem spread e taxa de administração
- Pode haver desconto/prêmio vs. NAV
- Liquidez menor que S&P 500 futuro

## Atraso de 15 Minutos

### Implicações

Todos os dados de cotação têm atraso de 15 minutos, conforme regulação da B3 para dados não-profissionais.

**Impacto operacional**:
- Sinais são indicativos, não triggers automáticos
- Usuário deve confirmar preço atual antes de operar
- Day trading de curtíssimo prazo não é viável

### Disclaimer Obrigatório

```
⚠️ ATENÇÃO: Os dados exibidos possuem atraso de 15 minutos em relação 
ao pregão da B3. Não utilize estas informações como única fonte para 
tomada de decisões de investimento.
```

## Calendário B3 2026

### Feriados (mercado fechado)

| Data | Feriado |
|------|---------|
| 01/01 | Confraternização Universal |
| 16/02 | Carnaval |
| 17/02 | Carnaval |
| 03/04 | Sexta-feira Santa |
| 21/04 | Tiradentes |
| 01/05 | Dia do Trabalho |
| 04/06 | Corpus Christi |
| 07/09 | Independência |
| 12/10 | Nossa Senhora Aparecida |
| 02/11 | Finados |
| 15/11 | Proclamação da República |
| 20/11 | Consciência Negra |
| 24/12 | Véspera de Natal |
| 25/12 | Natal |
| 31/12 | Véspera de Ano Novo |

### Horários de Negociação

| Fase | Horário (BRT) |
|------|---------------|
| Pré-abertura | 09:45 - 10:00 |
| Negociação | 10:00 - 17:00 |
| After-market | 17:25 - 17:45 |

### Implementação no Código

```typescript
const B3_HOLIDAYS_2026 = [
  '2026-01-01', '2026-02-16', '2026-02-17',
  '2026-04-03', '2026-04-21', '2026-05-01',
  '2026-06-04', '2026-09-07', '2026-10-12',
  '2026-11-02', '2026-11-15', '2026-11-20',
  '2026-12-24', '2026-12-25', '2026-12-31'
];
```

## Estratégia de Cache

### Stale-While-Revalidate (SWR)

O AInvest implementa cache SWR com Upstash Redis:

```
┌─────────────────────────────────────────────────────────┐
│                    Request Flow                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend  ──▶  Edge Function  ──▶  Upstash Redis       │
│                      │                    │              │
│                      │         ┌──────────┘              │
│                      │         │                         │
│                      │    Cache HIT?                     │
│                      │         │                         │
│                      │    ┌────┴────┐                    │
│                      │   Yes        No                   │
│                      │    │          │                   │
│                      │    │     Fetch BRAPI/HG          │
│                      │    │          │                   │
│                      │    │     Store in cache          │
│                      │    │          │                   │
│                      ◀────┴──────────┘                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### TTL por Tipo de Dado

| Dado | TTL | Justificativa |
|------|-----|---------------|
| Cotação | 5 min | Dado semi-real-time |
| Histórico | 1 hora | Raramente muda |
| Macro | 30 min | SELIC/CDI são diários |
| Status | 1 min | Horário de mercado |

---

**Anterior**: [Estratégias](./03-estrategias.md) | **Próximo**: [Arquitetura](./05-arquitetura.md)
