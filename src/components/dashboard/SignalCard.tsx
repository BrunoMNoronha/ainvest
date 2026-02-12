import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Target, Shield, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignalCardProps {
  ticker: string;
  name: string;
  type: "buy" | "sell";
  score: number;
  entry: number;
  stopLoss: number;
  targets: number[];
  riskReward: string;
  timeframe: string;
  indicators: string[];
}

export function SignalCard({
  ticker,
  name,
  type,
  score,
  entry,
  stopLoss,
  targets,
  riskReward,
  timeframe,
  indicators,
}: SignalCardProps) {
  const isBuy = type === "buy";

  return (
    <Card className="bg-card border-border overflow-hidden">
      <div className={cn(
        "h-1",
        isBuy ? "bg-bullish" : "bg-bearish"
      )} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold">{ticker}</CardTitle>
              <Badge variant={isBuy ? "default" : "destructive"} className={cn(
                "flex items-center gap-1",
                isBuy ? "bg-bullish hover:bg-bullish/90" : "bg-bearish hover:bg-bearish/90"
              )}>
                {isBuy ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {isBuy ? "COMPRA" : "VENDA"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{name}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Score:</span>
              <Badge variant="outline" className={cn(
                "font-bold",
                score >= 7 ? "border-bullish text-bullish" : "border-warning text-warning"
              )}>
                {score}/9
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-background">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Target className="h-3 w-3" />
              Entrada
            </div>
            <p className="font-bold text-foreground">R$ {entry.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-background">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Shield className="h-3 w-3" />
              Stop Loss
            </div>
            <p className="font-bold text-bearish">R$ {stopLoss.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-background">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              R:R
            </div>
            <p className="font-bold text-bullish">{riskReward}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Alvos (Take Profit)</p>
          <div className="flex flex-wrap gap-2">
            {targets.map((target, index) => (
              <Badge key={index} variant="outline" className="border-bullish/50 text-bullish">
                TP{index + 1}: R$ {target.toFixed(2)}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Confirmações</p>
          <div className="flex flex-wrap gap-1.5">
            {indicators.map((indicator, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {indicator}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">Timeframe: {timeframe}</span>
          <Button size="sm" className={cn(
            isBuy ? "bg-bullish hover:bg-bullish/90" : "bg-bearish hover:bg-bearish/90"
          )}>
            Ver Análise Completa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
