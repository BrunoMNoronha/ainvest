# Operação

## Visão Geral

Este documento descreve os procedimentos operacionais para manter o AInvest funcionando de forma confiável.

## Monitoramento

### Edge Functions

O monitoramento das Edge Functions é feito através do painel do Supabase:

**Métricas principais**:
- Invocações por minuto
- Latência P50/P95/P99
- Taxa de erros
- Uso de memória

**Alertas recomendados**:

| Métrica | Threshold | Ação |
|---------|-----------|------|
| Latência P95 | > 5s | Investigar cache/API |
| Taxa de erro | > 5% | Verificar APIs externas |
| Invocações | > 1000/min | Verificar possível DDoS |

### Upstash Redis

**Dashboard**: https://console.upstash.com

**Métricas**:
- Hit rate do cache
- Comandos por segundo
- Uso de memória
- Latência de comandos

### APIs Externas

| API | Health Check | Frequência |
|-----|--------------|------------|
| BRAPI | GET /api/available | 5 min |
| HG Brasil | GET /finance | 5 min |

## Logs

### Estrutura

```json
{
  "timestamp": "2026-02-03T14:30:00Z",
  "level": "info",
  "function": "market-data",
  "endpoint": "/market-overview",
  "duration_ms": 150,
  "cache_hit": true,
  "cache_age": 120
}
```

### Níveis

| Nível | Uso |
|-------|-----|
| `error` | Falhas que afetam usuários |
| `warn` | Degradação, cache miss frequente |
| `info` | Operação normal |
| `debug` | Detalhes para troubleshooting |

### Consulta

```bash
# Via Supabase CLI
supabase functions logs market-data --limit 100

# Filtrar por erro
supabase functions logs market-data | grep "error"
```

## Troubleshooting

### Problema: API retornando 502

**Sintomas**:
- Frontend mostra erro de carregamento
- Logs mostram "Failed to fetch from BRAPI/HG"

**Diagnóstico**:
1. Verificar status das APIs externas
2. Testar conectividade direta
3. Verificar se secrets estão configurados e sincronizados a partir do `.env`

**Resolução**:
```bash
# Testar BRAPI diretamente
curl "https://brapi.dev/api/quote/PETR4?token=$BRAPI_TOKEN"

# Testar HG Brasil
curl "https://api.hgbrasil.com/finance?key=$HG_BRASIL_KEY"
```

### Problema: Cache sempre MISS

**Sintomas**:
- Header X-Cache sempre "MISS"
- Latência alta consistente
- Rate limit sendo atingido

**Diagnóstico**:
1. Verificar conexão com Upstash
2. Validar credentials do Redis
3. Verificar TTL das chaves

**Resolução**:
```typescript
// Testar conexão Redis
const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_REST_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN')!,
});

await redis.ping(); // Deve retornar "PONG"
```

### Problema: Dados desatualizados

**Sintomas**:
- Cotações não atualizam durante pregão
- cacheAge muito alto

**Diagnóstico**:
1. Verificar se mercado está aberto
2. Validar lógica de polling no frontend
3. Verificar TTL do cache

**Resolução**:
```bash
# Forçar invalidação de cache
curl -X GET "https://.../market-data/market-overview" \
  -H "Cache-Control: no-cache"
```

## Procedimentos de Deploy

### Checklist Pré-Deploy

- [ ] Testes passando localmente
- [ ] Secrets configurados no ambiente alvo e sincronizados do `.env`
- [ ] Backup de configuração atual
- [ ] Janela de manutenção comunicada (se aplicável)

### Deploy do Frontend

1. Executar `npm run build`
2. Publicar o diretório `dist/` no provedor de hosting estático

### Deploy de Edge Function

1. Sincronizar secrets: `supabase secrets set --env-file .env`
2. Deploy: `supabase functions deploy market-data`
3. Verificar logs e health checks

### Rollback

```bash
# Via Supabase CLI
supabase functions deploy market-data --version previous
```

### Verificação Pós-Deploy

```bash
# Health check
curl "https://.../market-data/status"

# Teste funcional
curl "https://.../market-data/market-overview"
```

## Runbooks

### [RB-001] Reiniciar Cache

**Quando executar**: Cache corrompido ou inconsistente

**Passos**:
1. Acessar console Upstash
2. Executar `FLUSHDB`
3. Aguardar 5 minutos para repopulação
4. Verificar hit rate voltando ao normal

**Rollback**: N/A (cache é reconstruído automaticamente)

### [RB-002] Rotação de API Keys

**Quando executar**: Rotação periódica ou suspeita de vazamento

**Passos**:
1. Gerar nova chave no provedor (BRAPI/HG)
2. Atualizar o `.env` na raiz
3. Sincronizar secrets: `supabase secrets set --env-file .env`
4. Fazer deploy da Edge Function
5. Verificar logs por erros de autenticação
6. Revogar chave antiga após 24h

**Rollback**: Restaurar chave anterior se nova falhar

### [RB-003] Resposta a Rate Limit

**Quando executar**: Recebendo 429 das APIs externas

**Passos**:
1. Identificar fonte do tráfego excessivo
2. Aumentar TTL do cache temporariamente
3. Se DDoS, bloquear IPs ofensores
4. Contatar provedor se limite legítimo
5. Considerar upgrade de plano

**Rollback**: Restaurar TTL original após estabilização

## Manutenção Programada

### Diária

- [ ] Verificar logs de erro
- [ ] Confirmar hit rate > 80%

### Semanal

- [ ] Revisar métricas de latência
- [ ] Verificar uso de quota das APIs
- [ ] Atualizar calendário de feriados se necessário

### Mensal

- [ ] Revisar e arquivar logs antigos
- [ ] Verificar atualizações de dependências
- [ ] Teste de disaster recovery

### Anual

- [ ] Rotação de API keys
- [ ] Atualização de calendário B3
- [ ] Revisão de arquitetura

---

**Anterior**: [Segurança](./07-seguranca.md) | **Próximo**: [Qualidade](./09-qualidade.md)
