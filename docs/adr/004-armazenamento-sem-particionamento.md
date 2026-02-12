# ADR-004: Armazenamento Sem Particionamento Inicial

**Data**: 2026-02-03  
**Status**: Aceito  
**Autores**: Equipe AInvest

---

## Contexto

O sistema precisa persistir dados de cotações históricas (candles diários) para análise técnica. A decisão inicial previa particionamento mensal das tabelas, mas uma análise mais detalhada revelou que:

1. **Volume esperado é baixo**: ~50 ativos × 252 dias úteis = ~12.600 candles/ano
2. **Limites da API externa**: BRAPI Free tem rate limits que restringem coleta frequente
3. **Complexidade operacional**: Particionamento adiciona overhead de manutenção
4. **Custo de migração futura**: Migrar de tabela única para particionada é factível

---

## Decisão

Implementar tabela `market_candles_daily` **sem particionamento**, com:

- Chave primária composta `(symbol, date)`
- Índice B-Tree em `(symbol, date DESC)` para queries de análise
- Índice BRIN em `date` para range scans eficientes
- Frequência de coleta via pg_cron: **30 minutos**

### Critérios para Migrar para Particionamento

Migrar **somente se** pelo menos um critério for atendido:

1. Tabela ultrapassar **10-20 milhões de linhas**
2. Ingestão intraday contínua (1m ou 5m)
3. Necessidade de arquivar/apagar períodos inteiros
4. Latência crescente mesmo com índices

### Estratégia de Migração Futura

| Tipo de Dado | Estratégia |
|--------------|------------|
| Candles diários | Particionamento anual |
| Intraday | Particionamento mensal |

---

## Consequências

### Positivas

- **Simplicidade operacional**: Menos complexidade em produção
- **Menor custo inicial**: Sem overhead de criar/gerenciar partições
- **Caminho claro de evolução**: Critérios documentados para escalar
- **Compatível com plano gratuito**: Respeita limites da BRAPI

### Negativas

- **Migração futura necessária**: Se volume crescer significativamente
- **Sem arquivamento granular**: Não é possível "dropar" um mês inteiro

---

## Alternativas Consideradas

### 1. Particionamento Mensal Imediato

- **Prós**: Preparado para escala desde o início
- **Contras**: Complexidade desnecessária para volume atual
- **Decisão**: Rejeitado por violar princípio YAGNI

### 2. TimescaleDB

- **Prós**: Otimizado para time-series
- **Contras**: Dependência adicional, não disponível no Supabase
- **Decisão**: Rejeitado por complexidade de infraestrutura

### 3. Cache-only (sem persistência)

- **Prós**: Zero complexidade de armazenamento
- **Contras**: Perda de histórico, dependência total da API externa
- **Decisão**: Rejeitado por não atender requisitos analíticos

---

## Referências

- [.lovable/plan.md](/.lovable/plan.md) - Instruções operacionais consolidadas
- [ADR-001: Cache SWR com Upstash](./001-cache-swr-upstash.md)
- [PostgreSQL Partitioning Best Practices](https://www.postgresql.org/docs/current/ddl-partitioning.html)
