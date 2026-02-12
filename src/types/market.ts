// Quote data from BRAPI
export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  updatedAt: string;
}

// Market index data
export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  updatedAt: string;
}

// Market overview with all indices and macro data
export interface MarketOverview {
  ibov: MarketIndex;
  ifix: MarketIndex;
  sp500Proxy: MarketIndex; // IVVB11 as S&P 500 proxy
  usdBrl: {
    buy: number;
    sell: number;
    change: number;
    updatedAt: string;
  };
  selic: number;
  cdi: number;
  updatedAt: string;
  marketStatus: MarketStatus;
}

// Historical OHLCV candle data
export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Market status information
export interface MarketStatus {
  isOpen: boolean;
  phase: 'pre-market' | 'open' | 'after-hours' | 'closed';
  nextOpen?: string;
  isHoliday: boolean;
  holidayName?: string;
}

// API response types
export interface MarketDataResponse<T> {
  data: T;
  cached: boolean;
  cacheAge?: number;
  updatedAt: string;
}

// Historical data range options
export type HistoricalRange = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y';

// Watchlist stock with signal
export interface WatchlistStock extends Quote {
  signal?: 'buy' | 'sell' | 'watch';
}
