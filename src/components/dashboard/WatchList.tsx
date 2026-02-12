import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuotes } from "@/hooks/useMarketData";
import type { Quote } from "@/types/market";

// Tickers to watch with their signal status (logic to be implemented with SMC)
const WATCHLIST_TICKERS = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'MGLU3', 'WEGE3'];

// Signal mapping (placeholder - will be replaced by SMC analysis)
const signalMap: Record<string, 'buy' | 'sell' | 'watch' | undefined> = {
  'PETR4': 'buy',
  'VALE3': 'watch',
  'ITUB4': 'buy',
  'BBDC4': 'sell',
  'MGLU3': 'watch',
  'WEGE3': 'buy',
};

const getSignalBadge = (signal?: 'buy' | 'sell' | 'watch') => {
  if (!signal) return null;
  
  const config = {
    buy: { label: "Compra", className: "bg-bullish/10 text-bullish border-bullish/30" },
    sell: { label: "Venda", className: "bg-bearish/10 text-bearish border-bearish/30" },
    watch: { label: "Aguardar", className: "bg-warning/10 text-warning border-warning/30" },
  };

  return (
    <Badge variant="outline" className={cn("text-xs", config[signal].className)}>
      {config[signal].label}
    </Badge>
  );
};

function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(1)}B`;
  }
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(1)}M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}K`;
  }
  return volume.toString();
}

function WatchListSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Watchlist</CardTitle>
        <Star className="h-5 w-5 text-warning" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background">
              <div className="flex items-center gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-4 w-16 ml-auto" />
                <Skeleton className="h-3 w-12 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function WatchList() {
  const { data: quotes, isLoading, error } = useQuotes(WATCHLIST_TICKERS);

  if (isLoading) {
    return <WatchListSkeleton />;
  }

  // Merge quotes with signal data
  const watchlist = WATCHLIST_TICKERS.map(ticker => {
    const quote = quotes?.find(q => q.symbol === ticker);
    return {
      ticker,
      name: quote?.name || ticker,
      price: quote?.price || 0,
      change: quote?.changePercent || 0,
      volume: quote?.volume || 0,
      signal: signalMap[ticker],
    };
  });

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Watchlist</CardTitle>
        <Star className="h-5 w-5 text-warning" />
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-sm text-muted-foreground mb-2">
            Usando dados em cache. Atualizando...
          </p>
        )}
        <div className="space-y-2">
          {watchlist.map((stock) => (
            <div 
              key={stock.ticker}
              className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{stock.ticker}</span>
                    {getSignalBadge(stock.signal)}
                  </div>
                  <span className="text-xs text-muted-foreground">{stock.name}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  R$ {stock.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className={cn(
                  "flex items-center justify-end gap-1 text-sm",
                  stock.change >= 0 ? "text-bullish" : "text-bearish"
                )}>
                  {stock.change >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
