import type { Candle } from "@/types/market";

/**
 * Calcula o RSI (Relative Strength Index) clássico de Wilder.
 * @param candles - Array de candles OHLCV ordenados do mais antigo ao mais recente
 * @param period - Número de períodos (padrão: 14)
 * @returns Valor do RSI entre 0 e 100, ou null se dados insuficientes
 */
export function calculateRSI(candles: Candle[], period: number = 14): number | null {
  if (candles.length < period + 1) return null;

  // Calcular variações de fechamento
  const changes: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    changes.push(candles[i].close - candles[i - 1].close);
  }

  // Média inicial de ganhos e perdas (SMA)
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;

  // Suavização de Wilder para os períodos restantes
  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] > 0 ? changes[i] : 0;
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return Math.round((100 - 100 / (1 + rs)) * 100) / 100;
}

/**
 * Calcula a EMA (Exponential Moving Average).
 * @param candles - Array de candles ordenados do mais antigo ao mais recente
 * @param period - Número de períodos
 * @returns Valor da EMA ou null se dados insuficientes
 */
export function calculateEMA(candles: Candle[], period: number): number | null {
  if (candles.length < period) return null;

  const multiplier = 2 / (period + 1);

  // SMA inicial como semente
  let ema = 0;
  for (let i = 0; i < period; i++) {
    ema += candles[i].close;
  }
  ema /= period;

  // Aplicar EMA para os dados restantes
  for (let i = period; i < candles.length; i++) {
    ema = (candles[i].close - ema) * multiplier + ema;
  }

  return Math.round(ema * 100) / 100;
}

/**
 * Calcula o ADX (Average Directional Index).
 * Versão simplificada usando True Range e Directional Movement.
 * @param candles - Array de candles ordenados do mais antigo ao mais recente
 * @param period - Número de períodos (padrão: 12)
 * @returns Valor do ADX entre 0 e 100, ou null se dados insuficientes
 */
export function calculateADX(candles: Candle[], period: number = 12): number | null {
  if (candles.length < period * 2 + 1) return null;

  const trueRanges: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const prevHigh = candles[i - 1].high;
    const prevLow = candles[i - 1].low;

    // True Range
    trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));

    // Directional Movement
    const upMove = high - prevHigh;
    const downMove = prevLow - low;
    plusDMs.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDMs.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  // Suavização de Wilder
  const smooth = (arr: number[], p: number): number[] => {
    const result: number[] = [];
    let sum = 0;
    for (let i = 0; i < p; i++) sum += arr[i];
    result.push(sum);
    for (let i = p; i < arr.length; i++) {
      result.push(result[result.length - 1] - result[result.length - 1] / p + arr[i]);
    }
    return result;
  };

  const smoothTR = smooth(trueRanges, period);
  const smoothPlusDM = smooth(plusDMs, period);
  const smoothMinusDM = smooth(minusDMs, period);

  // Calcular DI+ e DI-
  const dxValues: number[] = [];
  for (let i = 0; i < smoothTR.length; i++) {
    if (smoothTR[i] === 0) continue;
    const plusDI = (smoothPlusDM[i] / smoothTR[i]) * 100;
    const minusDI = (smoothMinusDM[i] / smoothTR[i]) * 100;
    const diSum = plusDI + minusDI;
    if (diSum === 0) continue;
    dxValues.push(Math.abs(plusDI - minusDI) / diSum * 100);
  }

  if (dxValues.length < period) return null;

  // ADX = média suavizada dos DX
  let adx = 0;
  for (let i = 0; i < period; i++) adx += dxValues[i];
  adx /= period;

  for (let i = period; i < dxValues.length; i++) {
    adx = (adx * (period - 1) + dxValues[i]) / period;
  }

  return Math.round(adx * 100) / 100;
}

/**
 * Determina o status de um indicador baseado em seu valor.
 */
export function getIndicatorStatus(
  type: 'rsi' | 'adx' | 'ema',
  value: number | null,
  currentPrice?: number
): 'bullish' | 'bearish' | 'neutral' {
  if (value === null) return 'neutral';

  switch (type) {
    case 'rsi':
      if (value < 30) return 'bullish';   // Sobrevendido → oportunidade de compra
      if (value > 70) return 'bearish';   // Sobrecomprado → risco de queda
      return 'neutral';
    case 'adx':
      if (value > 25) return 'bullish';   // Tendência forte
      return 'neutral';                   // Sem tendência definida
    case 'ema':
      if (currentPrice === undefined || value === null) return 'neutral';
      return currentPrice > value ? 'bullish' : 'bearish';
    default:
      return 'neutral';
  }
}

/**
 * Retorna descrição textual do indicador.
 */
export function getIndicatorDescription(
  type: 'rsi' | 'adx' | 'ema',
  value: number | null,
  currentPrice?: number
): string {
  if (value === null) return 'Dados insuficientes';

  switch (type) {
    case 'rsi':
      if (value < 30) return 'Sobrevendido';
      if (value > 70) return 'Sobrecomprado';
      if (value < 45) return 'Zona neutra-baixa';
      if (value > 55) return 'Zona neutra-alta';
      return 'Zona neutra';
    case 'adx':
      if (value > 50) return 'Tendência muito forte';
      if (value > 25) return 'Tendência moderada';
      return 'Sem tendência definida';
    case 'ema':
      if (currentPrice === undefined) return 'Sem preço atual';
      return currentPrice > value ? 'Preço acima' : 'Preço abaixo';
    default:
      return '';
  }
}
