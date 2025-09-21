import { createScoringCriteria } from '../types/index.js';

/**
 * Sistema de Pontuação Mock para o AInvest Dashboard
 * Implementa os critérios de pontuação definidos na estratégia de swing trade
 * 
 * Critérios de Pontuação:
 * - BoS/ChoCh diário: +2 pontos
 * - Preço toca OB + FVG: +2 pontos  
 * - Wyckoff válido + volume confirmado: +2 pontos
 * - Tendência MME 80 semanal alinhada: +1 ponto (bônus direcional)
 * - RSI 14 divergente ou sobrecompra/venda (se ADX < 30): +1 ponto
 * - Região Fib que entrega R:R ≥ 2: +1 ponto
 * - ADX > 22 (apenas módulo continuação): +1 ponto
 * 
 * Score mínimo para entrada: ≥ 6 pontos
 */
class ScoringEngine {
  constructor() {
    this.cache = new Map(); // Cache de pontuações por símbolo
    this.criteriaWeights = {
      bosChoch: 2,
      obFvg: 2,
      wyckoff: 2,
      ema80Trend: 1,
      rsiDivergence: 1,
      fibonacciRR: 1,
      adxStrength: 1
    };
  }

  /**
   * Calcula pontuação completa para um ativo
   */
  async calculateScore(symbol, analysis, currentPrice) {
    const scoring = createScoringCriteria();
    let totalScore = 0;
    let setupType = 'reversal'; // 'reversal' ou 'continuation'

    // Determina tipo de setup baseado na estrutura
    setupType = this.determineSetupType(analysis);

    // 1. BoS/ChoCh diário (+2 pontos)
    const bosChochScore = this.evaluateBosChoch(analysis.timeframes.daily, currentPrice);
    scoring.bosChoch = bosChochScore;
    totalScore += bosChochScore.points;

    // 2. Preço toca OB + FVG (+2 pontos)
    const obFvgScore = this.evaluateObFvg(analysis.timeframes.daily, currentPrice);
    scoring.obFvg = obFvgScore;
    totalScore += obFvgScore.points;

    // 3. Wyckoff válido + volume confirmado (+2 pontos)
    const wyckoffScore = this.evaluateWyckoff(analysis.wyckoffPatterns, analysis.timeframes.daily);
    scoring.wyckoff = wyckoffScore;
    totalScore += wyckoffScore.points;

    // 4. Tendência MME 80 semanal alinhada (+1 ponto bônus)
    const ema80Score = this.evaluateEma80Trend(analysis.timeframes.weekly, setupType);
    scoring.ema80Trend = ema80Score;
    totalScore += ema80Score.points;

    // 5. RSI 14 divergente ou sobrecompra/venda (+1 ponto se ADX < 30)
    const rsiScore = this.evaluateRsiConditions(analysis.timeframes.daily, setupType);
    scoring.rsiDivergence = rsiScore;
    totalScore += rsiScore.points;

    // 6. Região Fib que entrega R:R ≥ 2 (+1 ponto)
    const fibScore = this.evaluateFibonacciRR(analysis.timeframes.daily, currentPrice);
    scoring.fibonacciRR = fibScore;
    totalScore += fibScore.points;

    // 7. ADX > 22 (apenas para continuação, +1 ponto)
    const adxScore = this.evaluateAdxStrength(analysis.timeframes.daily, setupType);
    scoring.adxStrength = adxScore;
    totalScore += adxScore.points;

    // Calcula recomendação e alvos
    const recommendation = this.generateRecommendation(scoring, totalScore, setupType, analysis, currentPrice);

    const result = {
      symbol,
      scoring,
      totalScore,
      setupType,
      recommendation,
      lastUpdate: Date.now(),
      isValidSetup: totalScore >= 6
    };

    // Cache do resultado
    this.cache.set(symbol, result);

    return result;
  }

  /**
   * Determina o tipo de setup (reversão ou continuação)
   */
  determineSetupType(analysis) {
    const dailyStructure = analysis.timeframes.daily?.structure;
    if (!dailyStructure) return 'reversal';

    // Se há BoS recente, é continuação
    const recentBos = dailyStructure.bos.filter(bos => 
      Date.now() - bos.timestamp < 7 * 24 * 60 * 60 * 1000 // Últimos 7 dias
    );

    // Se há ChoCh recente, é reversão
    const recentChoch = dailyStructure.choch.filter(choch => 
      Date.now() - choch.timestamp < 7 * 24 * 60 * 60 * 1000
    );

    if (recentBos.length > recentChoch.length) {
      return 'continuation';
    }

    return 'reversal';
  }

