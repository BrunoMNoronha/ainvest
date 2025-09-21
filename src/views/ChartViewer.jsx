import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { 
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  Zap
} from 'lucide-react';

export default function ChartViewer({ asset }) {
  const { getAssetData } = useApp();
  const [activeTimeframe, setActiveTimeframe] = useState('daily');
  const [showIndicators, setShowIndicators] = useState({
    ema8: true,
    ema80: true,
    rsi: false,
    volume: true
  });

  const chartData = useMemo(() => {
    const data = getAssetData(asset, activeTimeframe);
    if (!data || data.length === 0) return [];

    return data.slice(-50).map((candle, index) => ({
      index,
      timestamp: candle.timestamp,
      date: new Date(candle.timestamp).toLocaleDateString('pt-BR'),
      time: new Date(candle.timestamp).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
      // Simulação de indicadores
      ema8: candle.close * (0.98 + Math.random() * 0.04),
      ema80: candle.close * (0.95 + Math.random() * 0.1),
      rsi: 30 + Math.random() * 40
    }));
  }, [asset, activeTimeframe, getAssetData]);

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].close : 0;
  const priceChange = chartData.length > 1 ? 
    ((chartData[chartData.length - 1].close - chartData[chartData.length - 2].close) / chartData[chartData.length - 2].close) * 100 : 0;

  // Simulação de níveis técnicos
  const technicalLevels = useMemo(() => {
    if (chartData.length === 0) return {};

    const prices = chartData.map(d => d.close);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const range = high - low;

    return {
      resistance: high - range * 0.1,
      support: low + range * 0.1,
      fibonacci: {
        '23.6%': low + range * 0.236,
        '38.2%': low + range * 0.382,
        '50%': low + range * 0.5,
        '61.8%': low + range * 0.618
      }
    };
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{data.date} {data.time}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm">
              <span className="text-slate-600 dark:text-slate-400">Abertura:</span> 
              <span className="ml-2 font-medium">R$ {data.open?.toFixed(2)}</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-600 dark:text-slate-400">Máxima:</span> 
              <span className="ml-2 font-medium text-green-600">R$ {data.high?.toFixed(2)}</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-600 dark:text-slate-400">Mínima:</span> 
              <span className="ml-2 font-medium text-red-600">R$ {data.low?.toFixed(2)}</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-600 dark:text-slate-400">Fechamento:</span> 
              <span className="ml-2 font-medium">R$ {data.close?.toFixed(2)}</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-600 dark:text-slate-400">Volume:</span> 
              <span className="ml-2 font-medium">{(data.volume / 1000000).toFixed(1)}M</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {asset}
          </h3>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-2xl font-bold">
              R$ {currentPrice.toFixed(2)}
            </span>
            <div className="flex items-center gap-1">
              {priceChange > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={priceChange > 0 ? 'text-green-600' : 'text-red-600'}>
                {priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Timeframe Selector */}
        <Tabs value={activeTimeframe} onValueChange={setActiveTimeframe}>
          <TabsList>
            <TabsTrigger value="weekly" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              Semanal
            </TabsTrigger>
            <TabsTrigger value="daily" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              Diário
            </TabsTrigger>
            <TabsTrigger value="fourHour" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              4H
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Gráfico de Preços</CardTitle>
            
            {/* Indicator Toggles */}
            <div className="flex gap-2">
              <Button
                variant={showIndicators.ema8 ? "default" : "outline"}
                size="sm"
                onClick={() => setShowIndicators(prev => ({ ...prev, ema8: !prev.ema8 }))}
              >
                EMA 8
              </Button>
              <Button
                variant={showIndicators.ema80 ? "default" : "outline"}
                size="sm"
                onClick={() => setShowIndicators(prev => ({ ...prev, ema80: !prev.ema80 }))}
              >
                EMA 80
              </Button>
              <Button
                variant={showIndicators.volume ? "default" : "outline"}
                size="sm"
                onClick={() => setShowIndicators(prev => ({ ...prev, volume: !prev.volume }))}
              >
                Volume
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `R$ ${value.toFixed(2)}`}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Price Line */}
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  name="Preço"
                />
                
                {/* EMA Lines */}
                {showIndicators.ema8 && (
                  <Line
                    type="monotone"
                    dataKey="ema8"
                    stroke="#10b981"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    name="EMA 8"
                  />
                )}
                
                {showIndicators.ema80 && (
                  <Line
                    type="monotone"
                    dataKey="ema80"
                    stroke="#f59e0b"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    name="EMA 80"
                  />
                )}
                
                {/* Technical Levels */}
                <ReferenceLine 
                  y={technicalLevels.resistance} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3"
                  label={{ value: "Resistência", position: "topRight" }}
                />
                <ReferenceLine 
                  y={technicalLevels.support} 
                  stroke="#10b981" 
                  strokeDasharray="3 3"
                  label={{ value: "Suporte", position: "bottomRight" }}
                />
                
                {/* Fibonacci Levels */}
                {Object.entries(technicalLevels.fibonacci || {}).map(([level, price]) => (
                  <ReferenceLine
                    key={level}
                    y={price}
                    stroke="#8b5cf6"
                    strokeDasharray="1 3"
                    strokeOpacity={0.6}
                    label={{ value: `Fib ${level}`, position: "right", fontSize: 10 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Technical Analysis Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Próximo Alvo</p>
                <p className="font-semibold">R$ {technicalLevels.resistance?.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Suporte</p>
                <p className="font-semibold">R$ {technicalLevels.support?.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Zap className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Volatilidade</p>
                <p className="font-semibold">
                  {chartData.length > 0 ? 
                    (((Math.max(...chartData.map(d => d.high)) - Math.min(...chartData.map(d => d.low))) / currentPrice) * 100).toFixed(1) + '%' :
                    '0%'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Blocks and FVGs Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estruturas Identificadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-3">Order Blocks</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span className="text-sm">OB Bullish</span>
                  <Badge variant="outline" className="text-xs">R$ {(currentPrice * 0.98).toFixed(2)}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <span className="text-sm">OB Bearish</span>
                  <Badge variant="outline" className="text-xs">R$ {(currentPrice * 1.02).toFixed(2)}</Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Fair Value Gaps</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <span className="text-sm">FVG Não Preenchido</span>
                  <Badge variant="outline" className="text-xs">R$ {(currentPrice * 0.99).toFixed(2)}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                  <span className="text-sm text-slate-500">FVG Preenchido</span>
                  <Badge variant="secondary" className="text-xs">R$ {(currentPrice * 1.01).toFixed(2)}</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

