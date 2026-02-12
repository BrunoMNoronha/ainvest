# ADR-002: BRAPI + HG Brasil como Provedores de Dados

**Data**: 2026-02-03  
**Status**: Aceita

## Contexto

O AInvest necessita de dados de mercado brasileiros em tempo real (com delay regulatório de 15 minutos):

**Dados necessários**:
- Cotações de ações, ETFs e FIIs da B3
- Índices (IBOVESPA, IFIX)
- Câmbio USD/BRL
- Taxas SELIC e CDI
- Dados históricos OHLCV

**Requisitos**:
- API REST (compatível com Edge Functions)
- Suporte a múltiplos símbolos por request
- Dados históricos de pelo menos 5 anos
- Custo acessível para MVP

## Decisão

> **Decidimos** usar BRAPI.dev para dados da B3 (ações, ETFs, FIIs, índices) e HG Brasil para dados macroeconômicos (câmbio, SELIC, CDI) **porque** juntas oferecem cobertura completa das nossas necessidades com custo acessível e boa documentação.

### Mapeamento de Dados

| Dado | Provedor | Endpoint |
|------|----------|----------|
| IBOVESPA | BRAPI | `/api/quote/^BVSP` |
| IFIX | BRAPI | `/api/quote/IFIX.SA` |
| Ações/ETFs | BRAPI | `/api/quote/{symbols}` |
| Histórico | BRAPI | `/api/quote/{symbol}?range=Xmo` |
| USD/BRL | HG Brasil | `/finance` → currencies.USD |
| SELIC | HG Brasil | `/finance` → taxes[SELIC] |
| CDI | HG Brasil | `/finance` → taxes[CDI] |

### IVVB11 como Proxy S&P 500

Como BRAPI não oferece dados de índices americanos, usamos IVVB11 (ETF que replica S&P 500) como proxy:

```typescript
// Correlação IVVB11 vs S&P 500: > 0.95
const sp500Proxy = await fetchQuote('IVVB11');
```

**Limitações aceitas**:
- Spread do ETF (~0.5%)
- Taxa de administração (0.23% a.a.)
- Liquidez menor que futuros

## Consequências

### Positivas

- **Cobertura completa**: 100% dos dados necessários cobertos
- **API REST simples**: Compatível com Edge Functions
- **Custo inicial zero**: Ambos têm tier gratuito suficiente para MVP
- **Boa documentação**: Ambos bem documentados em português
- **Confiabilidade**: Provedores estabelecidos no mercado brasileiro

### Negativas

- **Dois pontos de falha**: Se um cair, parte da funcionalidade é afetada
- **Duas chaves API**: Complexidade adicional de gerenciamento
- **Rate limits separados**: Necessidade de controlar ambos
- **Delay 15 min**: Regulatório, não há alternativa sem licença B3

### Neutras

- BRAPI tem planos pagos acessíveis se necessário escalar
- HG Brasil oferece mais dados macro que podemos usar no futuro

## Alternativas Consideradas

### Alternativa 1: Alpha Vantage

**Descrição**: API global de dados financeiros.

**Prós**:
- Um único provedor
- Cobertura global
- Bem documentada

**Contras**:
- Dados B3 limitados
- Cotação em USD (requer conversão)
- Rate limits mais restritivos no tier gratuito

**Por que foi descartada**: Foco em mercados internacionais, cobertura B3 insuficiente.

### Alternativa 2: Yahoo Finance (via scraping)

**Descrição**: Extrair dados do Yahoo Finance.

**Prós**:
- Gratuito
- Cobertura ampla

**Contras**:
- ToS proíbe scraping
- Instável, estrutura muda frequentemente
- Sem SLA

**Por que foi descartada**: Violação de termos de uso, instabilidade.

### Alternativa 3: B3 Data (direto)

**Descrição**: Licenciar dados diretamente da B3.

**Prós**:
- Dados oficiais
- Real-time disponível
- Suporte institucional

**Contras**:
- Custo proibitivo para MVP (R$ 5.000+/mês)
- Processo burocrático de licenciamento
- Overkill para fase inicial

**Por que foi descartada**: Custo incompatível com fase MVP.

### Alternativa 4: InfoMoney/Trademap APIs

**Descrição**: Usar APIs de plataformas brasileiras estabelecidas.

**Prós**:
- Dados B3 completos
- Marca conhecida

**Contras**:
- APIs não documentadas publicamente
- Sem tier gratuito claro
- Dependência de acordos comerciais

**Por que foi descartada**: Falta de API pública e documentação.

## Implementação

### Passos

1. ✅ Criar contas em BRAPI e HG Brasil
2. ✅ Obter API keys
3. ✅ Configurar secrets no Supabase
4. ✅ Implementar fetchers na Edge Function
5. ✅ Configurar fallbacks para erros

### Configuração de Fallback

```typescript
async function fetchWithFallback<T>(
  primary: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    console.error('Primary fetch failed, using fallback:', error);
    return fallback;
  }
}
```

## Métricas de Sucesso

| Métrica | Alvo | Atual |
|---------|------|-------|
| Disponibilidade BRAPI | > 99% | Monitorando |
| Disponibilidade HG | > 99% | Monitorando |
| Erros de API/dia | < 10 | Monitorando |

## Referências

- [BRAPI Documentation](https://brapi.dev/docs)
- [HG Brasil Documentation](https://hgbrasil.com/status/finance)
- [B3 Market Data](https://www.b3.com.br/pt_br/market-data-e-indices/)

---

## Histórico

| Data | Autor | Mudança |
|------|-------|---------|
| 2026-02-03 | AInvest Team | Criação inicial |