  /**
   * Avalia critério BoS/ChoCh diário
   */
  evaluateBosChoch(dailyTimeframe, currentPrice) {
    const result = { points: 0, maxPoints: 2, active: false, details: '' };

    if (!dailyTimeframe?.structure) {
      result.details = 'Dados insuficientes para análise de estrutura';
      return result;
    }

    const { bos, choch } = dailyTimeframe.structure;
    const recentEvents = [...bos, ...choch].filter(event => 
      Date.now() - event.timestamp < 5 * 24 * 60 * 60 * 1000 // Últimos 5 dias
    );

    if (recentEvents.length > 0) {
      const latestEvent = recentEvents.sort((a, b) => b.timestamp - a.timestamp)[0];
      
      // Verifica se o preço está próximo do nível de break
      const priceDistance = Math.abs(currentPrice - latestEvent.breakLevel) / latestEvent.breakLevel;
      
      if (priceDistance < 0.02) { // Dentro de 2% do nível
        result.points = 2;
        result.active = true;
        result.details = `${latestEvent.type === 'bullish' ? 'BoS' : 'ChoCh'} ${latestEvent.type} confirmado em ${new Date(latestEvent.timestamp).toLocaleDateString()}`;
      } else {
        result.points = 1;
        result.active = true;
        result.details = `Estrutura ${latestEvent.type} identificada, mas preço distante do nível`;
      }
    } else {
      result.details = 'Nenhuma quebra de estrutura recente identificada';
    }

    return result;
  }

  /**
   * Avalia critério Order Block + FVG
   */
  evaluateObFvg(dailyTimeframe, currentPrice) {
    const result = { points: 0, maxPoints: 2, active: false, details: '' };

    if (!dailyTimeframe?.structure) {
      result.details = 'Dados insuficientes para análise de OB/FVG';
      return result;
    }

    const { orderBlocks, fvgs } = dailyTimeframe.structure;
    
    // Verifica se preço está tocando Order Block válido
    const touchingOB = orderBlocks.find(ob => 
      currentPrice >= ob.low && currentPrice <= ob.high &&
      Date.now() - ob.timestamp < 30 * 24 * 60 * 60 * 1000 // OB válido por 30 dias
    );

    // Verifica se há FVG não preenchido próximo
    const nearbyFVG = fvgs.find(fvg => 
      !fvg.filled &&
      ((fvg.type === 'bullish' && currentPrice >= fvg.bottom && currentPrice <= fvg.top) ||
       (fvg.type === 'bearish' && currentPrice >= fvg.bottom && currentPrice <= fvg.top))
    );

    if (touchingOB && nearbyFVG) {
      result.points = 2;
      result.active = true;
      result.details = `Preço tocando OB ${touchingOB.type} com FVG ${nearbyFVG.type} não preenchido`;
    } else if (touchingOB) {
      result.points = 1;
      result.active = true;
      result.details = `Preço tocando Order Block ${touchingOB.type}`;
    } else if (nearbyFVG) {
      result.points = 1;
      result.active = true;
      result.details = `FVG ${nearbyFVG.type} não preenchido próximo ao preço`;
    } else {
      result.details = 'Preço não está tocando OB válido ou FVG';
    }

    return result;
  }

  /**
   * Avalia critério Wyckoff + Volume
   */
  evaluateWyckoff(wyckoffPatterns, dailyTimeframe) {
    const result = { points: 0, maxPoints: 2, active: false, details: '' };

    if (!wyckoffPatterns || wyckoffPatterns.length === 0) {
      result.details = 'Nenhum padrão Wyckoff identificado';
      return result;
    }

    // Filtra padrões recentes com alta confiança
    const validPatterns = wyckoffPatterns.filter(pattern => 
      pattern.confidence >= 60 &&
      Date.now() - pattern.timestamp < 10 * 24 * 60 * 60 * 1000 // Últimos 10 dias
    );

    if (validPatterns.length === 0) {
      result.details = 'Padrões Wyckoff identificados têm baixa confiança';
      return result;
    }

    const latestPattern = validPatterns.sort((a, b) => b.timestamp - a.timestamp)[0];
    
    // Verifica confirmação de volume
    const avgVolume = this.calculateAverageVolume(dailyTimeframe.data);
    const volumeConfirmation = latestPattern.volume > avgVolume * 1.2;

    if (volumeConfirmation) {
      result.points = 2;
      result.active = true;
      result.details = `Padrão ${latestPattern.type} confirmado com volume acima da média (${latestPattern.confidence}% confiança)`;
    } else {
      result.points = 1;
      result.active = true;
      result.details = `Padrão ${latestPattern.type} identificado, mas volume insuficiente`;
    }

    return result;
  }

