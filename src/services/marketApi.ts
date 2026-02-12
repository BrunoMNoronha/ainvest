import { supabase } from "@/integrations/supabase/client";
import type { 
  Quote, 
  MarketOverview, 
  Candle, 
  MarketStatus, 
  HistoricalRange 
} from "@/types/market";

// Tempo máximo de idade dos dados do banco antes de usar fallback (5 min)
const MAX_DATA_AGE_MS = 5 * 60 * 1000;

const FUNCTION_NAME = 'market-data';

export async function callMarketDataFunction<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  
  const { data, error } = await supabase.functions.invoke(`${FUNCTION_NAME}/${endpoint}${queryString}`, {
    method: 'GET',
  });

  if (error) {
    console.error(`Market API error (${endpoint}):`, error);
    throw new Error(error.message || 'Failed to fetch market data');
  }

  return data;
}

export async function getMarketOverview(): Promise<MarketOverview> {
  const response = await callMarketDataFunction<MarketOverview & { cached: boolean; cacheAge?: number }>('market-overview');
  return response;
}

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  if (!symbols.length) return [];
  
  const response = await callMarketDataFunction<{ data: Quote[]; cached: boolean }>('quote', {
    symbols: symbols.join(',')
  });
  
  return response.data || [];
}

export async function getHistorical(symbol: string, range: HistoricalRange = '1mo'): Promise<Candle[]> {
  const response = await callMarketDataFunction<{ data: Candle[]; cached: boolean }>('historical', {
    symbol,
    range
  });
  
  return response.data || [];
}

export async function getMarketStatus(): Promise<MarketStatus> {
  return callMarketDataFunction<MarketStatus>('status');
}

// Map BRAPI range format to display labels
export const rangeLabels: Record<HistoricalRange, string> = {
  '1d': '1D',
  '5d': '1S',
  '1mo': '1M',
  '3mo': '3M',
  '6mo': '6M',
  '1y': '1A',
  '2y': '2A',
  '5y': '5A'
};

// Map display labels to BRAPI range format
export const labelToRange: Record<string, HistoricalRange> = {
  '1D': '1d',
  '1S': '5d',
  '1M': '1mo',
  '3M': '3mo',
  '6M': '6mo',
  '1A': '1y',
  '2A': '2y',
  '5A': '5y'
};

// ============================================================
// Estratégia DB-first: leitura prioritária do PostgreSQL
// ============================================================

/**
 * Busca cotações mais recentes do banco de dados (quotes_latest).
 * Retorna null se os dados forem stale (> MAX_DATA_AGE_MS).
 */
export async function getQuotesFromDB(symbols: string[]): Promise<Quote[] | null> {
  if (!symbols.length) return [];

  const { data, error } = await supabase
    .from('quotes_latest')
    .select('*')
    .in('symbol', symbols);

  if (error || !data || data.length === 0) return null;

  // Verificar se dados são recentes o suficiente
  const now = Date.now();
  const mostRecent = data.reduce((latest, row) => {
    const ts = new Date(row.updated_at || '').getTime();
    return ts > latest ? ts : latest;
  }, 0);

  if (now - mostRecent > MAX_DATA_AGE_MS) return null;

  // Mapear para o tipo Quote do frontend
  return data.map(row => ({
    symbol: row.symbol,
    name: row.name,
    price: Number(row.price),
    change: Number(row.change ?? 0),
    changePercent: Number(row.change_percent ?? 0),
    volume: Number(row.volume ?? 0),
    updatedAt: row.updated_at || '',
  }));
}

/**
 * Busca candles diários do banco de dados (market_candles_daily).
 * Retorna null se não houver dados.
 */
export async function getCandlesFromDB(symbol: string): Promise<Candle[] | null> {
  const { data, error } = await supabase
    .from('market_candles_daily')
    .select('*')
    .eq('symbol', symbol)
    .order('date', { ascending: true });

  if (error || !data || data.length === 0) return null;

  return data.map(row => ({
    date: row.date,
    open: Number(row.open),
    high: Number(row.high),
    low: Number(row.low),
    close: Number(row.close),
    volume: Number(row.volume ?? 0),
  }));
}

/**
 * Estratégia DB-first para cotações:
 * 1. Tenta buscar do PostgreSQL
 * 2. Se dados forem stale ou inexistentes, usa Edge Function como fallback
 */
export async function getQuotesDBFirst(symbols: string[]): Promise<Quote[]> {
  // Tentar banco primeiro
  const dbQuotes = await getQuotesFromDB(symbols);
  if (dbQuotes && dbQuotes.length > 0) {
    return dbQuotes;
  }

  // Fallback: Edge Function
  return getQuotes(symbols);
}
