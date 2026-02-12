import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

type OpenApiDoc = {
  paths: Record<string, { get?: { responses?: Record<string, { headers?: Record<string, unknown> }> } }>;
};

function carregarOpenApi(): OpenApiDoc {
  const caminhoArquivo = path.resolve(process.cwd(), 'openapi/v1.yaml');
  const conteudo = fs.readFileSync(caminhoArquivo, 'utf-8');
  return YAML.parse(conteudo) as OpenApiDoc;
}

describe('contrato OpenAPI - headers de cache', () => {
  it('deve manter headers esperados para /market-overview, /quote e /historical', () => {
    const doc = carregarOpenApi();
    const endpoints = ['/market-overview', '/quote', '/historical'];

    const contratoHeaders = endpoints.map((endpoint) => {
      const headers = doc.paths[endpoint]?.get?.responses?.['200']?.headers as
        | {
            'X-Cache'?: { schema?: { enum?: string[]; type?: string } };
            'X-Cache-Age'?: { schema?: { type?: string } };
          }
        | undefined;

      expect(headers, `headers 200 ausentes em ${endpoint}`).toBeDefined();
      expect(headers?.['X-Cache']?.schema?.type).toBe('string');
      expect(headers?.['X-Cache']?.schema?.enum).toEqual(['HIT', 'MISS', 'STALE']);
      expect(headers?.['X-Cache-Age']?.schema?.type).toBe('integer');

      return {
        endpoint,
        xCacheEnum: headers?.['X-Cache']?.schema?.enum,
        xCacheAgeType: headers?.['X-Cache-Age']?.schema?.type,
      };
    });

    expect(contratoHeaders).toMatchInlineSnapshot(`
      [
        {
          "endpoint": "/market-overview",
          "xCacheAgeType": "integer",
          "xCacheEnum": [
            "HIT",
            "MISS",
            "STALE",
          ],
        },
        {
          "endpoint": "/quote",
          "xCacheAgeType": "integer",
          "xCacheEnum": [
            "HIT",
            "MISS",
            "STALE",
          ],
        },
        {
          "endpoint": "/historical",
          "xCacheAgeType": "integer",
          "xCacheEnum": [
            "HIT",
            "MISS",
            "STALE",
          ],
        },
      ]
    `);
  });
});
