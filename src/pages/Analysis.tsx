import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield,
  BarChart3,
  Activity,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

const analysisData = {
  ticker: "PETR4",
  name: "Petrobras PN",
  price: 36.82,
  change: 1.45,
  score: 7,
  recommendation: "COMPRA",
  timeframe: "Diário",
  structure: {
    trend: "Alta",
    lastBoS: "27/01 - Rompimento R$ 36,20",
    choch: "Não identificado",
    marketPhase: "Acumulação → Markup",
  },
  pois: [
    { type: "Order Block", level: 35.80, status: "Testado", strength: "Forte" },
    { type: "FVG", level: "35.50 - 35.80", status: "Preenchido parcial", strength: "Médio" },
    { type: "Liquidez", level: 38.50, status: "Acima do preço", strength: "Alta" },
  ],
  indicators: {
    rsi: { value: 58, status: "Neutro", signal: "neutral" },
    adx: { value: 28, status: "Tendência moderada", signal: "bullish" },
    ema8: { above: true, signal: "bullish" },
    ema80: { above: true, signal: "bullish" },
  },
  fibonacci: {
    level: "0.618",
    zone: "Desconto",
    price: 35.40,
  },
  wyckoff: {
    phase: "Spring confirmado",
    volume: "Acima da média",
    test: "Bem sucedido",
  },
  scoring: [
    { criteria: "BoS/ChoCh diário", points: 2, max: 2, achieved: true },
    { criteria: "Preço toca OB + FVG", points: 2, max: 2, achieved: true },
    { criteria: "Wyckoff válido + volume", points: 2, max: 2, achieved: true },
    { criteria: "EMA 80 semanal alinhada", points: 1, max: 1, achieved: true },
    { criteria: "RSI divergente/extremo", points: 0, max: 1, achieved: false },
    { criteria: "Região Fib R:R ≥ 2", points: 1, max: 1, achieved: true },
  ],
};

const Analysis = () => {
  const totalScore = analysisData.scoring.reduce((acc, s) => acc + s.points, 0);
  const maxScore = analysisData.scoring.reduce((acc, s) => acc + s.max, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Análise Técnica</h1>
            <p className="text-muted-foreground">Análise completa baseada em Smart Money Concepts</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar ativo (ex: PETR4)" className="pl-10" />
          </div>
        </div>

        {/* Asset Header */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-foreground">{analysisData.ticker}</h2>
                    <Badge className="bg-bullish hover:bg-bullish/90">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {analysisData.recommendation}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{analysisData.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-3xl font-bold text-foreground">R$ {analysisData.price.toFixed(2)}</p>
                  <p className="text-bullish flex items-center justify-end gap-1">
                    <TrendingUp className="h-4 w-4" />
                    +{analysisData.change}%
                  </p>
                </div>
                <div className="text-center px-4 py-2 rounded-lg bg-primary/10">
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="text-2xl font-bold text-primary">{totalScore}/{maxScore}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Structure & Flow */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Estrutura & Fluxo Institucional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-xs text-muted-foreground">Tendência</p>
                  <p className="font-semibold text-bullish flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    {analysisData.structure.trend}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-xs text-muted-foreground">Fase de Mercado</p>
                  <p className="font-semibold text-foreground">{analysisData.structure.marketPhase}</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-background">
                <p className="text-xs text-muted-foreground">Último Break of Structure</p>
                <p className="font-semibold text-foreground">{analysisData.structure.lastBoS}</p>
              </div>
              <div className="p-3 rounded-lg bg-background">
                <p className="text-xs text-muted-foreground">Change of Character</p>
                <p className="font-semibold text-muted-foreground">{analysisData.structure.choch}</p>
              </div>
            </CardContent>
          </Card>

          {/* POIs */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Pontos de Interesse (POIs)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysisData.pois.map((poi, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background">
                  <div>
                    <p className="font-semibold text-foreground">{poi.type}</p>
                    <p className="text-sm text-muted-foreground">Nível: {poi.level}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={cn(
                      poi.strength === "Forte" && "border-bullish text-bullish",
                      poi.strength === "Médio" && "border-warning text-warning",
                      poi.strength === "Alta" && "border-info text-info"
                    )}>
                      {poi.strength}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{poi.status}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Indicators */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Indicadores Técnicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-foreground">RSI (14)</span>
                    <span className="text-sm font-medium">{analysisData.indicators.rsi.value}</span>
                  </div>
                  <Progress value={analysisData.indicators.rsi.value} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{analysisData.indicators.rsi.status}</p>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-foreground">ADX (12)</span>
                    <span className="text-sm font-medium">{analysisData.indicators.adx.value}</span>
                  </div>
                  <Progress value={analysisData.indicators.adx.value} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{analysisData.indicators.adx.status}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-xs text-muted-foreground">EMA 8</p>
                  <p className={cn("font-semibold", analysisData.indicators.ema8.above ? "text-bullish" : "text-bearish")}>
                    Preço {analysisData.indicators.ema8.above ? "Acima" : "Abaixo"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-xs text-muted-foreground">EMA 80</p>
                  <p className={cn("font-semibold", analysisData.indicators.ema80.above ? "text-bullish" : "text-bearish")}>
                    Preço {analysisData.indicators.ema80.above ? "Acima" : "Abaixo"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scoring */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Sistema de Pontuação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysisData.scoring.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                      item.achieved ? "bg-bullish text-bullish-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {item.achieved ? "✓" : "○"}
                    </div>
                    <span className="text-sm text-foreground">{item.criteria}</span>
                  </div>
                  <Badge variant={item.achieved ? "default" : "secondary"} className={cn(
                    item.achieved && "bg-bullish hover:bg-bullish/90"
                  )}>
                    +{item.points}/{item.max}
                  </Badge>
                </div>
              ))}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Score Total</span>
                  <Badge className={cn(
                    "text-lg px-4 py-1",
                    totalScore >= 7 ? "bg-bullish" : totalScore >= 6 ? "bg-warning" : "bg-muted"
                  )}>
                    {totalScore}/{maxScore}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {totalScore >= 6 ? "✅ Score válido para entrada" : "❌ Score insuficiente"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button size="lg" className="bg-bullish hover:bg-bullish/90">
            <Target className="h-4 w-4 mr-2" />
            Gerar Sinal de Entrada
          </Button>
          <Button size="lg" variant="outline">
            Adicionar à Watchlist
          </Button>
          <Button size="lg" variant="outline">
            Criar Alerta
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analysis;
