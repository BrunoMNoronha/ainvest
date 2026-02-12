# ADR-001: Cache SWR com Upstash Redis

**Data**: 2026-02-03  
**Status**: Aceita

## Contexto

As APIs de dados de mercado (BRAPI e HG Brasil) possuem limitações rigorosas de rate limit:
- BRAPI Free: 30 req/min, 500 req/dia
- HG Brasil Free: 1000 req/dia

O AInvest precisa servir múltiplos usuários simultaneamente, cada um visualizando:
- Market Overview (atualizado a cada 5 minutos)
- Cotações de watchlist (5-20 ativos)
- Gráficos históricos

Sem cache, rapidamente excederíamos os limites, resultando em:
- Erros 429 (Too Many Requests)
- Degradação da experiência do usuário
- Custos adicionais com planos pagos

## Decisão

> **Decidimos** implementar cache Stale-While-Revalidate (SWR) usando Upstash Redis **porque** oferece latência mínima, persistência entre requests, e modelo de precificação por request que se alinha com nosso padrão de uso.

### Implementação

```typescript
async function getWithSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<{ data: T; cached: boolean }> {
  const cached = await redis.get(key);
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age < ttl * 1000) {
      return { data, cached: true };
    }
    
    // Revalida em background, retorna stale imediatamente
    fetcher().then(fresh => redis.set(key, JSON.stringify({
      data: fresh,
      timestamp: Date.now()
    }), { ex: ttl * 2 }));
    
    return { data, cached: true };
  }
  
  const data = await fetcher();
  await redis.set(key, JSON.stringify({ data, timestamp: Date.now() }), { ex: ttl * 2 });
  return { data, cached: false };
}
```

### TTLs Definidos

| Tipo de Dado | TTL (stale) | TTL (max) |
|--------------|-------------|-----------|
| Cotações | 5 min | 10 min |
| Histórico | 1 hora | 2 horas |
| Macro (SELIC/CDI) | 30 min | 1 hora |
| Status do mercado | 1 min | 2 min |

## Consequências

### Positivas

- **Latência reduzida**: Maioria dos requests servidos em < 50ms (vs ~500ms da API)
- **Resiliência**: Se BRAPI/HG ficarem indisponíveis, dados stale ainda são servidos
- **Economia**: Redução de 80%+ nos requests para APIs externas
- **Escalabilidade**: Upstash escala automaticamente com a demanda
- **Simplicidade**: API REST simples, sem necessidade de conexão persistente

### Negativas

- **Custo adicional**: ~$0.20/100k requests (mínimo, dentro do free tier para MVP)
- **Complexidade**: Lógica adicional para gerenciar cache
- **Dados potencialmente stale**: Em cenários de alta volatilidade, dados podem estar 5+ minutos atrasados

### Neutras

- Dados já possuem 15 minutos de atraso (requisito regulatório B3), então 5 minutos adicionais de cache são aceitáveis

## Alternativas Consideradas

### Alternativa 1: Cache em Memória (Map/LRU)

**Descrição**: Usar estrutura de dados em memória na Edge Function.

**Prós**:
- Sem custo adicional
- Latência ainda menor

**Contras**:
- Volátil: perdido a cada cold start
- Não compartilhado entre instâncias
- Limites de memória da Edge Function

**Por que foi descartada**: Edge Functions são efêmeras e distribuídas. Cache em memória seria reinicializado frequentemente, gerando muitos cache misses.

### Alternativa 2: Supabase (PostgreSQL)

**Descrição**: Usar tabela no PostgreSQL como cache.

**Prós**:
- Já incluído no Supabase
- Persistente
- Familiar para a equipe

**Contras**:
- Latência maior (~100-200ms por query)
- Overhead de conexão
- Não otimizado para cache key-value

**Por que foi descartada**: PostgreSQL é otimizado para queries relacionais, não para cache de alta velocidade.

### Alternativa 3: Cloudflare KV

**Descrição**: Usar Cloudflare Workers KV para cache distribuído.

**Prós**:
- Global edge distribution
- Eventually consistent, bom para cache

**Contras**:
- Não integrado com Supabase
- Requer migração para Cloudflare Workers
- Vendor lock-in diferente

**Por que foi descartada**: Requer mudança de infraestrutura significativa. Upstash é mais simples de integrar com Edge Functions do Supabase.

## Implementação

### Passos

1. ✅ Criar conta Upstash e provisionar Redis
2. ✅ Configurar secrets no Supabase
3. ✅ Implementar wrapper SWR na Edge Function
4. ✅ Adicionar headers X-Cache para debug
5. ⏳ Configurar monitoramento de hit rate

### Métricas de Sucesso

- Hit rate > 80% após 1 semana
- Latência P95 < 100ms
- Zero erros 429 das APIs externas

## Referências

- [Upstash Redis Documentation](https://upstash.com/docs/redis/overall/getstarted)
- [SWR Pattern Explanation](https://web.dev/stale-while-revalidate/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## Histórico

| Data | Autor | Mudança |
|------|-------|---------|
| 2026-02-03 | AInvest Team | Criação inicial |
