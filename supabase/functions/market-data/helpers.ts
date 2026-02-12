export type EnvReader = (key: string) => string | undefined;
export type FetchLike = typeof fetch;

export type AuthResult = {
  ok: boolean;
  status?: number;
  reason?: string;
  authType?: string;
  subject?: string;
};

const collectRateLimitMem = new Map<string, { count: number; resetAt: number }>();

function toBase64Url(input: ArrayBuffer): string {
  const bytes = new Uint8Array(input);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function parseJwtPayload(token: string): Record<string, any> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (payloadB64.length % 4)) % 4);
    const decoded = atob(payloadB64 + padding);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

async function verifyJwtHs256(token: string, secret: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [header, payload, signature] = parts;
  const data = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return toBase64Url(signed) === signature;
}

export async function validateCollectAuthorization(req: Request, readEnv: EnvReader): Promise<AuthResult> {
  const internalToken = req.headers.get('x-internal-token');
  const expectedInternalToken = readEnv('MARKET_DATA_INTERNAL_TOKEN');

  if (internalToken) {
    if (!expectedInternalToken) {
      return { ok: false, status: 403, reason: 'internal_token_not_configured' };
    }
    if (internalToken !== expectedInternalToken) {
      return { ok: false, status: 403, reason: 'invalid_internal_token' };
    }
    return { ok: true, authType: 'internal-token', subject: 'internal' };
  }

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return { ok: false, status: 401, reason: 'missing_credentials' };
  }

  const jwtSecret = readEnv('JWT_SECRET') || readEnv('SUPABASE_JWT_SECRET');
  if (!jwtSecret) {
    return { ok: false, status: 403, reason: 'jwt_secret_not_configured' };
  }

  const payload = parseJwtPayload(token);
  if (!payload) {
    return { ok: false, status: 401, reason: 'invalid_jwt_payload' };
  }

  const isValidSignature = await verifyJwtHs256(token, jwtSecret);
  if (!isValidSignature) {
    return { ok: false, status: 401, reason: 'invalid_jwt_signature' };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && payload.exp < nowSeconds) {
    return { ok: false, status: 401, reason: 'jwt_expired' };
  }

  const requiredClaimName = readEnv('MARKET_DATA_COLLECT_CLAIM') || 'role';
  const requiredClaimValue = readEnv('MARKET_DATA_COLLECT_CLAIM_VALUE') || 'service_role';
  if (String(payload[requiredClaimName] || '') !== requiredClaimValue) {
    return { ok: false, status: 403, reason: 'missing_required_claim' };
  }

  return { ok: true, authType: 'jwt', subject: payload.sub || payload.role || 'jwt' };
}

export function getRequestIdentity(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown-ip';
  const firstIp = forwardedFor.split(',')[0]?.trim() || 'unknown-ip';
  const apiKey = req.headers.get('x-internal-key') || req.headers.get('apikey') || '';
  const keySuffix = apiKey ? apiKey.slice(-6) : 'no-key';
  return `${firstIp}:${keySuffix}`;
}

export async function checkCollectRateLimit(
  identity: string,
  readEnv: EnvReader,
  fetcher: FetchLike,
  maxRequests = 10,
  windowSeconds = 60
): Promise<{ allowed: boolean; remaining: number }> {
  const redisUrl = readEnv('UPSTASH_REDIS_REST_URL');
  const redisToken = readEnv('UPSTASH_REDIS_REST_TOKEN');
  const key = `rl:collect:${identity}`;

  if (redisUrl && redisToken) {
    try {
      const incrResponse = await fetcher(`${redisUrl}/incr/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });
      const incrData = await incrResponse.json();
      const count = Number(incrData.result || 0);

      if (count === 1) {
        await fetcher(`${redisUrl}/expire/${encodeURIComponent(key)}/${windowSeconds}`, {
          headers: { Authorization: `Bearer ${redisToken}` }
        });
      }

      return {
        allowed: count <= maxRequests,
        remaining: Math.max(0, maxRequests - count)
      };
    } catch (error) {
      console.error('Rate limit via Redis falhou, usando memória local', error);
    }
  }

  const now = Date.now();
  const current = collectRateLimitMem.get(identity);

  if (!current || current.resetAt <= now) {
    collectRateLimitMem.set(identity, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  current.count += 1;
  collectRateLimitMem.set(identity, current);

  return {
    allowed: current.count <= maxRequests,
    remaining: Math.max(0, maxRequests - current.count)
  };
}

export function limparRateLimitMemoria() {
  collectRateLimitMem.clear();
}

export function validateQuoteInput(symbols: string[]): { ok: boolean; error?: string } {
  if (!symbols.length) {
    return { ok: false, error: 'No symbols provided' };
  }
  return { ok: true };
}

export function validateHistoricalInput(symbol: string, range: string): { ok: boolean; error?: string; normalizedRange?: string } {
  if (!symbol) {
    return { ok: false, error: 'No symbol provided' };
  }

  const validRanges = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y'];
  const normalizedRange = range?.toLowerCase() || '1mo';
  if (!validRanges.includes(normalizedRange)) {
    return { ok: false, error: 'Invalid range' };
  }

  return { ok: true, normalizedRange };
}
