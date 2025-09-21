import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import analysisEngine from '../services/AnalysisEngine.js';
import scoringEngine from '../services/ScoringEngine.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.jsx';
import { 
  Search,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Filter
} from 'lucide-react';

export default function WatchlistPanel({ onAssetSelect, selectedAsset }) {
  const { state, addToWatchlist, removeFromWatchlist, getAssetData } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [assetScores, setAssetScores] = useState(new Map());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newAssetSymbol, setNewAssetSymbol] = useState('');

  // Analisa ativos da watchlist
  useEffect(() => {
    const analyzeWatchlist = async () => {
      if (state.watchlist.length === 0) return;
      
      setIsAnalyzing(true);
      const scores = new Map();

      for (const symbol of state.watchlist) {
        try {
          const asset = state.assets.get(symbol);
          if (!asset) continue;

          // Obtém dados para todos os timeframes
          const timeframesData = {
            weekly: getAssetData(symbol, 'weekly'),
            daily: getAssetData(symbol, 'daily'),
            fourHour: getAssetData(symbol, 'fourHour')
          };

          // Analisa o ativo
          const analysis = await analysisEngine.analyzeAsset(symbol, timeframesData);
          
          // Calcula pontuação
          const currentPrice = asset.timeframes.daily?.data?.slice(-1)[0]?.close || 0;
          const scoring = await scoringEngine.calculateScore(symbol, analysis, currentPrice);
          
          scores.set(symbol, {
            ...scoring,
            currentPrice,
            priceChange: calculatePriceChange(asset.timeframes.daily?.data),
            volume: asset.timeframes.daily?.data?.slice(-1)[0]?.volume || 0,
            lastUpdate: Date.now()
          });
        } catch (error) {
          console.error(`Erro ao analisar ${symbol}:`, error);
        }
      }

      setAssetScores(scores);
      setIsAnalyzing(false);
    };

    analyzeWatchlist();
    
    // Atualiza a cada 30 segundos
    const interval = setInterval(analyzeWatchlist, 30000);
    return () => clearInterval(interval);
  }, [state.watchlist, state.assets]);

  // Filtra e ordena ativos
  const filteredAndSortedAssets = useMemo(() => {
    let assets = Array.from(assetScores.entries()).map(([symbol, data]) => ({
      symbol,
      ...data
    }));

    // Filtro por busca
    if (searchTerm) {
      assets = assets.filter(asset => 
        asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenação
    assets.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'score':
          aValue = a.totalScore;
          bValue = b.totalScore;
          break;
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        case 'price':
          aValue = a.currentPrice;
          bValue = b.currentPrice;
          break;
        case 'change':
          aValue = a.priceChange;
          bValue = b.priceChange;
          break;
        default:
          aValue = a.totalScore;
          bValue = b.totalScore;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return assets;
  }, [assetScores, searchTerm, sortBy, sortOrder]);

  const handleAddAsset = () => {
    if (newAssetSymbol && !state.watchlist.includes(newAssetSymbol.toUpperCase())) {
      addToWatchlist(newAssetSymbol.toUpperCase());
      setNewAssetSymbol('');
    }
  };

  const handleRemoveAsset = (symbol) => {
    removeFromWatchlist(symbol);
    if (selectedAsset === symbol) {
      onAssetSelect(null);
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Watchlist Inteligente
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Monitore oportunidades de swing trade em tempo real
          </p>
        </div>
        
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
          disabled={isAnalyzing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar ativo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Add Asset */}
            <div className="flex gap-2">
              <Input
                placeholder="Ex: PETR4"
                value={newAssetSymbol}
                onChange={(e) => setNewAssetSymbol(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddAsset()}
                className="w-32"
              />
              <Button onClick={handleAddAsset} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Watchlist Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Oportunidades ({filteredAndSortedAssets.length})</span>
            {isAnalyzing && (
              <Badge variant="secondary" className="animate-pulse">
                Analisando...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => handleSort('symbol')}
                  >
                    Ativo {sortBy === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => handleSort('score')}
                  >
                    Score {sortBy === 'score' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => handleSort('price')}
                  >
                    Preço {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => handleSort('change')}
                  >
                    Variação {sortBy === 'change' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Setup</TableHead>
                  <TableHead>Recomendação</TableHead>
                  <TableHead>R:R</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedAssets.map((asset) => (
                  <TableRow 
                    key={asset.symbol}
                    className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      selectedAsset === asset.symbol ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => onAssetSelect(asset.symbol)}
                  >
                    <TableCell className="font-medium">
                      {asset.symbol}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={asset.isValidSetup ? "default" : "secondary"}
                          className={asset.isValidSetup ? "bg-green-600" : ""}
                        >
                          {asset.totalScore}/8
                        </Badge>
                        {asset.isValidSetup && (
                          <Badge variant="outline" className="text-xs">
                            VÁLIDO
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      R$ {asset.currentPrice?.toFixed(2) || '0.00'}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {asset.priceChange > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : asset.priceChange < 0 ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <Minus className="h-4 w-4 text-slate-400" />
                        )}
                        <span className={
                          asset.priceChange > 0 ? 'text-green-600' :
                          asset.priceChange < 0 ? 'text-red-600' : 'text-slate-600'
                        }>
                          {asset.priceChange?.toFixed(2) || '0.00'}%
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {asset.setupType === 'reversal' ? 'Reversão' : 'Continuação'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant={
                          asset.recommendation?.action === 'COMPRAR' ? 'default' :
                          asset.recommendation?.action === 'VENDER' ? 'destructive' :
                          'secondary'
                        }
                        className="text-xs"
                      >
                        {asset.recommendation?.action || 'AGUARDAR'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      {asset.recommendation?.riskReward ? (
                        <span className={
                          asset.recommendation.riskReward >= 2 ? 'text-green-600' : 'text-yellow-600'
                        }>
                          1:{asset.recommendation.riskReward.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAsset(asset.symbol);
                        }}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredAndSortedAssets.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                {state.watchlist.length === 0 ? (
                  <div>
                    <p>Nenhum ativo na watchlist</p>
                    <p className="text-sm mt-1">Adicione ativos para começar a monitorar</p>
                  </div>
                ) : (
                  <p>Nenhum ativo encontrado com os filtros aplicados</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Função auxiliar para calcular variação de preço
function calculatePriceChange(data) {
  if (!data || data.length < 2) return 0;
  
  const current = data[data.length - 1].close;
  const previous = data[data.length - 2].close;
  
  return ((current - previous) / previous) * 100;
}

