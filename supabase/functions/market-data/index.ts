import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// B3 Holiday blocklist for 2026
const HOLIDAYS_2026 = [
  '2026-01-01', // Confraternização Universal
  '2026-02-16', '2026-02-17', // Carnaval
  '2026-04-03', // Sexta-feira Santa
  '2026-04-21', // Tiradentes
  '2026-05-01', // Dia do Trabalho
  '2026-06-04', // Corpus Christi
  '2026-09-07', // Independência
  '2026-10-12', // N.S. Aparecida
  '2026-11-02', // Finados
  '2026-11-20', // Consciência Negra
  '2026-12-25', // Natal
  '2026-12-31', // Último dia do ano
];

// Redis cache helper functions
async function getFromCache(key: string): Promise<{ data: any; age: number } | null> {
  const redisUrl = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const redisToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');
  
  if (!redisUrl || !redisToken) {
    console.log('Redis not configured, skipping cache');
    return null;
  }

  try {
    const response = await fetch(`${redisUrl}/get/${key}`, {
      headers: { Authorization: `Bearer ${redisToken}` }
    });
    const result = await response.json();
    
    if (result.result) {
      const cached = JSON.parse(result.result);
      const age = Math.floor((Date.now() - cached.timestamp) / 1000);
      return { data: cached.data, age };
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
}

async function setCache(key: string, data: any, ttlSeconds: number): Promise<void> {
  const redisUrl = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const redisToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');
  
  if (!redisUrl || !redisToken) return;

  try {
    const payload = JSON.stringify({ data, timestamp: Date.now() });
    await fetch(`${redisUrl}/set/${key}/${encodeURIComponent(payload)}/ex/${ttlSeconds}`, {
      headers: { Authorization: `Bearer ${redisToken}` }
    });
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

// Market status helper
function getMarketStatus(): { isOpen: boolean; phase: string; isHoliday: boolean; holidayName?: string } {
  const now = new Date();
  const saoPauloTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const hour = saoPauloTime.getHours();
  const minute = saoPauloTime.getMinutes();
  const dayOfWeek = saoPauloTime.getDay();
  const dateStr = saoPauloTime.toISOString().split('T')[0];

  // Check holiday
  const holidayIndex = HOLIDAYS_2026.indexOf(dateStr);
  if (holidayIndex !== -1) {
    return { isOpen: false, phase: 'closed', isHoliday: true, holidayName: 'Feriado B3' };
  }

  // Check weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { isOpen: false, phase: 'closed', isHoliday: false };
  }

  // Check trading hours (10:00 - 17:00 BRT)
  const timeInMinutes = hour * 60 + minute;
  const marketOpen = 10 * 60; // 10:00
  const marketClose = 17 * 60; // 17:00

  if (timeInMinutes < marketOpen) {
    return { isOpen: false, phase: 'pre-market', isHoliday: false };
  } else if (timeInMinutes >= marketOpen && timeInMinutes < marketClose) {
    return { isOpen: true, phase: 'open', isHoliday: false };
  } else {
    return { isOpen: false, phase: 'after-hours', isHoliday: false };
  }
}

// Fetch quotes from BRAPI
async function fetchBrapiQuotes(symbols: string[]): Promise<any[]> {
  const token = Deno.env.get('BRAPI_TOKEN');
  const symbolList = symbols.join(',');
  const url = token 
    ? `https://brapi.dev/api/quote/${symbolList}?token=${token}`
    : `https://brapi.dev/api/quote/${symbolList}`;

  console.log(`Fetching BRAPI quotes for: ${symbolList}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`BRAPI error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results || [];
}

// Fetch historical data from BRAPI
async function fetchBrapiHistorical(symbol: string, range: string): Promise<any[]> {
  const token = Deno.env.get('BRAPI_TOKEN');
  const url = token 
    ? `https://brapi.dev/api/quote/${symbol}?range=${range}&interval=1d&token=${token}`
    : `https://brapi.dev/api/quote/${symbol}?range=${range}&interval=1d`;

  console.log(`Fetching BRAPI historical for: ${symbol}, range: ${range}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`BRAPI historical error: ${response.status}`);
  }
  
  const data = await response.json();
  const result = data.results?.[0];
  
  if (!result?.historicalDataPrice) {
    return [];
  }

  return result.historicalDataPrice.map((item: any) => ({
    date: new Date(item.date * 1000).toISOString().split('T')[0],
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    volume: item.volume
  }));
}

// Fetch currency and macro data from HG Brasil
async function fetchHgBrasilData(): Promise<any> {
  const apiKey = Deno.env.get('HG_BRASIL_KEY');
  if (!apiKey) {
    console.log('HG Brasil API key not configured');
    return null;
  }

  const url = `https://api.hgbrasil.com/finance?key=${apiKey}`;
  console.log('Fetching HG Brasil data');
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HG Brasil error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results;
}

// Handle market overview request
async function handleMarketOverview(): Promise<Response> {
  const cacheKey = 'market-overview';
  const cacheTTL = 300; // 5 minutes
  
  // Check cache
  const cached = await getFromCache(cacheKey);
  if (cached && cached.age < 60) {
    console.log('Returning hot cache');
    return new Response(JSON.stringify({
      ...cached.data,
      cached: true,
      cacheAge: cached.age
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } });
  }

  // Fetch fresh data
  try {
    const [brapiData, hgData] = await Promise.all([
      fetchBrapiQuotes(['^BVSP', 'IFIX11', 'IVVB11']),
      fetchHgBrasilData()
    ]);

    const marketStatus = getMarketStatus();
    const now = new Date().toISOString();

    const ibovData = brapiData.find((q: any) => q.symbol === '^BVSP') || {};
    const ifixData = brapiData.find((q: any) => q.symbol === 'IFIX11') || {};
    const ivvbData = brapiData.find((q: any) => q.symbol === 'IVVB11') || {};

    const overview = {
      ibov: {
        name: 'IBOV',
        value: ibovData.regularMarketPrice || 0,
        change: ibovData.regularMarketChange || 0,
        changePercent: ibovData.regularMarketChangePercent || 0,
        updatedAt: now
      },
      ifix: {
        name: 'IFIX',
        value: ifixData.regularMarketPrice || 0,
        change: ifixData.regularMarketChange || 0,
        changePercent: ifixData.regularMarketChangePercent || 0,
        updatedAt: now
      },
      sp500Proxy: {
        name: 'IVVB11',
        value: ivvbData.regularMarketPrice || 0,
        change: ivvbData.regularMarketChange || 0,
        changePercent: ivvbData.regularMarketChangePercent || 0,
        updatedAt: now
      },
      usdBrl: hgData?.currencies?.USD ? {
        buy: hgData.currencies.USD.buy,
        sell: hgData.currencies.USD.sell,
        change: hgData.currencies.USD.variation || 0,
        updatedAt: now
      } : { buy: 0, sell: 0, change: 0, updatedAt: now },
      selic: hgData?.taxes?.[0]?.selic || 0,
      cdi: hgData?.taxes?.[0]?.cdi || 0,
      updatedAt: now,
      marketStatus
    };

    // Update cache
    await setCache(cacheKey, overview, cacheTTL);

    // If we had stale cache, return it while updating in background
    if (cached) {
      console.log('Returning stale cache, updated in background');
      return new Response(JSON.stringify({
        ...cached.data,
        cached: true,
        cacheAge: cached.age
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'STALE' } });
    }

    return new Response(JSON.stringify({
      ...overview,
      cached: false
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } });

  } catch (error) {
    console.error('Market overview error:', error);
    
    // Return stale cache if available
    if (cached) {
      return new Response(JSON.stringify({
        ...cached.data,
        cached: true,
        cacheAge: cached.age,
        error: 'Using cached data due to API error'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'STALE' } });
    }

    return new Response(JSON.stringify({ error: 'Failed to fetch market data' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle quote request
async function handleQuote(symbols: string[]): Promise<Response> {
  if (!symbols.length) {
    return new Response(JSON.stringify({ error: 'No symbols provided' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const cacheKey = `quotes:${symbols.sort().join(',')}`;
  const cacheTTL = 300; // 5 minutes

  // Check cache
  const cached = await getFromCache(cacheKey);
  if (cached && cached.age < 60) {
    return new Response(JSON.stringify({
      data: cached.data,
      cached: true,
      cacheAge: cached.age
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } });
  }

  try {
    const results = await fetchBrapiQuotes(symbols);
    const now = new Date().toISOString();

    const quotes = results.map((q: any) => ({
      symbol: q.symbol,
      name: q.shortName || q.longName || q.symbol,
      price: q.regularMarketPrice || 0,
      change: q.regularMarketChange || 0,
      changePercent: q.regularMarketChangePercent || 0,
      volume: q.regularMarketVolume || 0,
      updatedAt: now
    }));

    await setCache(cacheKey, quotes, cacheTTL);

    return new Response(JSON.stringify({
      data: quotes,
      cached: false
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } });

  } catch (error) {
    console.error('Quote error:', error);
    
    if (cached) {
      return new Response(JSON.stringify({
        data: cached.data,
        cached: true,
        cacheAge: cached.age
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'STALE' } });
    }

    return new Response(JSON.stringify({ error: 'Failed to fetch quotes' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle historical data request
async function handleHistorical(symbol: string, range: string): Promise<Response> {
  if (!symbol) {
    return new Response(JSON.stringify({ error: 'No symbol provided' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const validRanges = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y'];
  const normalizedRange = range?.toLowerCase() || '1mo';
  
  if (!validRanges.includes(normalizedRange)) {
    return new Response(JSON.stringify({ error: 'Invalid range' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const cacheKey = `historical:${symbol}:${normalizedRange}`;
  const cacheTTL = 3600; // 1 hour

  // Check cache
  const cached = await getFromCache(cacheKey);
  if (cached && cached.age < 300) {
    return new Response(JSON.stringify({
      data: cached.data,
      cached: true,
      cacheAge: cached.age
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } });
  }

  try {
    const candles = await fetchBrapiHistorical(symbol, normalizedRange);
    await setCache(cacheKey, candles, cacheTTL);

    return new Response(JSON.stringify({
      data: candles,
      cached: false
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } });

  } catch (error) {
    console.error('Historical error:', error);
    
    if (cached) {
      return new Response(JSON.stringify({
        data: cached.data,
        cached: true,
        cacheAge: cached.age
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'STALE' } });
    }

    return new Response(JSON.stringify({ error: 'Failed to fetch historical data' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle market status request
async function handleMarketStatus(): Promise<Response> {
  const status = getMarketStatus();
  return new Response(JSON.stringify(status), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Default watchlist for collection (limited per BRAPI Free plan)
const DEFAULT_WATCHLIST = [
  'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'WEGE3', 'MGLU3',
  'ABEV3', 'B3SA3', 'RENT3', 'LREN3', 'SUZB3', 'JBSS3',
  'GGBR4', 'CSNA3', 'USIM5', 'CIEL3', 'BBAS3', 'SANB11',
  'ITSA4', 'TAEE11'
];

// Handle collect request (called by pg_cron via pg_net)
async function handleCollect(): Promise<Response> {
  const startTime = Date.now();
  const now = new Date().toISOString();
  
  try {
    // Fetch quotes sequentially to respect BRAPI Free limits
    const allQuotes: any[] = [];
    
    for (const symbol of DEFAULT_WATCHLIST) {
      try {
        // Small delay between requests to avoid rate limiting
        if (allQuotes.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        const results = await fetchBrapiQuotes([symbol]);
        if (results.length > 0) {
          const q = results[0];
          allQuotes.push({
            symbol: q.symbol,
            name: q.shortName || q.longName || q.symbol,
            price: q.regularMarketPrice || 0,
            change: q.regularMarketChange || 0,
            changePercent: q.regularMarketChangePercent || 0,
            volume: q.regularMarketVolume || 0,
            updatedAt: now
          });
        }
      } catch (err) {
        console.error(`Error fetching ${symbol}:`, err);
        // Continue with other symbols
      }
    }

    // Fetch macro data
    let macroData = null;
    try {
      const hgData = await fetchHgBrasilData();
      if (hgData) {
        macroData = {
          usdBrl: hgData.currencies?.USD ? {
            buy: hgData.currencies.USD.buy,
            sell: hgData.currencies.USD.sell,
            variation: hgData.currencies.USD.variation
          } : null,
          selic: hgData.taxes?.[0]?.selic || null,
          cdi: hgData.taxes?.[0]?.cdi || null
        };
      }
    } catch (err) {
      console.error('Error fetching macro data:', err);
    }

    const executionTime = Date.now() - startTime;

    return new Response(JSON.stringify({
      success: true,
      quotes: allQuotes,
      macro: macroData,
      quotesCount: allQuotes.length,
      executionTimeMs: executionTime,
      collectedAt: now
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Collect error:', error);
    const executionTime = Date.now() - startTime;
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: executionTime,
      collectedAt: now
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop() || '';
    const searchParams = url.searchParams;

    console.log(`Request: ${req.method} ${path}`);

    switch (path) {
      case 'market-overview':
        return await handleMarketOverview();
      
      case 'quote': {
        const symbolsParam = searchParams.get('symbols') || '';
        const symbols = symbolsParam.split(',').filter(s => s.trim());
        return await handleQuote(symbols);
      }
      
      case 'historical': {
        const symbol = searchParams.get('symbol') || '';
        const range = searchParams.get('range') || '1mo';
        return await handleHistorical(symbol, range);
      }
      
      case 'status':
        return await handleMarketStatus();
      
      case 'collect':
        return await handleCollect();
      
      default:
        return new Response(JSON.stringify({ 
          error: 'Invalid endpoint',
          availableEndpoints: ['market-overview', 'quote', 'historical', 'status', 'collect']
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Server error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
