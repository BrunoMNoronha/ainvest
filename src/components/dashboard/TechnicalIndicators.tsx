import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useHistorical } from "@/hooks/useMarketData";
import {
  calculateRSI,
  calculateEMA,
  calculateADX,
  getIndicatorStatus,
  getIndicatorDescription,
} from "@/utils/indicators";
import { useMemo } from "react";

// Ativo de referência para cálculo de indicadores (IBOV proxy)
const INDICATOR_SYMBOL = "PETR4";

interface IndicatorData {
  name: string;
  type: 'rsi' | 'adx' | 'ema';
  value: number | null;
  status: "bullish" | "bearish" | "neutral";
  description: string;
  /** Mostrar barra de progresso apenas para RSI e ADX */
  showBar: boolean;
}

export function TechnicalIndicators() {
  const { data: candles, isLoading } = useHistorical(INDICATOR_SYMBOL, '3mo');

  // Calcular indicadores a partir de candles reais
  const indicators: IndicatorData[] = useMemo(() => {
    if (!candles || candles.length === 0) return getPlaceholders();

    const currentPrice = candles[candles.length - 1]?.close;
    const rsi = calculateRSI(candles, 14);
    const ema8 = calculateEMA(candles, 8);
    const ema80 = calculateEMA(candles, 80);
    const adx = calculateADX(candles, 12);

    return [
      {
        name: "RSI (14)",
        type: 'rsi' as const,
        value: rsi,
        status: getIndicatorStatus('rsi', rsi),
        description: getIndicatorDescription('rsi', rsi),
        showBar: true,
      },
      {
        name: "ADX (12)",
        type: 'adx' as const,
        value: adx,
        status: getIndicatorStatus('adx', adx),
        description: getIndicatorDescription('adx', adx),
        showBar: true,
      },
      {
        name: "EMA 8",
        type: 'ema' as const,
        value: ema8,
        status: getIndicatorStatus('ema', ema8, currentPrice),
        description: getIndicatorDescription('ema', ema8, currentPrice),
        showBar: false,
      },
      {
        name: "EMA 80",
        type: 'ema' as const,
        value: ema80,
        status: getIndicatorStatus('ema', ema80, currentPrice),
        description: getIndicatorDescription('ema', ema80, currentPrice),
        showBar: false,
      },
    ];
  }, [candles]);

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Indicadores Técnicos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Indicadores Técnicos</CardTitle>
          <span className="text-xs text-muted-foreground">{INDICATOR_SYMBOL}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {indicators.map((indicator) => (
            <div key={indicator.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {indicator.name}
                  {indicator.value !== null && indicator.showBar && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({indicator.value.toFixed(1)})
                    </span>
                  )}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    indicator.status === "bullish" && "border-bullish text-bullish",
                    indicator.status === "bearish" && "border-bearish text-bearish",
                    indicator.status === "neutral" && "border-muted-foreground text-muted-foreground"
                  )}
                >
                  {indicator.status === "bullish" && "Alta"}
                  {indicator.status === "bearish" && "Baixa"}
                  {indicator.status === "neutral" && "Neutro"}
                </Badge>
              </div>
              {indicator.showBar && indicator.value !== null && (
                <Progress value={indicator.value} className="h-2" />
              )}
              <p className="text-xs text-muted-foreground">{indicator.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Placeholders enquanto dados carregam ou não existem */
function getPlaceholders(): IndicatorData[] {
  return [
    { name: "RSI (14)", type: 'rsi', value: null, status: "neutral", description: "Aguardando dados...", showBar: false },
    { name: "ADX (12)", type: 'adx', value: null, status: "neutral", description: "Aguardando dados...", showBar: false },
    { name: "EMA 8", type: 'ema', value: null, status: "neutral", description: "Aguardando dados...", showBar: false },
    { name: "EMA 80", type: 'ema', value: null, status: "neutral", description: "Aguardando dados...", showBar: false },
  ];
}
