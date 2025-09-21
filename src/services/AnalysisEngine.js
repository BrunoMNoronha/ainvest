import { createTechnicalIndicators, createMarketStructure, createWyckoffPattern } from '../types/index.js';

/**
 * Motor de Análise Mock para o AInvest Dashboard
 * Implementa cálculos de indicadores técnicos e identificação de padrões
 * conforme a estratégia de swing trade definida
 */
class AnalysisEngine {
  constructor() {
    this.cache = new Map(); // Cache de análises por símbolo
  }

  /**
   * Analisa um ativo completo em todos os timeframes
   */
  async analyzeAsset(symbol, timeframesData) {
    const analysis = {
      symbol,
      timeframes: {},
      wyckoffPatterns: [],
      lastAnalysis: Date.now()
    };

    // Analisa cada timeframe
    for (const [timeframe, data] of Object.entries(timeframesData)) {
      if (data && data.length > 0) {
        analysis.timeframes[timeframe] = await this.analyzeTimeframe(data, timeframe);
      }
    }

    // Identifica padrões Wyckoff cross-timeframe
    analysis.wyckoffPatterns = this.identifyWyckoffPatterns(analysis.timeframes);

    // Cache da análise
    this.cache.set(symbol, analysis);

    return analysis;
  }

  /**
   * Analisa um timeframe específico
   */
  async analyzeTimeframe(data, timeframe) {
    const indicators = this.calculateTechnicalIndicators(data);
    const structure = this.identifyMarketStructure(data, indicators);
    
    return {
      data,
      indicators,
      structure,
      timeframe,
      lastUpdate: Date.now()
    };
  }

  /**
   * Calcula indicadores técnicos
   */
  calculateTechnicalIndicators(data) {
    const indicators = createTechnicalIndicators();
    
    if (data.length < 80) return indicators; // Dados insuficientes

    // EMA 8 e 80
    indicators.ema8 = this.calculateEMA(data, 8);
    indicators.ema80 = this.calculateEMA(data, 80);

    // RSI 14
    indicators.rsi14 = this.calculateRSI(data, 14);

    // ADX 12
    indicators.adx12 = this.calculateADX(data, 12);

    // Fibonacci
    indicators.fibonacci = this.calculateFibonacci(data);

    return indicators;
  }

