import { createOHLCVData } from '../types/index.js';

/**
 * Conector de Dados Mock para o AInvest Dashboard
 * Simula a obtenção de dados OHLCV em tempo real para múltiplos ativos
 */
class DataConnector {
  constructor() {
    this.isConnected = false;
    this.subscribers = new Map(); // symbol -> array of callbacks
    this.intervals = new Map(); // symbol -> interval id
    this.mockData = new Map(); // symbol -> historical data
    this.updateInterval = 5000; // 5 segundos
    
    // Lista de ativos para demonstração
    this.availableAssets = [
      'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3',
      'MGLU3', 'WEGE3', 'RENT3', 'LREN3', 'JBSS3',
      'BTOW3', 'CIEL3', 'COGN3', 'CYRE3', 'ELET3'
    ];
    
    this.initializeMockData();
  }

  /**
   * Inicializa dados mock para todos os ativos
   */
  initializeMockData() {
    this.availableAssets.forEach(symbol => {
      this.mockData.set(symbol, this.generateHistoricalData(symbol));
    });
  }

  /**
   * Gera dados históricos mock para um ativo
   */
  generateHistoricalData(symbol, days = 100) {
    const data = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    // Preço base baseado no símbolo (para variação realista)
    const basePrice = this.getBasePriceForSymbol(symbol);
    let currentPrice = basePrice;
    
    for (let i = days; i >= 0; i--) {
      const timestamp = now - (i * dayMs);
      
      // Simulação de movimento de preço com tendência e volatilidade
      const trend = Math.sin(i / 20) * 0.02; // Tendência cíclica
      const volatility = (Math.random() - 0.5) * 0.08; // Volatilidade diária
      const priceChange = trend + volatility;
      
      currentPrice = Math.max(currentPrice * (1 + priceChange), 0.01);
      
      const open = currentPrice;
      const close = open * (1 + (Math.random() - 0.5) * 0.04);
      const high = Math.max(open, close) * (1 + Math.random() * 0.03);
      const low = Math.min(open, close) * (1 - Math.random() * 0.03);
      const volume = Math.floor(Math.random() * 10000000) + 1000000;
      
      data.push(createOHLCVData(
        parseFloat(open.toFixed(2)),
        parseFloat(high.toFixed(2)),
        parseFloat(low.toFixed(2)),
        parseFloat(close.toFixed(2)),
        volume,
        timestamp
      ));
      
      currentPrice = close;
    }
    
    return data;
  }

  /**
   * Retorna preço base para um símbolo específico
   */
  getBasePriceForSymbol(symbol) {
    const basePrices = {
      'PETR4': 35.50,
      'VALE3': 65.80,
      'ITUB4': 25.30,
      'BBDC4': 22.70,
      'ABEV3': 12.45,
      'MGLU3': 8.90,
      'WEGE3': 45.20,
      'RENT3': 55.60,
      'LREN3': 18.30,
      'JBSS3': 28.90,
      'BTOW3': 15.40,
      'CIEL3': 6.80,
      'COGN3': 4.20,
      'CYRE3': 18.70,
      'ELET3': 42.10
    };
    
    return basePrices[symbol] || 20.00;
  }

