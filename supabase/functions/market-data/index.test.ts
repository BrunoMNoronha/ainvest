// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkCollectRateLimit,
  limparRateLimitMemoria,
  validateCollectAuthorization,
  validateHistoricalInput,
  validateQuoteInput,
} from './helpers';

type EnvMap = Record<string, string | undefined>;

function envReader(env: EnvMap) {
  return (key: string) => env[key];
}

function toBase64Url(input: string): string {
  return Buffer.from(input).toString('base64url');
}

async function criarJwtHs256(payload: Record<string, unknown>, secret: string) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = toBase64Url(JSON.stringify(header));
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const signatureB64 = Buffer.from(signature).toString('base64url');

  return `${data}.${signatureB64}`;
}

describe('market-data helpers', () => {
  beforeEach(() => {
    limparRateLimitMemoria();
    vi.restoreAllMocks();
  });

  describe('validateCollectAuthorization', () => {
    it('deve aceitar token interno válido', async () => {
      const req = new Request('http://localhost/collect', {
        headers: { 'x-internal-token': 'token-interno' },
      });

      const result = await validateCollectAuthorization(req, envReader({ MARKET_DATA_INTERNAL_TOKEN: 'token-interno' }));
      expect(result.ok).toBe(true);
      expect(result.authType).toBe('internal-token');
    });

    it('deve rejeitar token interno inválido', async () => {
      const req = new Request('http://localhost/collect', {
        headers: { 'x-internal-token': 'invalido' },
      });

      const result = await validateCollectAuthorization(req, envReader({ MARKET_DATA_INTERNAL_TOKEN: 'token-correto' }));
      expect(result).toMatchObject({ ok: false, status: 403, reason: 'invalid_internal_token' });
    });

    it('deve aceitar JWT válido com claim exigida', async () => {
      const secret = 'segredo';
      const token = await criarJwtHs256(
        {
          sub: 'job-collect',
          role: 'service_role',
          exp: Math.floor(Date.now() / 1000) + 300,
        },
        secret
      );

      const req = new Request('http://localhost/collect', {
        headers: { authorization: `Bearer ${token}` },
      });

      const result = await validateCollectAuthorization(req, envReader({ JWT_SECRET: secret }));
      expect(result).toMatchObject({ ok: true, authType: 'jwt', subject: 'job-collect' });
    });

    it('deve rejeitar JWT expirado', async () => {
      const secret = 'segredo';
      const token = await criarJwtHs256(
        {
          role: 'service_role',
          exp: Math.floor(Date.now() / 1000) - 10,
        },
        secret
      );

      const req = new Request('http://localhost/collect', {
        headers: { authorization: `Bearer ${token}` },
      });

      const result = await validateCollectAuthorization(req, envReader({ JWT_SECRET: secret }));
      expect(result).toMatchObject({ ok: false, status: 401, reason: 'jwt_expired' });
    });

    it('deve rejeitar JWT sem claim obrigatória', async () => {
      const secret = 'segredo';
      const token = await criarJwtHs256(
        {
          sub: 'job-collect',
          exp: Math.floor(Date.now() / 1000) + 300,
        },
        secret
      );

      const req = new Request('http://localhost/collect', {
        headers: { authorization: `Bearer ${token}` },
      });

      const result = await validateCollectAuthorization(req, envReader({ JWT_SECRET: secret }));
      expect(result).toMatchObject({ ok: false, status: 403, reason: 'missing_required_claim' });
    });
  });

  describe('checkCollectRateLimit', () => {
    it('deve usar caminho Redis quando configurado', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ result: 1 })))
        .mockResolvedValueOnce(new Response(JSON.stringify({ result: 'OK' })));

      const result = await checkCollectRateLimit(
        'ip:chave',
        envReader({
          UPSTASH_REDIS_REST_URL: 'https://redis.exemplo',
          UPSTASH_REDIS_REST_TOKEN: 'token-redis',
        }),
        fetchMock as unknown as typeof fetch,
        10,
        60
      );

      expect(result).toEqual({ allowed: true, remaining: 9 });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('deve cair para memória quando Redis falha', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('redis indisponível'));

      const first = await checkCollectRateLimit(
        'ip:chave',
        envReader({
          UPSTASH_REDIS_REST_URL: 'https://redis.exemplo',
          UPSTASH_REDIS_REST_TOKEN: 'token-redis',
        }),
        fetchMock as unknown as typeof fetch,
        2,
        60
      );
      const second = await checkCollectRateLimit('ip:chave', envReader({}), fetchMock as unknown as typeof fetch, 2, 60);
      const third = await checkCollectRateLimit('ip:chave', envReader({}), fetchMock as unknown as typeof fetch, 2, 60);

      expect(first).toEqual({ allowed: true, remaining: 1 });
      expect(second).toEqual({ allowed: true, remaining: 0 });
      expect(third).toEqual({ allowed: false, remaining: 0 });
    });
  });

  describe('validações de entrada', () => {
    it('validateQuoteInput deve rejeitar lista vazia', () => {
      expect(validateQuoteInput([])).toEqual({ ok: false, error: 'No symbols provided' });
    });

    it('validateHistoricalInput deve rejeitar símbolo vazio e range inválido', () => {
      expect(validateHistoricalInput('', '1mo')).toEqual({ ok: false, error: 'No symbol provided' });
      expect(validateHistoricalInput('PETR4', 'abc')).toEqual({ ok: false, error: 'Invalid range' });
    });
  });
});
