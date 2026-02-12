import { beforeEach, describe, expect, it, vi } from 'vitest';
import brapiQuotesFixture from '@/test/fixtures/brapi-quotes.json';
import brapiHistoricalFixture from '@/test/fixtures/brapi-historical.json';

const { invokeMock, inMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  inMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: invokeMock,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: inMock,
      })),
    })),
  },
}));

import { getHistorical, getQuotes, getQuotesDBFirst } from './marketApi';

describe('marketApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('callMarketDataFunction (via getQuotes)', () => {
    it('deve retornar sucesso quando invoke responde sem erro', async () => {
      invokeMock.mockResolvedValue({
        data: { data: brapiQuotesFixture.results, cached: false },
        error: null,
      });

      const quotes = await getQuotes(['PETR4', 'VALE3']);

      expect(quotes).toHaveLength(2);
      expect(invokeMock).toHaveBeenCalledWith(
        expect.stringContaining('market-data/quote?symbols=PETR4%2CVALE3'),
        { method: 'GET' }
      );
    });

    it('deve lançar erro quando invoke retorna erro', async () => {
      invokeMock.mockResolvedValue({
        data: null,
        error: { message: 'falha simulada' },
      });

      await expect(getQuotes(['PETR4'])).rejects.toThrow('falha simulada');
    });
  });

  describe('getQuotesDBFirst fallback', () => {
    it('deve usar dado fresh do banco e não chamar Edge Function', async () => {
      inMock.mockResolvedValue({
        data: [
          {
            symbol: 'PETR4',
            name: 'Petrobras PN',
            price: '39.21',
            change: '0.45',
            change_percent: '1.16',
            volume: '25000000',
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      const quotes = await getQuotesDBFirst(['PETR4']);

      expect(quotes[0].symbol).toBe('PETR4');
      expect(invokeMock).not.toHaveBeenCalled();
    });

    it('deve cair para fallback quando banco está stale', async () => {
      inMock.mockResolvedValue({
        data: [
          {
            symbol: 'PETR4',
            name: 'Petrobras PN',
            price: '39.21',
            updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          },
        ],
        error: null,
      });

      invokeMock.mockResolvedValue({
        data: { data: brapiQuotesFixture.results, cached: false },
        error: null,
      });

      const quotes = await getQuotesDBFirst(['PETR4']);

      expect(invokeMock).toHaveBeenCalledTimes(1);
      expect(quotes).toHaveLength(2);
    });

    it('deve cair para fallback quando banco retorna null', async () => {
      inMock.mockResolvedValue({ data: null, error: null });
      invokeMock.mockResolvedValue({
        data: { data: brapiQuotesFixture.results, cached: false },
        error: null,
      });

      const quotes = await getQuotesDBFirst(['PETR4']);

      expect(invokeMock).toHaveBeenCalledTimes(1);
      expect(quotes[0].symbol).toBe('PETR4');
    });
  });

  describe('parsing data[]', () => {
    it('getQuotes deve parsear retorno { data: [] }', async () => {
      invokeMock.mockResolvedValue({
        data: { data: brapiQuotesFixture.results, cached: false },
        error: null,
      });

      const quotes = await getQuotes(['PETR4', 'VALE3']);
      expect(quotes).toEqual(brapiQuotesFixture.results);
    });

    it('getHistorical deve parsear retorno { data: [] }', async () => {
      const candles = brapiHistoricalFixture.results[0].historicalDataPrice.map((item) => ({
        date: new Date(item.date * 1000).toISOString().split('T')[0],
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
      }));

      invokeMock.mockResolvedValue({
        data: { data: candles, cached: false },
        error: null,
      });

      const result = await getHistorical('PETR4', '1mo');
      expect(result).toEqual(candles);
    });
  });
});
