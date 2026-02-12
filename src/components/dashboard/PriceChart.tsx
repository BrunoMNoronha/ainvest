import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { useState } from "react";
import { useHistorical, useQuotes } from "@/hooks/useMarketData";
import { labelToRange, rangeLabels } from "@/services/marketApi";
import type { HistoricalRange } from "@/types/market";

const AVAILABLE_SYMBOLS = [
  { value: 'PETR4', label: 'PETR4 - Petrobras PN' },
  { value: 'VALE3', label: 'VALE3 - Vale ON' },
  { value: 'ITUB4', label: 'ITUB4 - Itaú Unibanco' },
  { value: 'BBDC4', label: 'BBDC4 - Bradesco' },
  { value: 'WEGE3', label: 'WEGE3 - WEG' },
  { value: 'MGLU3', label: 'MGLU3 - Magazine Luiza' },
];

const timeframes = ["1D", "1S", "1M", "3M", "1A"];

export function PriceChart() {
  const [selectedSymbol, setSelectedSymbol] = useState('PETR4');
  const [activeTimeframe, setActiveTimeframe] = useState("1M");
  
  const range = labelToRange[activeTimeframe] || '1mo';
  const { data: historicalData, isLoading: historyLoading } = useHistorical(selectedSymbol, range as HistoricalRange);
  const { data: quotes, isLoading: quoteLoading } = useQuotes([selectedSymbol]);

  const currentQuote = quotes?.[0];
  const chartData = historicalData?.map(candle => ({
    date: candle.date.split('-').slice(1).join('/'),
    price: candle.close,
    volume: candle.volume,
  })) || [];

  const isLoading = historyLoading || quoteLoading;
  const currentPrice = currentQuote?.price || chartData[chartData.length - 1]?.price || 0;
  const priceChange = currentQuote?.changePercent || 0;

  if (isLoading && !chartData.length) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-40" />
          </div>
          <div className="flex gap-1">
            {timeframes.map((tf) => (
              <Skeleton key={tf} className="h-8 w-10" />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_SYMBOLS.map((symbol) => (
                  <SelectItem key={symbol.value} value={symbol.value}>
                    {symbol.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline">{currentQuote?.name || selectedSymbol}</Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-foreground">
              R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={priceChange >= 0 ? "text-bullish" : "text-bearish"}>
              {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          {timeframes.map((tf) => (
            <Button
              key={tf}
              variant={activeTimeframe === tf ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTimeframe(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] mt-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis 
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickFormatter={(value) => `R$${value.toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Preço']}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Sem dados históricos disponíveis
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
