-- ============================================================
-- Persistência de Dados de Mercado - Migração Principal
-- Ref: .lovable/plan.md
-- ============================================================

-- 1. Ativar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- 2. Tabelas Base
-- ============================================================

-- 2.1 Tabela principal de candles diários (SEM particionamento)
CREATE TABLE public.market_candles_daily (
  id UUID DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  open NUMERIC(12,4) NOT NULL,
  high NUMERIC(12,4) NOT NULL,
  low NUMERIC(12,4) NOT NULL,
  close NUMERIC(12,4) NOT NULL,
  volume BIGINT,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (symbol, date)
);

-- Índice B-Tree para consultas ordenadas
CREATE INDEX idx_candles_symbol_date_desc ON public.market_candles_daily (symbol, date DESC);

-- Índice BRIN para scans de range de datas
CREATE INDEX idx_candles_date_brin ON public.market_candles_daily USING BRIN (date);

-- 2.2 Tabela de cache de cotações mais recentes
CREATE TABLE public.quotes_latest (
  symbol TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(12,4) NOT NULL,
  change NUMERIC(12,4),
  change_percent NUMERIC(8,4),
  volume BIGINT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. Tabelas Auxiliares
-- ============================================================

-- 3.1 Indicadores macroeconômicos
CREATE TABLE public.macro_indicators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  indicator_name TEXT NOT NULL,
  value NUMERIC(12,4) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(indicator_name, date)
);

-- 3.2 Calendário de mercado B3
CREATE TABLE public.market_calendar (
  date DATE PRIMARY KEY,
  is_trading_day BOOLEAN NOT NULL DEFAULT true,
  holiday_name TEXT,
  notes TEXT
);

-- 3.3 Log de fechamentos diários (controle de idempotência)
CREATE TABLE public.daily_closure_log (
  date DATE PRIMARY KEY,
  closed_at TIMESTAMPTZ DEFAULT now(),
  symbols_count INTEGER
);

-- 3.4 Logs de execução da coleta
CREATE TABLE public.market_data_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  executed_at TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN NOT NULL,
  quotes_count INTEGER,
  error_message TEXT,
  execution_time_ms INTEGER
);

-- ============================================================
-- 4. Habilitar RLS (leitura pública, escrita bloqueada)
-- ============================================================

ALTER TABLE public.market_candles_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes_latest ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.macro_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_closure_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública
CREATE POLICY "Candles are publicly readable" 
ON public.market_candles_daily FOR SELECT USING (true);

CREATE POLICY "Latest quotes are publicly readable" 
ON public.quotes_latest FOR SELECT USING (true);

CREATE POLICY "Macro indicators are publicly readable" 
ON public.macro_indicators FOR SELECT USING (true);

CREATE POLICY "Market calendar is publicly readable" 
ON public.market_calendar FOR SELECT USING (true);

CREATE POLICY "Closure logs are publicly readable" 
ON public.daily_closure_log FOR SELECT USING (true);

CREATE POLICY "Execution logs are publicly readable" 
ON public.market_data_logs FOR SELECT USING (true);

-- ============================================================
-- 5. Popular calendário com feriados B3 2026
-- ============================================================

INSERT INTO public.market_calendar (date, is_trading_day, holiday_name) VALUES
  ('2026-01-01', false, 'Confraternização Universal'),
  ('2026-02-16', false, 'Carnaval'),
  ('2026-02-17', false, 'Carnaval'),
  ('2026-04-03', false, 'Sexta-feira Santa'),
  ('2026-04-21', false, 'Tiradentes'),
  ('2026-05-01', false, 'Dia do Trabalho'),
  ('2026-06-04', false, 'Corpus Christi'),
  ('2026-09-07', false, 'Independência do Brasil'),
  ('2026-10-12', false, 'Nossa Senhora Aparecida'),
  ('2026-11-02', false, 'Finados'),
  ('2026-11-20', false, 'Consciência Negra'),
  ('2026-12-25', false, 'Natal'),
  ('2026-12-31', false, 'Último dia do ano');

-- ============================================================
-- 6. Funções SQL
-- ============================================================

-- 6.1 Verificar se mercado está aberto
CREATE OR REPLACE FUNCTION public.is_market_open()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now() AT TIME ZONE 'America/Sao_Paulo';
  v_date DATE := v_now::date;
  v_hour INTEGER := EXTRACT(HOUR FROM v_now);
  v_dow INTEGER := EXTRACT(DOW FROM v_now);
  v_is_holiday BOOLEAN;
BEGIN
  -- Verificar fim de semana (0 = domingo, 6 = sábado)
  IF v_dow IN (0, 6) THEN
    RETURN false;
  END IF;
  
  -- Verificar feriado no calendário
  SELECT NOT COALESCE(is_trading_day, true) INTO v_is_holiday
  FROM market_calendar
  WHERE date = v_date;
  
  IF v_is_holiday IS TRUE THEN
    RETURN false;
  END IF;
  
  -- Verificar horário de pregão (10h às 17h BRT)
  IF v_hour >= 10 AND v_hour < 17 THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- 6.2 Verificar se candle diário já foi registrado
CREATE OR REPLACE FUNCTION public.is_daily_closure_done(p_date DATE)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM daily_closure_log WHERE date = p_date);
END;
$$;