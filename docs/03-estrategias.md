# Metodologia de Trading

## Introdução

O AInvest utiliza **Smart Money Concepts (SMC)**, uma metodologia de análise técnica que busca identificar a ação dos grandes players institucionais ("smart money") no mercado.

> **Filosofia**: O mercado é movido por grandes instituições. Identificar seus rastros aumenta a probabilidade de trades bem-sucedidos.

## Smart Money Concepts (SMC)

### Estrutura de Mercado

O mercado se move em **tendências** compostas por impulsos e correções:

```
      Tendência de Alta (Bullish)
      
         HH ←── Higher High
        /  \
       /    \
      HL     \    HH
     /        \  /  \
    /          \/    \
   LH          HL     \
  /                    \
 /                      \
LL                       HL
```

**Conceitos-chave**:
- **HH (Higher High)**: Topo mais alto que o anterior
- **HL (Higher Low)**: Fundo mais alto que o anterior
- **LH (Lower High)**: Topo mais baixo que o anterior
- **LL (Lower Low)**: Fundo mais baixo que o anterior

### Break of Structure (BoS)

O BoS confirma a **continuação** da tendência atual.

```
Bullish BoS:

    BoS ←── Preço rompe o último HH
     │
   ──┼──────
     │    /\
     │   /  \
     │  /    \
     │ /      \
     │/        \
    HH          \
   /             HL
  /
 HL

```

**Regras de identificação**:
1. Identificar a tendência atual (HH/HL ou LH/LL)
2. Aguardar rompimento do último pivot relevante
3. BoS bullish: rompimento de HH
4. BoS bearish: rompimento de LL

### Change of Character (ChoCh)

O ChoCh indica uma **potencial reversão** de tendência.

```
ChoCh Bullish (após tendência de baixa):

                    ChoCh
                      │
      LH              │
     /  \             │
    /    \         ───┼──────
   /      \       /   │
  /        \     /    │
 LL         \   /     │
             \ /      │
              LL      │
              (falha em fazer novo LL)
```

**Critérios para validação**:
1. Tendência estabelecida (mínimo 3 pivots)
2. Falha em criar novo pivot na direção da tendência
3. Rompimento do último pivot contrário
4. Confirmação com volume acima da média

### Order Blocks (OB)

Order Blocks são zonas onde instituições acumularam posições.

```
Bullish Order Block:

          │
          │   Movimento de alta
          │        │
      ────┴────────┴────
     ┌─────────────────┐
     │  ORDER BLOCK    │ ←── Última vela de baixa
     │  (zona de       │     antes do impulso
     │   demanda)      │
     └─────────────────┘
```

**Identificação**:
1. Localizar impulso forte (3+ candles na mesma direção)
2. O OB é a última vela contrária antes do impulso
3. Zona válida: abertura até fechamento da vela
4. Invalidação: preço fecha além do OB

### Fair Value Gap (FVG)

FVG representa desequilíbrio entre compradores e vendedores.

```
Bullish FVG:

    Vela 3  ─────┐
                 │
    ─────────────┼───── Gap (FVG)
                 │
    Vela 1  ─────┘

    (Mínima da vela 3 > máxima da vela 1)
```

**Uso no trading**:
- FVGs tendem a ser "preenchidos" (revisitados)
- Servem como zonas de suporte/resistência
- Confluência com OB aumenta probabilidade

## Metodologia Wyckoff

O AInvest complementa SMC com conceitos de Wyckoff:

### Fases do Mercado

| Fase | Descrição | Ação |
|------|-----------|------|
| Acumulação | Smart money comprando | Preparar compra |
| Markup | Tendência de alta | Segurar posição |
| Distribuição | Smart money vendendo | Preparar venda |
| Markdown | Tendência de baixa | Fora do mercado |

### Spring e Upthrust

- **Spring**: Falso rompimento de suporte (bullish)
- **Upthrust**: Falso rompimento de resistência (bearish)

## Sistema de Pontuação (0-9)

Cada sinal recebe uma pontuação baseada em critérios objetivos:

| Critério | Pontos | Descrição |
|----------|--------|-----------|
| Estrutura | 0-2 | BoS ou ChoCh identificado |
| Order Block | 0-2 | Preço em zona de OB válido |
| FVG | 0-1 | Confluência com gap |
| Volume | 0-1 | Volume acima da média |
| Tendência HTF | 0-1 | Alinhamento com timeframe maior |
| Risk/Reward | 0-1 | R:R mínimo de 1:1.5 |
| ADX | 0-1 | Tendência forte (> 25) |

### Interpretação

| Score | Classificação | Ação Recomendada |
|-------|---------------|------------------|
| 0-3 | Fraco | Não operar |
| 4-5 | Moderado | Aguardar confirmação |
| 6-7 | Forte | Entrada com posição reduzida |
| 8-9 | Muito Forte | Entrada com posição completa |

## Regras de Entrada e Saída

### Entrada

1. **Identificar tendência** no timeframe operacional
2. **Aguardar pullback** até zona de interesse (OB/FVG)
3. **Confirmar com estrutura** (BoS no timeframe menor)
4. **Verificar score** (mínimo 6 para entrada)
5. **Posicionar ordem** no limite da zona

### Stop Loss

- **Posição**: Além do Order Block ou pivot estrutural
- **Máximo**: 3% do capital por trade
- **Ajuste**: Trailing stop após 1R de lucro

### Take Profit

- **TP1** (parcial): Próximo pivot estrutural (50% da posição)
- **TP2** (final): Extensão de Fibonacci 1.618 ou próxima zona de OB

## Gerenciamento de Risco

### Risk/Reward (R:R)

| R:R | Taxa de Acerto Mínima | Expectativa |
|-----|----------------------|-------------|
| 1:1 | 50% | Breakeven |
| 1:1.5 | 40% | Positiva |
| 1:2 | 33% | Positiva |
| 1:3 | 25% | Muito positiva |

### Sizing de Posição

```
Tamanho = (Capital × Risco%) / (Entrada - Stop)

Exemplo:
- Capital: R$ 100.000
- Risco: 1% = R$ 1.000
- Entrada: R$ 40.00
- Stop: R$ 38.50
- Diferença: R$ 1.50

Tamanho = R$ 1.000 / R$ 1.50 = 666 ações
```

### Regras de Ouro

1. **Nunca arriscar mais de 2%** do capital por trade
2. **Máximo 3 posições** abertas simultaneamente
3. **Stop loss é inegociável** - sempre definido antes da entrada
4. **Não operar contra a tendência** do timeframe maior

---

**Anterior**: [Produto](./02-produto.md) | **Próximo**: [Dados](./04-dados.md)
