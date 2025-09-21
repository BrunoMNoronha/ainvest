// Tipos de dados para o sistema AInvest Dashboard

// Dados OHLCV básicos
export const createOHLCVData = (open, high, low, close, volume, timestamp) => ({
  open,
  high,
  low,
  close,
  volume,
  timestamp
});

// Indicadores técnicos
export const createTechnicalIndicators = () => ({
  ema8: null,
  ema80: null,
  rsi14: null,
  adx12: null,
  fibonacci: {
    levels: [],
    trend: null
  }
});

// Estruturas de mercado
export const createMarketStructure = () => ({
  bos: [], // Break of Structure
  choch: [], // Change of Character
  orderBlocks: [],
  fvgs: [], // Fair Value Gaps
  liquidityZones: {
    above: [],
    below: []
  },
  trendLines: []
});

// Padrões Wyckoff
export const createWyckoffPattern = (type, confidence, volume) => ({
  type, // 'spring', 'utad', 'test', 'accumulation', 'distribution'
  confidence, // 0-100
  volume,
  timestamp: Date.now()
});

// Critérios de pontuação
export const createScoringCriteria = () => ({
  bosChoch: { points: 0, maxPoints: 2, active: false },
  obFvg: { points: 0, maxPoints: 2, active: false },
  wyckoff: { points: 0, maxPoints: 2, active: false },
  ema80Trend: { points: 0, maxPoints: 1, active: false },
  rsiDivergence: { points: 0, maxPoints: 1, active: false },
  fibonacciRR: { points: 0, maxPoints: 1, active: false },
  adxStrength: { points: 0, maxPoints: 1, active: false }
});

// Análise completa de um ativo
export const createAssetAnalysis = (symbol) => ({
  symbol,
  timeframes: {
    weekly: {
      data: [],
      indicators: createTechnicalIndicators(),
      structure: createMarketStructure()
    },
    daily: {
      data: [],
      indicators: createTechnicalIndicators(),
      structure: createMarketStructure()
    },
    fourHour: {
      data: [],
      indicators: createTechnicalIndicators(),
      structure: createMarketStructure()
    }
  },
  wyckoffPatterns: [],
  scoring: createScoringCriteria(),
  totalScore: 0,
  recommendation: 'AGUARDAR', // 'COMPRAR', 'VENDER', 'ENTRAR_VENDIDO', 'AGUARDAR'
  entryPrice: null,
  stopLoss: null,
  targets: {
    tp1: null,
    tp2: null,
    tp3: null
  },
  riskReward: null,
  lastUpdate: Date.now()
});

// Configurações de alerta
export const createAlert = (type, symbol, condition, value) => ({
  id: Date.now().toString(),
  type, // 'score', 'orderblock_touch', 'choch'
  symbol,
  condition, // '>=', '<=', '==', 'touch'
  value,
  active: true,
  triggered: false,
  createdAt: Date.now(),
  triggeredAt: null
});

// Estado global da aplicação
export const createAppState = () => ({
  assets: new Map(), // symbol -> AssetAnalysis
  watchlist: [], // array de symbols
  alerts: [], // array de Alert
  settings: {
    updateInterval: 5000, // ms
    maxAssets: 50,
    theme: 'light',
    notifications: true
  },
  connection: {
    status: 'disconnected', // 'connected', 'connecting', 'disconnected', 'error'
    lastUpdate: null,
    errors: []
  }
});

// Ações do reducer
export const ACTIONS = {
  // Dados
  UPDATE_ASSET_DATA: 'UPDATE_ASSET_DATA',
  ADD_TO_WATCHLIST: 'ADD_TO_WATCHLIST',
  REMOVE_FROM_WATCHLIST: 'REMOVE_FROM_WATCHLIST',
  
  // Análise
  UPDATE_ANALYSIS: 'UPDATE_ANALYSIS',
  UPDATE_SCORING: 'UPDATE_SCORING',
  
  // Alertas
  ADD_ALERT: 'ADD_ALERT',
  REMOVE_ALERT: 'REMOVE_ALERT',
  TRIGGER_ALERT: 'TRIGGER_ALERT',
  
  // Configurações
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  
  // Conexão
  SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
  ADD_ERROR: 'ADD_ERROR',
  CLEAR_ERRORS: 'CLEAR_ERRORS'
};