  /**
   * Avalia tendência da EMA 80 semanal
   */
  evaluateEma80Trend(weeklyTimeframe, setupType) {
    const result = { points: 0, maxPoints: 1, active: false, details: '' };

    if (!weeklyTimeframe?.indicators?.ema80) {
      result.details = 'EMA 80 semanal não disponível';
      return result;
    }

    const ema80 = weeklyTimeframe.indicators.ema80;
    const recentEma = ema80.slice(-5); // Últimas 5 semanas

    if (recentEma.length < 3) {
      result.details = 'Dados insuficientes da EMA 80 semanal';
      return result;
    }

    // Determina tendência da EMA 80
    const isUptrend = recentEma[recentEma.length - 1] > recentEma[0];
    const trendStrength = Math.abs(recentEma[recentEma.length - 1] - recentEma[0]) / recentEma[0];

    // Verifica alinhamento com setup
    const trendAligned = (setupType === 'continuation' && isUptrend) || 
                        (setupType === 'reversal' && !isUptrend);

    if (trendAligned && trendStrength > 0.02) { // Tendência forte (>2%)
      result.points = 1;
      result.active = true;
      result.details = `EMA 80 semanal em ${isUptrend ? 'alta' : 'baixa'}, alinhada com setup ${setupType}`;
    } else {
      result.details = `EMA 80 semanal ${trendAligned ? 'alinhada mas fraca' : 'não alinhada'} com setup`;
    }

    return result;
  }

  /**
   * Avalia condições do RSI
   */
  evaluateRsiConditions(dailyTimeframe, setupType) {
    const result = { points: 0, maxPoints: 1, active: false, details: '' };

    if (!dailyTimeframe?.indicators?.rsi14 || !dailyTimeframe?.indicators?.adx12) {
      result.details = 'RSI 14 ou ADX 12 não disponível';
      return result;
    }

    const rsi = dailyTimeframe.indicators.rsi14;
    const adx = dailyTimeframe.indicators.adx12;
    const currentRsi = rsi[rsi.length - 1];
    const currentAdx = adx[adx.length - 1];

    // Só pontua se ADX < 30 (mercado não está em tendência forte)
    if (currentAdx >= 30) {
      result.details = `ADX alto (${currentAdx.toFixed(1)}), RSI não é critério válido`;
      return result;
    }

    // Verifica condições de sobrecompra/sobrevenda
    const isOverbought = currentRsi > 70;
    const isOversold = currentRsi < 30;

    // Verifica divergência (simplificado)
    const hasDivergence = this.checkRsiDivergence(dailyTimeframe.data, rsi);

    if (hasDivergence) {
      result.points = 1;
      result.active = true;
      result.details = `Divergência RSI identificada (RSI: ${currentRsi.toFixed(1)})`;
    } else if ((setupType === 'reversal' && (isOverbought || isOversold))) {
      result.points = 1;
      result.active = true;
      result.details = `RSI em ${isOverbought ? 'sobrecompra' : 'sobrevenda'} (${currentRsi.toFixed(1)})`;
    } else {
      result.details = `RSI neutro (${currentRsi.toFixed(1)}), sem divergência`;
    }

    return result;
  }

  /**
   * Avalia região de Fibonacci para R:R
   */
  evaluateFibonacciRR(dailyTimeframe, currentPrice) {
    const result = { points: 0, maxPoints: 1, active: false, details: '' };

    if (!dailyTimeframe?.indicators?.fibonacci) {
      result.details = 'Níveis de Fibonacci não disponíveis';
      return result;
    }

    const fib = dailyTimeframe.indicators.fibonacci;
    
    if (!fib.levels || fib.levels.length === 0) {
      result.details = 'Níveis de Fibonacci não calculados';
      return result;
    }

    // Encontra nível de Fibonacci mais próximo
    const nearestLevel = fib.levels.reduce((nearest, level) => 
      Math.abs(level.price - currentPrice) < Math.abs(nearest.price - currentPrice) ? level : nearest
    );

    const priceDistance = Math.abs(nearestLevel.price - currentPrice) / currentPrice;

    // Verifica se está em zona de desconto/prêmio apropriada
    if (priceDistance < 0.01) { // Dentro de 1% do nível Fib
      // Calcula R:R potencial baseado na posição Fibonacci
      const riskReward = this.calculateRiskReward(nearestLevel, fib, currentPrice);
      
      if (riskReward >= 2.0) {
        result.points = 1;
        result.active = true;
        result.details = `Preço em nível Fib ${nearestLevel.level} (${nearestLevel.type}), R:R ${riskReward.toFixed(1)}`;
      } else {
        result.details = `Preço em nível Fib, mas R:R insuficiente (${riskReward.toFixed(1)})`;
      }
    } else {
      result.details = `Preço distante de níveis Fibonacci significativos`;
    }

    return result;
  }

