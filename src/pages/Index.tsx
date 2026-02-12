import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SignalCard } from "@/components/dashboard/SignalCard";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { MarketOverview } from "@/components/dashboard/MarketOverview";
import { TechnicalIndicators } from "@/components/dashboard/TechnicalIndicators";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { WatchList } from "@/components/dashboard/WatchList";
import { MarketDisclaimer } from "@/components/dashboard/MarketDisclaimer";
import { useQuotes, formatRelativeTime } from "@/hooks/useMarketData";
import { BarChart3, TrendingUp, Clock, Wallet } from "lucide-react";
import { useMemo } from "react";

// Mesma watchlist do WatchList.tsx
const WATCHLIST_TICKERS = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'MGLU3', 'WEGE3'];

// Sinais SMC permanecem mockados (motor de análise em escopo futuro)
const mockSignals = [
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
];

const Index = () => {
  const { data: quotes, isLoading } = useQuotes(WATCHLIST_TICKERS);

  // Calcular stats dinâmicos a partir das cotações reais
  const stats = useMemo(() => {
    if (!quotes || quotes.length === 0) {
      return {
        totalAtivos: '—',
        avgChange: 0,
        avgChangeTrend: 'neutral' as const,
        lastUpdate: '—',
        totalVolume: '—',
      };
    }

    const totalAtivos = quotes.length;
    const avgChange = quotes.reduce((sum, q) => sum + (q.changePercent ?? 0), 0) / quotes.length;
    const avgChangeTrend = avgChange > 0.5 ? 'up' as const : avgChange < -0.5 ? 'down' as const : 'neutral' as const;

    // Última atualização (timestamp mais recente)
    const timestamps = quotes.map(q => q.updatedAt).filter(Boolean);
    const lastUpdate = timestamps.length > 0
      ? formatRelativeTime(timestamps.sort().reverse()[0])
      : '—';

    // Volume total formatado
    const totalVol = quotes.reduce((sum, q) => sum + (q.volume || 0), 0);
    const totalVolume = totalVol >= 1_000_000_000
      ? `${(totalVol / 1_000_000_000).toFixed(1)}B`
      : totalVol >= 1_000_000
        ? `${(totalVol / 1_000_000).toFixed(0)}M`
        : totalVol.toLocaleString('pt-BR');

    return { totalAtivos: totalAtivos.toString(), avgChange, avgChangeTrend, lastUpdate, totalVolume };
  }, [quotes]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do mercado e sinais de trading</p>
        </div>

        {/* Stats Grid — dados calculados da watchlist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Ativos Monitorados"
            value={isLoading ? '...' : stats.totalAtivos}
            icon={<BarChart3 className="h-6 w-6" />}
            trend="neutral"
          />
          <StatsCard
            title="Variação Média"
            value={isLoading ? '...' : `${stats.avgChange > 0 ? '+' : ''}${stats.avgChange.toFixed(2)}%`}
            change={isLoading ? undefined : Math.round(stats.avgChange * 100) / 100}
            trend={stats.avgChangeTrend}
            icon={<TrendingUp className="h-6 w-6" />}
          />
          <StatsCard
            title="Última Atualização"
            value={isLoading ? '...' : stats.lastUpdate}
            trend="neutral"
            icon={<Clock className="h-6 w-6" />}
          />
          <StatsCard
            title="Volume Total"
            value={isLoading ? '...' : stats.totalVolume}
            trend="neutral"
            icon={<Wallet className="h-6 w-6" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Chart & Signals */}
          <div className="xl:col-span-2 space-y-6">
            <PriceChart />
            
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Sinais de Trading</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {mockSignals.map((signal) => (
                  <SignalCard key={signal.ticker} {...signal} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar Content */}
          <div className="space-y-6">
            <MarketOverview />
            <TechnicalIndicators />
            <AlertsList />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WatchList />
        </div>

        {/* Legal Disclaimer */}
        <MarketDisclaimer />
      </div>
    </DashboardLayout>
  );
};

export default Index;
