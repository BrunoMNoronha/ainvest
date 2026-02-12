import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuotes } from "@/hooks/useMarketData";
import { generateAlerts, type GeneratedAlert, type AlertType } from "@/utils/alerts";
import { useMemo } from "react";

// Mesma watchlist usada em WatchList.tsx
const WATCHLIST_TICKERS = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'MGLU3', 'WEGE3'];

const getAlertIcon = (type: AlertType) => {
  switch (type) {
    case "signal":
      return <TrendingUp className="h-4 w-4" />;
    case "price":
      return <Bell className="h-4 w-4" />;
    case "risk":
      return <AlertTriangle className="h-4 w-4" />;
    case "success":
      return <CheckCircle className="h-4 w-4" />;
  }
};

const getAlertColor = (type: AlertType) => {
  switch (type) {
    case "signal":
      return "text-primary bg-primary/10";
    case "price":
      return "text-info bg-info/10";
    case "risk":
      return "text-warning bg-warning/10";
    case "success":
      return "text-bullish bg-bullish/10";
  }
};

export function AlertsList() {
  const { data: quotes, isLoading } = useQuotes(WATCHLIST_TICKERS);

  // Gerar alertas dinamicamente a partir das cotações reais
  const alerts = useMemo(() => {
    if (!quotes || quotes.length === 0) return [];
    return generateAlerts(quotes);
  }, [quotes]);

  const unreadCount = alerts.filter(a => !a.read).length;

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Alertas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Alertas Recentes</CardTitle>
        {unreadCount > 0 && (
          <Badge variant="secondary">{unreadCount} novos</Badge>
        )}
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum alerta no momento. Mercado estável.
          </p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg transition-colors",
                  !alert.read ? "bg-accent/50" : "bg-background hover:bg-accent/30"
                )}
              >
                <div className={cn("p-2 rounded-lg", getAlertColor(alert.type))}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{alert.ticker}</span>
                    {!alert.read && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{alert.message}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{alert.time}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
