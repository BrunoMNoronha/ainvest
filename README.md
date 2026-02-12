# AInvest

Plataforma de analise e sinais de trading para o mercado brasileiro (B3).

## Visao geral
- Frontend React + Vite
- Backend Supabase Edge Functions + PostgreSQL
- Cache SWR com Upstash Redis

## Requisitos
- Node.js 18+ e npm
- (Opcional) Supabase CLI para rodar Edge Functions localmente

## Configuracao

Crie ou atualize o arquivo `.env` na raiz com as variaveis abaixo:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
BRAPI_TOKEN=
HG_BRASIL_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Notas:
- Variaveis com prefixo `VITE_` sao usadas no frontend.
- As demais sao usadas pela Edge Function `market-data`.
- Para deploy no Supabase, sincronize com `supabase secrets set --env-file .env`.

## Rodar local

```
npm install
npm run dev
```

Servidor em http://localhost:8080.

## Build e preview

```
npm run build
npm run preview
```

## Documentacao

Veja `docs/README.md` para a visao completa do sistema e ADRs.
