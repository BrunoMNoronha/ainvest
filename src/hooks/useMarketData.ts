import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { 
  getMarketOverview, 
  getQuotesDBFirst, 
  getHistorical 
} from "@/services/marketApi";
import { useMarketStatus } from "./useMarketStatus";
import type { Quote, MarketOverview, Candle, HistoricalRange } from "@/types/market";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes during market hours

export function useMarketOverview() {
  const { shouldPoll } = useMarketStatus();

  return useQuery<MarketOverview>({
    queryKey: ['market-overview'],
    queryFn: getMarketOverview,
    staleTime: STALE_TIME,
    refetchInterval: shouldPoll ? POLL_INTERVAL : false,
    placeholderData: keepPreviousData,
    retry: 2,
  });
}

export function useQuotes(symbols: string[]) {
  const { shouldPoll } = useMarketStatus();

  return useQuery<Quote[]>({
    queryKey: ['quotes', symbols.sort().join(',')],
    queryFn: () => getQuotesDBFirst(symbols),
    staleTime: STALE_TIME,
    refetchInterval: shouldPoll ? POLL_INTERVAL : false,
    placeholderData: keepPreviousData,
    retry: 2,
    enabled: symbols.length > 0,
  });
}

export function useHistorical(symbol: string, range: HistoricalRange = '1mo') {
  return useQuery<Candle[]>({
    queryKey: ['historical', symbol, range],
    queryFn: () => getHistorical(symbol, range),
    staleTime: 60 * 60 * 1000, // 1 hour for historical data
    placeholderData: keepPreviousData,
    retry: 2,
    enabled: !!symbol,
  });
}

// Helper to format relative time for "Atualizado há X min"
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'agora';
  if (diffMinutes === 1) return 'há 1 min';
  if (diffMinutes < 60) return `há ${diffMinutes} min`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return 'há 1 hora';
  if (diffHours < 24) return `há ${diffHours} horas`;
  
  return 'há mais de 1 dia';
}