  /**
   * Avalia força do ADX (apenas para continuação)
   */
  evaluateAdxStrength(dailyTimeframe, setupType) {
    const result = { points: 0, maxPoints: 1, active: false, details: '' };

    // ADX só é critério para setups de continuação
    if (setupType !== 'continuation') {
      result.details = 'ADX não é critério para setups de reversão';
      return result;
    }

    if (!dailyTimeframe?.indicators?.adx12) {
      result.details = 'ADX 12 não disponível';
      return result;
    }

    const adx = dailyTimeframe.indicators.adx12;
    const currentAdx = adx[adx.length - 1];

    if (currentAdx > 22) {
      result.points = 1;
      result.active = true;
      result.details = `ADX forte (${currentAdx.toFixed(1)}), confirmando tendência`;
    } else {
      result.details = `ADX fraco (${currentAdx.toFixed(1)}), tendência não confirmada`;
    }

    return result;
  }

  /**
   * Gera recomendação baseada na pontuação
   */
  generateRecommendation(scoring, totalScore, setupType, analysis, currentPrice) {
    const recommendation = {
      action: 'AGUARDAR',
      entryPrice: null,
      stopLoss: null,
      targets: { tp1: null, tp2: null, tp3: null },
      riskReward: null,
      confidence: 0,
      reasoning: []
    };

    if (totalScore < 6) {
      recommendation.reasoning.push(`Score insuficiente (${totalScore}/6 mínimo)`);
      return recommendation;
    }

    // Determina direção baseada na estrutura
    const direction = this.determineTradeDirection(analysis, setupType);
    recommendation.action = direction === 'bullish' ? 'COMPRAR' : 'VENDER';

    // Calcula níveis de entrada, stop e alvos
    const levels = this.calculateTradeLevels(analysis, currentPrice, direction);
    recommendation.entryPrice = levels.entry;
    recommendation.stopLoss = levels.stop;
    recommendation.targets = levels.targets;
    recommendation.riskReward = levels.riskReward;

    // Calcula confiança baseada no score
    recommendation.confidence = Math.min(100, (totalScore / 8) * 100);

    // Adiciona reasoning
    Object.entries(scoring).forEach(([criterion, data]) => {
      if (data.active && data.points > 0) {
        recommendation.reasoning.push(data.details);
      }
    });

    return recommendation;
  }

  /**
   * Determina direção do trade
   */
  determineTradeDirection(analysis, setupType) {
    const dailyStructure = analysis.timeframes.daily?.structure;
    
    if (!dailyStructure) return 'bullish';

    // Para continuação, segue a direção da estrutura
    if (setupType === 'continuation') {
      const recentBos = dailyStructure.bos.filter(bos => 
        Date.now() - bos.timestamp < 7 * 24 * 60 * 60 * 1000
      );
      
      if (recentBos.length > 0) {
        const latestBos = recentBos.sort((a, b) => b.timestamp - a.timestamp)[0];
        return latestBos.type;
      }
    }

    // Para reversão, vai contra a tendência atual
    const weeklyEma = analysis.timeframes.weekly?.indicators?.ema80;
    if (weeklyEma && weeklyEma.length >= 2) {
      const isUptrend = weeklyEma[weeklyEma.length - 1] > weeklyEma[weeklyEma.length - 2];
      return setupType === 'reversal' ? (isUptrend ? 'bearish' : 'bullish') : (isUptrend ? 'bullish' : 'bearish');
    }

    return 'bullish'; // Default
  }

