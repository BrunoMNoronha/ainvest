import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SignalCard } from "@/components/dashboard/SignalCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, ArrowUpDown } from "lucide-react";

const allSignals = [
  {
    ticker: "PETR4",
    name: "Petrobras PN",
    type: "buy" as const,
    score: 7,
    entry: 36.50,
    stopLoss: 34.80,
    targets: [38.20, 40.50, 43.00],
    riskReward: "1:2.5",
    timeframe: "Diário",
    indicators: ["BoS Confirmado", "OB + FVG", "RSI Divergência", "EMA 80 Alinhada", "Wyckoff Spring"],
  },
  {
    ticker: "VALE3",
    name: "Vale ON",
    type: "buy" as const,
    score: 6,
    entry: 61.80,
    stopLoss: 59.50,
    targets: [65.20, 68.00],
    riskReward: "1:2.0",
    timeframe: "Diário",
    indicators: ["ChoCh Diário", "Zona Fib 0.618", "Volume Confirmado", "ADX > 25"],
  },
  {
    ticker: "BBDC4",
    name: "Bradesco PN",
    type: "sell" as const,
    score: 6,
    entry: 15.80,
    stopLoss: 16.50,
    targets: [14.50, 13.80],
    riskReward: "1:2.2",
    timeframe: "Diário",
    indicators: ["UTAD Confirmado", "OB Bearish", "RSI Sobrecompra", "Volume Alto"],
  },
  {
    ticker: "ITUB4",
    name: "Itaú Unibanco PN",
    type: "buy" as const,
    score: 8,
    entry: 33.90,
    stopLoss: 32.50,
    targets: [35.80, 37.50, 40.00],
    riskReward: "1:3.0",
    timeframe: "Diário",
    indicators: ["BoS Forte", "Spring Wyckoff", "Fib 0.705", "EMA 80 Suporte", "ADX 32"],
  },
  {
    ticker: "WEGE3",
    name: "WEG ON",
    type: "buy" as const,
    score: 7,
    entry: 42.20,
    stopLoss: 40.50,
    targets: [45.00, 48.00],
    riskReward: "1:2.4",
    timeframe: "Diário",
    indicators: ["Acumulação Wyckoff", "OB + Imbalance", "RSI Neutro", "Volume Crescente"],
  },
];

const Signals = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sinais de Trading</h1>
            <p className="text-muted-foreground">Oportunidades identificadas pela estratégia SMC</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
            <Button variant="outline" size="sm">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Ordenar
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">Todos ({allSignals.length})</Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent border-bullish text-bullish">
            Compra ({allSignals.filter(s => s.type === "buy").length})
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent border-bearish text-bearish">
            Venda ({allSignals.filter(s => s.type === "sell").length})
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">Score ≥7</Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">R:R ≥2.5</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {allSignals.map((signal) => (
            <SignalCard key={signal.ticker} {...signal} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Signals;
