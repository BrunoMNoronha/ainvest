import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarketOverview, formatRelativeTime } from "@/hooks/useMarketData";
import { useMarketStatus } from "@/hooks/useMarketStatus";

export function MarketOverview() {
  const { data, isLoading, error } = useMarketOverview();
  const marketStatus = useMarketStatus();

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Visão de Mercado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg bg-background flex flex-col gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Visão de Mercado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Erro ao carregar dados do mercado. Tentando novamente...
          </p>
        </CardContent>
      </Card>
    );
  }

  const indices = [
    { name: "IBOV", value: data.ibov.value.toLocaleString('pt-BR'), change: data.ibov.changePercent },
    { name: "IFIX", value: data.ifix.value.toLocaleString('pt-BR'), change: data.ifix.changePercent },
    { name: "S&P 500*", value: data.sp500Proxy.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), change: data.sp500Proxy.changePercent },
    { name: "Dólar", value: data.usdBrl.buy.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), change: data.usdBrl.change },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Visão de Mercado</CardTitle>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatRelativeTime(data.updatedAt)}</span>
          {!marketStatus.isOpen && (
            <span className="text-warning">• {marketStatus.phase === 'closed' ? 'Fechado' : 'Pré-mercado'}</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {indices.map((index) => (
            <div 
              key={index.name}
              className="p-4 rounded-lg bg-background flex flex-col gap-1"
            >
              <span className="text-sm text-muted-foreground">{index.name}</span>
              <span className="text-xl font-bold text-foreground">{index.value}</span>
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                index.change >= 0 ? "text-bullish" : "text-bearish"
              )}>
                {index.change >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{index.change >= 0 ? "+" : ""}{index.change.toFixed(2)}%</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">* IVVB11 como proxy</p>
      </CardContent>
    </Card>
  );
}
