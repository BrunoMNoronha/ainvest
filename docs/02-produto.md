# Produto e Funcionalidades

## Visão Geral do Dashboard

O AInvest apresenta uma interface unificada com quatro áreas principais:

```
┌─────────────────────────────────────────────────────────────┐
│                      HEADER                                  │
│  Logo │ Navegação │ Status Mercado │ Última Atualização     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   IBOVESPA   │  │    IFIX      │  │   USD/BRL    │       │
│  │   Variação   │  │   Variação   │  │   Cotação    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│  ┌─────────────────────────────────┐  ┌──────────────────┐  │
│  │                                 │  │    WATCHLIST     │  │
│  │       GRÁFICO DE PREÇOS         │  │                  │  │
│  │       (Candlestick)             │  │  PETR4  ▲ 2.3%   │  │
│  │                                 │  │  VALE3  ▼ 1.1%   │  │
│  │                                 │  │  ITUB4  ▲ 0.8%   │  │
│  └─────────────────────────────────┘  └──────────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              INDICADORES TÉCNICOS                        ││
│  │  RSI: 45 │ ADX: 28 │ EMA8: Acima │ Volume: Normal       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ⚠️ DISCLAIMER: Dados com atraso de 15 minutos...          │
└─────────────────────────────────────────────────────────────┘
```

## Componentes Principais

### 1. Market Overview

Painel de visão geral com os principais índices e indicadores macro.

| Elemento | Fonte | Atualização |
|----------|-------|-------------|
| IBOVESPA | BRAPI | 5 minutos |
| IFIX | BRAPI | 5 minutos |
| S&P 500 (IVVB11) | BRAPI | 5 minutos |
| USD/BRL | HG Brasil | 5 minutos |
| SELIC | HG Brasil | Diária |
| CDI | HG Brasil | Diária |

### 2. Price Chart

Gráfico de candlestick com suporte a múltiplos períodos:

- **1D**: Intraday (candles de 15min)
- **1S**: Semanal (candles diários)
- **1M/3M/6M**: Mensal (candles diários)
- **1A/2A/5A**: Anual (candles semanais)

**Funcionalidades**:
- Zoom e pan
- Crosshair com valores
- Volume no eixo secundário
- Indicadores sobrepostos (futuro)

### 3. Watchlist

Lista personalizada de ativos com acompanhamento em tempo real.

**Dados exibidos**:
- Símbolo e nome
- Preço atual
- Variação (% e absoluta)
- Sinal atual (compra/venda/neutro)

**Limites**:
- Máximo 20 ativos por watchlist
- Ativos devem ser válidos na B3

### 4. Technical Indicators

Painel de indicadores técnicos calculados em tempo real:

| Indicador | Descrição | Interpretação |
|-----------|-----------|---------------|
| RSI (14) | Índice de Força Relativa | < 30 sobrevendido, > 70 sobrecomprado |
| ADX (14) | Força da tendência | > 25 tendência forte |
| EMA 8 | Média móvel curta | Cruzamento de preço |
| EMA 80 | Média móvel longa | Direção da tendência |

### 5. Signal Cards

Cards de sinais de trading baseados na análise SMC.

**Estrutura do sinal**:
```
┌─────────────────────────────┐
│ 🟢 COMPRA  │  PETR4         │
│ Score: 7/9                  │
│ Entrada: R$ 38.50           │
│ Stop: R$ 37.20 (-3.4%)      │
│ Alvo: R$ 41.00 (+6.5%)      │
│ R:R = 1:1.9                 │
│ Gatilho: BoS + Order Block  │
└─────────────────────────────┘
```

### 6. Alerts

Sistema de alertas configuráveis:

- **Preço**: Ativo atingiu valor X
- **Variação**: Ativo variou X% no dia
- **Sinal**: Novo sinal gerado
- **Volume**: Volume anormal detectado

**Canais de notificação**:
- In-app (toast)
- Email (futuro)
- Push (futuro)

## Roadmap de Funcionalidades

### MVP (Atual)

- [x] Dashboard com Market Overview
- [x] Gráfico de preços com histórico
- [x] Watchlist básica
- [x] Indicadores técnicos
- [x] Status do mercado (aberto/fechado)
- [x] Disclaimer legal

### Versão 1.1

- [ ] Sistema de sinais SMC
- [ ] Alertas de preço
- [ ] Múltiplas watchlists
- [ ] Temas claro/escuro
- [ ] Exportar dados (CSV)

### Versão 1.2

- [ ] Autenticação de usuários
- [ ] Persistência de preferências
- [ ] Histórico de sinais
- [ ] Performance de sinais

### Versão 2.0

- [ ] Motor de análise SMC automatizado
- [ ] Screener de ativos
- [ ] Backtesting
- [ ] Integração com corretoras

---

**Anterior**: [Visão](./01-visao.md) | **Próximo**: [Estratégias](./03-estrategias.md)