  /**
   * Conecta ao feed de dados
   */
  async connect() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isConnected = true;
        console.log('DataConnector: Conectado ao feed de dados mock');
        resolve(true);
      }, 1000);
    });
  }

  /**
   * Desconecta do feed de dados
   */
  disconnect() {
    this.isConnected = false;
    
    // Limpa todos os intervalos
    this.intervals.forEach(intervalId => {
      clearInterval(intervalId);
    });
    this.intervals.clear();
    
    console.log('DataConnector: Desconectado do feed de dados');
  }

  /**
   * Subscreve para receber atualizações de um ativo
   */
  subscribe(symbol, callback) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, []);
    }
    
    this.subscribers.get(symbol).push(callback);
    
    // Inicia o intervalo de atualização se não existir
    if (!this.intervals.has(symbol)) {
      const intervalId = setInterval(() => {
        this.updateAssetData(symbol);
      }, this.updateInterval);
      
      this.intervals.set(symbol, intervalId);
    }
    
    // Envia dados históricos imediatamente
    const historicalData = this.mockData.get(symbol) || [];
    callback({
      symbol,
      timeframe: 'daily',
      data: historicalData,
      isHistorical: true
    });
    
    console.log(`DataConnector: Subscrito para ${symbol}`);
  }

  /**
   * Remove subscrição de um ativo
   */
  unsubscribe(symbol, callback) {
    if (this.subscribers.has(symbol)) {
      const callbacks = this.subscribers.get(symbol);
      const index = callbacks.indexOf(callback);
      
      if (index > -1) {
        callbacks.splice(index, 1);
        
        // Se não há mais callbacks, para o intervalo
        if (callbacks.length === 0) {
          const intervalId = this.intervals.get(symbol);
          if (intervalId) {
            clearInterval(intervalId);
            this.intervals.delete(symbol);
          }
          this.subscribers.delete(symbol);
        }
      }
    }
    
    console.log(`DataConnector: Dessubscrito de ${symbol}`);
  }

  /**
   * Atualiza dados de um ativo (simula tick em tempo real)
   */
  updateAssetData(symbol) {
    if (!this.isConnected) return;
    
    const historicalData = this.mockData.get(symbol);
    if (!historicalData || historicalData.length === 0) return;
    
    const lastCandle = historicalData[historicalData.length - 1];
    const now = Date.now();
    
    // Simula novo candle se passou tempo suficiente
    if (now - lastCandle.timestamp > 24 * 60 * 60 * 1000) {
      const newCandle = this.generateNewCandle(lastCandle);
      historicalData.push(newCandle);
      
      // Mantém apenas os últimos 200 candles
      if (historicalData.length > 200) {
        historicalData.shift();
      }
    } else {
      // Atualiza candle atual (simula intraday)
      this.updateCurrentCandle(lastCandle);
    }
    
    // Notifica todos os subscribers
    const callbacks = this.subscribers.get(symbol) || [];
    callbacks.forEach(callback => {
      callback({
        symbol,
        timeframe: 'daily',
        data: [...historicalData], // Cópia para evitar mutação
        isHistorical: false,
        lastUpdate: now
      });
    });
  }

  /**
   * Gera novo candle baseado no anterior
   */
  generateNewCandle(lastCandle) {
    const trend = (Math.random() - 0.5) * 0.06;
    const open = lastCandle.close;
    const close = open * (1 + trend);
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    const volume = Math.floor(Math.random() * 8000000) + 2000000;
    
    return createOHLCVData(
      parseFloat(open.toFixed(2)),
      parseFloat(high.toFixed(2)),
      parseFloat(low.toFixed(2)),
      parseFloat(close.toFixed(2)),
      volume,
      Date.now()
    );
  }

  /**
   * Atualiza candle atual (simula movimento intraday)
   */
  updateCurrentCandle(candle) {
    const priceChange = (Math.random() - 0.5) * 0.01;
    const newClose = Math.max(candle.close * (1 + priceChange), 0.01);
    
    candle.close = parseFloat(newClose.toFixed(2));
    candle.high = Math.max(candle.high, candle.close);
    candle.low = Math.min(candle.low, candle.close);
    candle.volume += Math.floor(Math.random() * 100000);
  }

  /**
   * Obtém dados históricos para múltiplos timeframes
   */
  async getHistoricalData(symbol, timeframes = ['weekly', 'daily', '4h']) {
    const data = {};
    
    for (const timeframe of timeframes) {
      data[timeframe] = this.generateDataForTimeframe(symbol, timeframe);
    }
    
    return data;
  }

  /**
   * Gera dados para um timeframe específico
   */
  generateDataForTimeframe(symbol, timeframe) {
    const dailyData = this.mockData.get(symbol) || [];
    
    switch (timeframe) {
      case 'weekly':
        return this.aggregateToWeekly(dailyData);
      case '4h':
        return this.generateIntraday(dailyData, 6); // 6 períodos de 4h por dia
      default:
        return dailyData;
    }
  }

  /**
   * Agrega dados diários para semanal
   */
  aggregateToWeekly(dailyData) {
    const weeklyData = [];
    let weekStart = null;
    let weekData = null;
    
    dailyData.forEach(candle => {
      const candleDate = new Date(candle.timestamp);
      const weekStartDate = new Date(candleDate);
      weekStartDate.setDate(candleDate.getDate() - candleDate.getDay());
      weekStartDate.setHours(0, 0, 0, 0);
      
      if (!weekStart || weekStart.getTime() !== weekStartDate.getTime()) {
        if (weekData) {
          weeklyData.push(weekData);
        }
        
        weekStart = weekStartDate;
        weekData = createOHLCVData(
          candle.open,
          candle.high,
          candle.low,
          candle.close,
          candle.volume,
          weekStart.getTime()
        );
      } else {
        weekData.high = Math.max(weekData.high, candle.high);
        weekData.low = Math.min(weekData.low, candle.low);
        weekData.close = candle.close;
        weekData.volume += candle.volume;
      }
    });
    
    if (weekData) {
      weeklyData.push(weekData);
    }
    
    return weeklyData;
  }

  /**
   * Gera dados intraday baseados nos dados diários
   */
  generateIntraday(dailyData, periodsPerDay) {
    const intradayData = [];
    
    dailyData.forEach(dailyCandle => {
      const dayStart = new Date(dailyCandle.timestamp);
      dayStart.setHours(9, 0, 0, 0); // Mercado abre às 9h
      
      const periodDuration = (8 * 60 * 60 * 1000) / periodsPerDay; // 8h de pregão
      let currentPrice = dailyCandle.open;
      
      for (let i = 0; i < periodsPerDay; i++) {
        const periodStart = new Date(dayStart.getTime() + (i * periodDuration));
        
        const priceChange = (Math.random() - 0.5) * 0.02;
        const open = currentPrice;
        const close = i === periodsPerDay - 1 ? 
          dailyCandle.close : 
          open * (1 + priceChange);
        
        const high = Math.max(open, close) * (1 + Math.random() * 0.01);
        const low = Math.min(open, close) * (1 - Math.random() * 0.01);
        const volume = Math.floor(dailyCandle.volume / periodsPerDay * (0.5 + Math.random()));
        
        intradayData.push(createOHLCVData(
          parseFloat(open.toFixed(2)),
          parseFloat(high.toFixed(2)),
          parseFloat(low.toFixed(2)),
          parseFloat(close.toFixed(2)),
          volume,
          periodStart.getTime()
        ));
        
        currentPrice = close;
      }
    });
    
    return intradayData;
  }

  /**
   * Lista todos os ativos disponíveis
   */
  getAvailableAssets() {
    return [...this.availableAssets];
  }

  /**
   * Verifica status da conexão
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      activeSubscriptions: this.subscribers.size,
      lastUpdate: Date.now()
    };
  }
}

// Singleton instance
const dataConnector = new DataConnector();

export default dataConnector;

