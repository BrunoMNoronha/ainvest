import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import scoringEngine from '../services/ScoringEngine.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import { 
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  Info
} from 'lucide-react';

export default function AnalysisChecklist({ asset }) {
  const { getAsset } = useApp();
  const [scoring, setScoring] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAnalysis = async () => {
      if (!asset) return;
      
      setLoading(true);
      try {
        // Obtém análise em cache ou calcula nova
        const cachedScore = scoringEngine.getCachedScore(asset);
        if (cachedScore) {
          setScoring(cachedScore);
        }
      } catch (error) {
        console.error('Erro ao carregar análise:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [asset]);

  if (!asset) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Selecione um ativo na watchlist para ver a análise
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading || !scoring) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise - {asset}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const criteriaList = [
    {
      key: 'bosChoch',
      label: 'BoS/ChoCh Diário',
      description: 'Quebra de estrutura ou mudança de caráter confirmada',
      maxPoints: 2
    },
    {
      key: 'obFvg',
      label: 'Order Block + FVG',
      description: 'Preço tocando Order Block válido com Fair Value Gap',
      maxPoints: 2
    },
    {
      key: 'wyckoff',
      label: 'Wyckoff + Volume',
      description: 'Padrão Wyckoff válido com confirmação de volume',
      maxPoints: 2
    },
    {
      key: 'ema80Trend',
      label: 'Tendência EMA 80 Semanal',
      description: 'Tendência da EMA 80 semanal alinhada com setup',
      maxPoints: 1
    },
    {
      key: 'rsiDivergence',
      label: 'RSI Divergência/Extremo',
      description: 'RSI em divergência ou sobrecompra/sobrevenda (ADX < 30)',
      maxPoints: 1
    },
    {
      key: 'fibonacciRR',
      label: 'Região Fibonacci R:R ≥ 2',
      description: 'Posição em nível Fibonacci com risco-retorno favorável',
      maxPoints: 1
    },
    {
      key: 'adxStrength',
      label: 'ADX > 22 (Continuação)',
      description: 'Força de tendência confirmada pelo ADX (apenas continuação)',
      maxPoints: 1
    }
  ];

  const totalScore = scoring.totalScore;
  const maxScore = 8;
  const scorePercentage = (totalScore / maxScore) * 100;

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Análise - {asset}</span>
            <Badge 
              variant={scoring.isValidSetup ? "default" : "secondary"}
              className={scoring.isValidSetup ? "bg-green-600" : ""}
            >
              {totalScore}/{maxScore}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Score Total</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {totalScore} de {maxScore} pontos
              </span>
            </div>
            <Progress value={scorePercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-xs text-slate-600 dark:text-slate-400">Tipo de Setup</p>
              <p className="font-semibold capitalize">
                {scoring.setupType === 'reversal' ? 'Reversão' : 'Continuação'}
              </p>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-xs text-slate-600 dark:text-slate-400">Confiança</p>
              <p className="font-semibold">
                {scoring.recommendation?.confidence?.toFixed(0) || 0}%
              </p>
            </div>
          </div>

          {scoring.isValidSetup && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Setup Válido para Entrada
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Score ≥ 6 pontos atingido. Critérios mínimos atendidos para operação.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Criteria Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist da Estratégia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {criteriaList.map((criterion) => {
            const criterionData = scoring.scoring[criterion.key];
            const isActive = criterionData?.active || false;
            const points = criterionData?.points || 0;
            const details = criterionData?.details || '';

            return (
              <div 
                key={criterion.key}
                className={`p-4 border rounded-lg transition-colors ${
                  isActive 
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">
                      {points > 0 ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{criterion.label}</h4>
                        <Badge variant="outline" className="text-xs">
                          {points}/{criterion.maxPoints}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {criterion.description}
                      </p>
                      
                      {details && (
                        <div className="text-sm p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded">
                          <div className="flex items-start gap-2">
                            <Info className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700 dark:text-slate-300">
                              {details}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Recommendation */}
      {scoring.recommendation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {scoring.recommendation.action === 'COMPRAR' ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : scoring.recommendation.action === 'VENDER' ? (
                <TrendingDown className="h-5 w-5 text-red-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              Recomendação Final
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 border rounded-lg">
              <Badge 
                variant={
                  scoring.recommendation.action === 'COMPRAR' ? 'default' :
                  scoring.recommendation.action === 'VENDER' ? 'destructive' :
                  'secondary'
                }
                className="text-lg px-4 py-2"
              >
                {scoring.recommendation.action}
              </Badge>
            </div>

            {scoring.recommendation.action !== 'AGUARDAR' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <span className="text-sm font-medium">Entrada</span>
                    <span className="font-semibold">
                      R$ {scoring.recommendation.entryPrice?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Stop Loss</span>
                    </div>
                    <span className="font-semibold">
                      R$ {scoring.recommendation.stopLoss?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">TP1</span>
                    </div>
                    <span className="font-semibold">
                      R$ {scoring.recommendation.targets?.tp1?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">TP2</span>
                    </div>
                    <span className="font-semibold">
                      R$ {scoring.recommendation.targets?.tp2?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {scoring.recommendation.riskReward && (
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-1">
                  Risco : Retorno
                </p>
                <p className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                  1 : {scoring.recommendation.riskReward.toFixed(1)}
                </p>
              </div>
            )}

            {scoring.recommendation.reasoning && scoring.recommendation.reasoning.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Justificativa</h4>
                <div className="space-y-2">
                  {scoring.recommendation.reasoning.map((reason, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-slate-700 dark:text-slate-300">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Last Update */}
      <div className="text-center text-xs text-slate-500">
        Última atualização: {new Date(scoring.lastUpdate).toLocaleString('pt-BR')}
      </div>
    </div>
  );
}