  /**
   * Calcula Média Móvel Exponencial (EMA)
   */
  calculateEMA(data, period) {
    if (data.length < period) return [];

    const ema = [];
    const multiplier = 2 / (period + 1);
    
    // Primeira EMA é a média simples
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i].close;
    }
    ema[period - 1] = sum / period;

    // Calcula EMA para o restante
    for (let i = period; i < data.length; i++) {
      ema[i] = (data[i].close - ema[i - 1]) * multiplier + ema[i - 1];
    }

    return ema;
  }

  /**
   * Calcula Índice de Força Relativa (RSI)
   */
  calculateRSI(data, period) {
    if (data.length < period + 1) return [];

    const rsi = [];
    let gains = 0;
    let losses = 0;

    // Calcula ganhos e perdas iniciais
    for (let i = 1; i <= period; i++) {
      const change = data[i].close - data[i - 1].close;
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    rsi[period] = 100 - (100 / (1 + avgGain / avgLoss));

    // Calcula RSI para o restante
    for (let i = period + 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      rsi[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
    }

    return rsi;
  }

  /**
   * Calcula Average Directional Index (ADX)
   */
  calculateADX(data, period) {
    if (data.length < period * 2) return [];

    const adx = [];
    const plusDI = [];
    const minusDI = [];
    const tr = [];
    const plusDM = [];
    const minusDM = [];

    // Calcula True Range e Directional Movement
    for (let i = 1; i < data.length; i++) {
      const high = data[i].high;
      const low = data[i].low;
      const prevHigh = data[i - 1].high;
      const prevLow = data[i - 1].low;
      const prevClose = data[i - 1].close;

      // True Range
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      tr[i] = Math.max(tr1, tr2, tr3);

      // Directional Movement
      const upMove = high - prevHigh;
      const downMove = prevLow - low;

      plusDM[i] = (upMove > downMove && upMove > 0) ? upMove : 0;
      minusDM[i] = (downMove > upMove && downMove > 0) ? downMove : 0;
    }

    // Calcula médias suavizadas
    for (let i = period; i < data.length; i++) {
      let sumTR = 0;
      let sumPlusDM = 0;
      let sumMinusDM = 0;

      for (let j = i - period + 1; j <= i; j++) {
        sumTR += tr[j] || 0;
        sumPlusDM += plusDM[j] || 0;
        sumMinusDM += minusDM[j] || 0;
      }

      const avgTR = sumTR / period;
      plusDI[i] = avgTR > 0 ? (sumPlusDM / period / avgTR) * 100 : 0;
      minusDI[i] = avgTR > 0 ? (sumMinusDM / period / avgTR) * 100 : 0;

      // ADX
      const dx = Math.abs(plusDI[i] - minusDI[i]) / (plusDI[i] + minusDI[i]) * 100;
      
      if (i === period) {
        adx[i] = dx;
      } else {
        adx[i] = (adx[i - 1] * (period - 1) + dx) / period;
      }
    }

    return adx;
  }

  /**
   * Calcula níveis de Fibonacci
   */
  calculateFibonacci(data) {
    if (data.length < 20) return { levels: [], trend: null };

    // Encontra swing high e swing low recentes
    const recentData = data.slice(-50); // Últimos 50 candles
    let swingHigh = { price: -Infinity, index: -1 };
    let swingLow = { price: Infinity, index: -1 };

    recentData.forEach((candle, index) => {
      if (candle.high > swingHigh.price) {
        swingHigh = { price: candle.high, index };
      }
      if (candle.low < swingLow.price) {
        swingLow = { price: candle.low, index };
      }
    });

    const trend = swingHigh.index > swingLow.index ? 'bullish' : 'bearish';
    const range = Math.abs(swingHigh.price - swingLow.price);
    
    const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const levels = fibLevels.map(level => {
      if (trend === 'bullish') {
        return {
          level,
          price: swingLow.price + (range * level),
          type: level < 0.5 ? 'discount' : level > 0.5 ? 'premium' : 'equilibrium'
        };
      } else {
        return {
          level,
          price: swingHigh.price - (range * level),
          type: level < 0.5 ? 'premium' : level > 0.5 ? 'discount' : 'equilibrium'
        };
      }
    });

    return { levels, trend };
  }

  /**
   * Identifica estrutura de mercado (BoS, ChoCh, OBs, FVGs)
   */
  identifyMarketStructure(data, indicators) {
    const structure = createMarketStructure();
    
    if (data.length < 20) return structure;

    // Identifica topos e fundos
    const swings = this.identifySwingPoints(data);
    
    // Identifica BoS e ChoCh
    structure.bos = this.identifyBreakOfStructure(swings, data);
    structure.choch = this.identifyChangeOfCharacter(swings, data);
    
    // Identifica Order Blocks
    structure.orderBlocks = this.identifyOrderBlocks(data, structure.bos.concat(structure.choch));
    
    // Identifica Fair Value Gaps
    structure.fvgs = this.identifyFairValueGaps(data);
    
    // Identifica zonas de liquidez
    structure.liquidityZones = this.identifyLiquidityZones(swings);
    
    // Identifica linhas de tendência
    structure.trendLines = this.identifyTrendLines(swings);

    return structure;
  }

  /**
   * Identifica pontos de swing (topos e fundos)
   */
  identifySwingPoints(data, lookback = 5) {
    const swings = [];
    
    for (let i = lookback; i < data.length - lookback; i++) {
      let isSwingHigh = true;
      let isSwingLow = true;
      
      // Verifica se é swing high
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && data[j].high >= data[i].high) {
          isSwingHigh = false;
          break;
        }
      }
      
      // Verifica se é swing low
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && data[j].low <= data[i].low) {
          isSwingLow = false;
          break;
        }
      }
      
      if (isSwingHigh) {
        swings.push({
          type: 'high',
          index: i,
          price: data[i].high,
          timestamp: data[i].timestamp
        });
      }
      
      if (isSwingLow) {
        swings.push({
          type: 'low',
          index: i,
          price: data[i].low,
          timestamp: data[i].timestamp
        });
      }
    }
    
    return swings.sort((a, b) => a.index - b.index);
  }

  /**
   * Identifica Break of Structure (BoS)
   */
  identifyBreakOfStructure(swings, data) {
    const bos = [];
    
    for (let i = 1; i < swings.length; i++) {
      const currentSwing = swings[i];
      const prevSwing = swings[i - 1];
      
      if (currentSwing.type === prevSwing.type) continue;
      
      // BoS bullish: preço rompe acima do swing high anterior
      if (currentSwing.type === 'high' && currentSwing.price > prevSwing.price) {
        bos.push({
          type: 'bullish',
          breakLevel: prevSwing.price,
          confirmationIndex: currentSwing.index,
          timestamp: currentSwing.timestamp,
          strength: this.calculateBreakStrength(data, currentSwing.index, prevSwing.price)
        });
      }
      
      // BoS bearish: preço rompe abaixo do swing low anterior
      if (currentSwing.type === 'low' && currentSwing.price < prevSwing.price) {
        bos.push({
          type: 'bearish',
          breakLevel: prevSwing.price,
          confirmationIndex: currentSwing.index,
          timestamp: currentSwing.timestamp,
          strength: this.calculateBreakStrength(data, currentSwing.index, prevSwing.price)
        });
      }
    }
    
    return bos;
  }

  /**
   * Identifica Change of Character (ChoCh)
   */
  identifyChangeOfCharacter(swings, data) {
    const choch = [];
    
    // Identifica mudanças na estrutura de topos e fundos
    for (let i = 2; i < swings.length; i++) {
      const current = swings[i];
      const prev = swings[i - 1];
      const prevPrev = swings[i - 2];
      
      // ChoCh de bullish para bearish
      if (prevPrev.type === 'low' && prev.type === 'high' && current.type === 'low') {
        if (current.price < prevPrev.price) {
          choch.push({
            type: 'bearish',
            fromTrend: 'bullish',
            toTrend: 'bearish',
            triggerLevel: prev.price,
            confirmationIndex: current.index,
            timestamp: current.timestamp
          });
        }
      }
      
      // ChoCh de bearish para bullish
      if (prevPrev.type === 'high' && prev.type === 'low' && current.type === 'high') {
        if (current.price > prevPrev.price) {
          choch.push({
            type: 'bullish',
            fromTrend: 'bearish',
            toTrend: 'bullish',
            triggerLevel: prev.price,
            confirmationIndex: current.index,
            timestamp: current.timestamp
          });
        }
      }
    }
    
    return choch;
  }

  /**
   * Identifica Order Blocks
   */
  identifyOrderBlocks(data, structureBreaks) {
    const orderBlocks = [];
    
    structureBreaks.forEach(breakEvent => {
      const breakIndex = breakEvent.confirmationIndex;
      
      // Procura por candle de impulso antes do break
      for (let i = Math.max(0, breakIndex - 10); i < breakIndex; i++) {
        const candle = data[i];
        const nextCandle = data[i + 1];
        
        if (!nextCandle) continue;
        
        // Identifica candle de impulso (grande movimento)
        const bodySize = Math.abs(candle.close - candle.open);
        const candleRange = candle.high - candle.low;
        const impulseRatio = bodySize / candleRange;
        
        if (impulseRatio > 0.7 && candleRange > 0) {
          // Verifica se há gap para o próximo candle
          const hasGap = breakEvent.type === 'bullish' ? 
            nextCandle.low > candle.high :
            nextCandle.high < candle.low;
          
          if (hasGap || Math.abs(nextCandle.open - candle.close) / candle.close > 0.005) {
            orderBlocks.push({
              type: breakEvent.type,
              high: candle.high,
              low: candle.low,
              open: candle.open,
              close: candle.close,
              index: i,
              timestamp: candle.timestamp,
              relatedBreak: breakEvent,
              strength: this.calculateOrderBlockStrength(data, i, breakEvent)
            });
          }
        }
      }
    });
    
    return orderBlocks;
  }

  /**
   * Identifica Fair Value Gaps (FVGs)
   */
  identifyFairValueGaps(data) {
    const fvgs = [];
    
    for (let i = 1; i < data.length - 1; i++) {
      const prev = data[i - 1];
      const current = data[i];
      const next = data[i + 1];
      
      // FVG bullish: gap entre low do candle anterior e high do próximo
      if (prev.high < next.low) {
        fvgs.push({
          type: 'bullish',
          top: next.low,
          bottom: prev.high,
          index: i,
          timestamp: current.timestamp,
          filled: false
        });
      }
      
      // FVG bearish: gap entre high do candle anterior e low do próximo
      if (prev.low > next.high) {
        fvgs.push({
          type: 'bearish',
          top: prev.low,
          bottom: next.high,
          index: i,
          timestamp: current.timestamp,
          filled: false
        });
      }
    }
    
    return fvgs;
  }

  /**
   * Identifica zonas de liquidez
   */
  identifyLiquidityZones(swings) {
    const zones = { above: [], below: [] };
    
    // Agrupa swings próximos para formar zonas de liquidez
    const highs = swings.filter(s => s.type === 'high').sort((a, b) => b.price - a.price);
    const lows = swings.filter(s => s.type === 'low').sort((a, b) => a.price - b.price);
    
    // Zonas acima (resistências)
    for (let i = 0; i < Math.min(highs.length, 5); i++) {
      const high = highs[i];
      const nearbyHighs = highs.filter(h => 
        Math.abs(h.price - high.price) / high.price < 0.02 && h.index !== high.index
      );
      
      if (nearbyHighs.length > 0) {
        zones.above.push({
          level: high.price,
          strength: nearbyHighs.length + 1,
          touches: [high, ...nearbyHighs],
          type: 'resistance'
        });
      }
    }
    
    // Zonas abaixo (suportes)
    for (let i = 0; i < Math.min(lows.length, 5); i++) {
      const low = lows[i];
      const nearbyLows = lows.filter(l => 
        Math.abs(l.price - low.price) / low.price < 0.02 && l.index !== low.index
      );
      
      if (nearbyLows.length > 0) {
        zones.below.push({
          level: low.price,
          strength: nearbyLows.length + 1,
          touches: [low, ...nearbyLows],
          type: 'support'
        });
      }
    }
    
    return zones;
  }

  /**
   * Identifica linhas de tendência
   */
  identifyTrendLines(swings) {
    const trendLines = [];
    
    const highs = swings.filter(s => s.type === 'high');
    const lows = swings.filter(s => s.type === 'low');
    
    // Linha de tendência de alta (conecta lows)
    if (lows.length >= 2) {
      for (let i = 0; i < lows.length - 1; i++) {
        for (let j = i + 1; j < lows.length; j++) {
          const low1 = lows[i];
          const low2 = lows[j];
          
          if (low2.price > low1.price) { // Tendência de alta
            const slope = (low2.price - low1.price) / (low2.index - low1.index);
            
            trendLines.push({
              type: 'support',
              point1: low1,
              point2: low2,
              slope,
              equation: { a: slope, b: low1.price - slope * low1.index }
            });
          }
        }
      }
    }
    
    // Linha de tendência de baixa (conecta highs)
    if (highs.length >= 2) {
      for (let i = 0; i < highs.length - 1; i++) {
        for (let j = i + 1; j < highs.length; j++) {
          const high1 = highs[i];
          const high2 = highs[j];
          
          if (high2.price < high1.price) { // Tendência de baixa
            const slope = (high2.price - high1.price) / (high2.index - high1.index);
            
            trendLines.push({
              type: 'resistance',
              point1: high1,
              point2: high2,
              slope,
              equation: { a: slope, b: high1.price - slope * high1.index }
            });
          }
        }
      }
    }
    
    return trendLines.slice(0, 10); // Limita a 10 linhas mais relevantes
  }

  /**
   * Identifica padrões Wyckoff
   */
  identifyWyckoffPatterns(timeframes) {
    const patterns = [];
    
    // Analisa principalmente o timeframe diário
    const dailyAnalysis = timeframes.daily;
    if (!dailyAnalysis || !dailyAnalysis.data) return patterns;
    
    const data = dailyAnalysis.data;
    const volume = data.map(d => d.volume);
    const avgVolume = volume.slice(-20).reduce((a, b) => a + b, 0) / 20;
    
    // Identifica Springs (falsos rompimentos de suporte)
    const springs = this.identifySpringPattern(data, avgVolume);
    patterns.push(...springs);
    
    // Identifica UTADs (Up Thrust After Distribution)
    const utads = this.identifyUTADPattern(data, avgVolume);
    patterns.push(...utads);
    
    // Identifica fases de acumulação/distribuição
    const phases = this.identifyAccumulationDistribution(data, avgVolume);
    patterns.push(...phases);
    
    return patterns;
  }

  /**
   * Identifica padrão Spring
   */
  identifySpringPattern(data, avgVolume) {
    const springs = [];
    
    for (let i = 10; i < data.length - 5; i++) {
      const current = data[i];
      const prev = data[i - 1];
      
      // Procura por rompimento de suporte com volume baixo
      if (current.low < prev.low && current.volume < avgVolume * 0.8) {
        // Verifica recuperação rápida
        let hasRecovery = false;
        for (let j = i + 1; j <= Math.min(i + 3, data.length - 1); j++) {
          if (data[j].close > prev.low) {
            hasRecovery = true;
            break;
          }
        }
        
        if (hasRecovery) {
          springs.push(createWyckoffPattern('spring', 75, current.volume));
        }
      }
    }
    
    return springs;
  }

  /**
   * Identifica padrão UTAD
   */
  identifyUTADPattern(data, avgVolume) {
    const utads = [];
    
    for (let i = 10; i < data.length - 5; i++) {
      const current = data[i];
      const prev = data[i - 1];
      
      // Procura por rompimento de resistência com volume baixo
      if (current.high > prev.high && current.volume < avgVolume * 0.8) {
        // Verifica rejeição rápida
        let hasRejection = false;
        for (let j = i + 1; j <= Math.min(i + 3, data.length - 1); j++) {
          if (data[j].close < prev.high) {
            hasRejection = true;
            break;
          }
        }
        
        if (hasRejection) {
          utads.push(createWyckoffPattern('utad', 75, current.volume));
        }
      }
    }
    
    return utads;
  }

  /**
   * Identifica fases de acumulação/distribuição
   */
  identifyAccumulationDistribution(data, avgVolume) {
    const phases = [];
    
    // Analisa períodos de consolidação com volume
    for (let i = 20; i < data.length - 20; i++) {
      const period = data.slice(i - 10, i + 10);
      const priceRange = Math.max(...period.map(d => d.high)) - Math.min(...period.map(d => d.low));
      const avgPrice = period.reduce((sum, d) => sum + d.close, 0) / period.length;
      const relativeRange = priceRange / avgPrice;
      
      // Consolidação (range pequeno)
      if (relativeRange < 0.05) {
        const totalVolume = period.reduce((sum, d) => sum + d.volume, 0);
        const avgPeriodVolume = totalVolume / period.length;
        
        if (avgPeriodVolume > avgVolume * 1.2) {
          // Alto volume em consolidação sugere acumulação/distribuição
          const trend = this.determineTrendDirection(data.slice(0, i));
          const phaseType = trend === 'bullish' ? 'distribution' : 'accumulation';
          
          phases.push(createWyckoffPattern(phaseType, 60, avgPeriodVolume));
        }
      }
    }
    
    return phases;
  }

  /**
   * Funções auxiliares
   */
  calculateBreakStrength(data, index, level) {
    const candle = data[index];
    const volumeRatio = candle.volume / (data.slice(Math.max(0, index - 20), index).reduce((sum, d) => sum + d.volume, 0) / 20);
    const priceDistance = Math.abs(candle.close - level) / level;
    
    return Math.min(100, (volumeRatio * 30) + (priceDistance * 1000));
  }

  calculateOrderBlockStrength(data, index, breakEvent) {
    const candle = data[index];
    const bodySize = Math.abs(candle.close - candle.open);
    const candleRange = candle.high - candle.low;
    const volumeRatio = candle.volume / (data.slice(Math.max(0, index - 10), index).reduce((sum, d) => sum + d.volume, 0) / 10);
    
    return Math.min(100, (bodySize / candleRange * 50) + (volumeRatio * 25) + (breakEvent.strength * 0.25));
  }

  determineTrendDirection(data) {
    if (data.length < 20) return 'neutral';
    
    const recent = data.slice(-20);
    const firstPrice = recent[0].close;
    const lastPrice = recent[recent.length - 1].close;
    
    const change = (lastPrice - firstPrice) / firstPrice;
    
    if (change > 0.05) return 'bullish';
    if (change < -0.05) return 'bearish';
    return 'neutral';
  }

  /**
   * Obtém análise em cache
   */
  getCachedAnalysis(symbol) {
    return this.cache.get(symbol);
  }

  /**
   * Limpa cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
const analysisEngine = new AnalysisEngine();

export default analysisEngine;