  /**
   * Calcula níveis de trade
   */
  calculateTradeLevels(analysis, currentPrice, direction) {
    const dailyStructure = analysis.timeframes.daily?.structure;
    const levels = {
      entry: currentPrice,
      stop: null,
      targets: { tp1: null, tp2: null, tp3: null },
      riskReward: 0
    };

    if (!dailyStructure) return levels;

    if (direction === 'bullish') {
      // Stop abaixo do último swing low ou Order Block
      const recentLows = dailyStructure.liquidityZones?.below || [];
      if (recentLows.length > 0) {
        levels.stop = recentLows[0].level * 0.98; // 2% abaixo
      } else {
        levels.stop = currentPrice * 0.95; // 5% stop padrão
      }

      // Alvos baseados em resistências e Fibonacci
      const recentHighs = dailyStructure.liquidityZones?.above || [];
      if (recentHighs.length > 0) {
        levels.targets.tp1 = recentHighs[0].level;
        levels.targets.tp2 = currentPrice * 1.618; // Projeção Fibonacci
        levels.targets.tp3 = recentHighs.length > 1 ? recentHighs[1].level : currentPrice * 2.0;
      } else {
        levels.targets.tp1 = currentPrice * 1.05;
        levels.targets.tp2 = currentPrice * 1.10;
        levels.targets.tp3 = currentPrice * 1.15;
      }
    } else {
      // Stop acima do último swing high ou Order Block
      const recentHighs = dailyStructure.liquidityZones?.above || [];
      if (recentHighs.length > 0) {
        levels.stop = recentHighs[0].level * 1.02; // 2% acima
      } else {
        levels.stop = currentPrice * 1.05; // 5% stop padrão
      }

      // Alvos baseados em suportes
      const recentLows = dailyStructure.liquidityZones?.below || [];
      if (recentLows.length > 0) {
        levels.targets.tp1 = recentLows[0].level;
        levels.targets.tp2 = currentPrice * 0.382; // Projeção Fibonacci
        levels.targets.tp3 = recentLows.length > 1 ? recentLows[1].level : currentPrice * 0.8;
      } else {
        levels.targets.tp1 = currentPrice * 0.95;
        levels.targets.tp2 = currentPrice * 0.90;
        levels.targets.tp3 = currentPrice * 0.85;
      }
    }

    // Calcula risk:reward para TP1
    const risk = Math.abs(levels.entry - levels.stop);
    const reward = Math.abs(levels.targets.tp1 - levels.entry);
    levels.riskReward = risk > 0 ? reward / risk : 0;

    return levels;
  }

  /**
   * Funções auxiliares
   */
  calculateAverageVolume(data, periods = 20) {
    if (!data || data.length < periods) return 0;
    
    const recentData = data.slice(-periods);
    return recentData.reduce((sum, candle) => sum + candle.volume, 0) / periods;
  }

  checkRsiDivergence(priceData, rsiData) {
    if (!priceData || !rsiData || priceData.length < 10) return false;

    const recentPrices = priceData.slice(-10).map(d => d.close);
    const recentRsi = rsiData.slice(-10);

    // Simplificado: verifica se preço faz novo high/low mas RSI não
    const priceHigh = Math.max(...recentPrices);
    const priceLow = Math.min(...recentPrices);
    const rsiHigh = Math.max(...recentRsi);
    const rsiLow = Math.min(...recentRsi);

    const priceHighIndex = recentPrices.indexOf(priceHigh);
    const priceLowIndex = recentPrices.indexOf(priceLow);
    const rsiHighIndex = recentRsi.indexOf(rsiHigh);
    const rsiLowIndex = recentRsi.indexOf(rsiLow);

    // Divergência bullish: preço faz low mais baixo, RSI faz low mais alto
    const bullishDiv = priceLowIndex > rsiLowIndex && recentPrices[priceLowIndex] < recentPrices[rsiLowIndex];
    
    // Divergência bearish: preço faz high mais alto, RSI faz high mais baixo  
    const bearishDiv = priceHighIndex > rsiHighIndex && recentPrices[priceHighIndex] > recentPrices[rsiHighIndex];

    return bullishDiv || bearishDiv;
  }

  calculateRiskReward(fibLevel, fibData, currentPrice) {
    // Simplificado: calcula R:R baseado na posição Fibonacci
    if (fibLevel.type === 'discount') {
      return 2.5; // Zona de desconto geralmente oferece bom R:R
    } else if (fibLevel.type === 'premium') {
      return 1.5; // Zona de prêmio oferece R:R menor
    }
    return 2.0; // Equilibrium
  }

  /**
   * Obtém pontuação em cache
   */
  getCachedScore(symbol) {
    return this.cache.get(symbol);
  }

  /**
   * Limpa cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Obtém estatísticas do sistema de pontuação
   */
  getStats() {
    const scores = Array.from(this.cache.values());
    
    return {
      totalAssets: scores.length,
      validSetups: scores.filter(s => s.isValidSetup).length,
      averageScore: scores.length > 0 ? scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length : 0,
      setupTypes: {
        reversal: scores.filter(s => s.setupType === 'reversal').length,
        continuation: scores.filter(s => s.setupType === 'continuation').length
      }
    };
  }
}

// Singleton instance
const scoringEngine = new ScoringEngine();

export default scoringEngine;

