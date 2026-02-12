-- ============================================================
-- Função de Coleta de Dados de Mercado
-- Chama Edge Function via pg_net e persiste os dados
-- ============================================================

-- Função principal de coleta
CREATE OR REPLACE FUNCTION public.collect_market_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_time TIMESTAMPTZ := clock_timestamp();
  v_response jsonb;
  v_request_id bigint;
  v_success BOOLEAN := false;
  v_quotes_count INTEGER := 0;
  v_error_message TEXT;
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_edge_url TEXT;
  v_anon_key TEXT;
BEGIN
  -- 1. Verificar se mercado está aberto
  IF NOT is_market_open() THEN
    INSERT INTO market_data_logs (success, quotes_count, error_message, execution_time_ms)
    VALUES (false, 0, 'Market is closed', 0);
    
    RETURN jsonb_build_object('success', false, 'reason', 'Market is closed');
  END IF;

  -- 2. Preparar chamada à Edge Function
  v_edge_url := 'https://iycqotgkopbyxpfdojal.supabase.co/functions/v1/market-data/collect';
  v_anon_key := nullif(trim(current_setting('app.settings.supabase_anon_key', true)), '');

  IF v_anon_key IS NULL THEN
    RAISE EXCEPTION 'Segredo ausente: configure app.settings.supabase_anon_key para executar collect_market_data()';
  END IF;

  -- 3. Chamar Edge Function via pg_net (async HTTP request)
  SELECT net.http_post(
    url := v_edge_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon_key
    ),
    body := '{}'::jsonb
  ) INTO v_request_id;

  -- Nota: pg_net é assíncrono, o resultado estará em net._http_response
  -- Para simplicidade, registramos a execução como iniciada
  INSERT INTO market_data_logs (success, quotes_count, error_message, execution_time_ms)
  VALUES (true, 0, 'Request initiated, id: ' || v_request_id::text, 
          EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::integer);

  RETURN jsonb_build_object(
    'success', true, 
    'request_id', v_request_id,
    'message', 'Collection request initiated'
  );

EXCEPTION WHEN OTHERS THEN
  v_error_message := SQLERRM;
  
  INSERT INTO market_data_logs (success, quotes_count, error_message, execution_time_ms)
  VALUES (false, 0, v_error_message, 
          EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::integer);
  
  RETURN jsonb_build_object('success', false, 'error', v_error_message);
END;
$$;

-- Função para processar resposta e persistir dados
-- Chamada manualmente ou por trigger após resposta do pg_net
CREATE OR REPLACE FUNCTION public.process_collected_data(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote jsonb;
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_inserted_count INTEGER := 0;
BEGIN
  -- Atualizar quotes_latest com UPSERT
  FOR v_quote IN SELECT * FROM jsonb_array_elements(p_data->'quotes')
  LOOP
    INSERT INTO quotes_latest (symbol, name, price, change, change_percent, volume, updated_at)
    VALUES (
      v_quote->>'symbol',
      v_quote->>'name',
      (v_quote->>'price')::numeric,
      (v_quote->>'change')::numeric,
      (v_quote->>'changePercent')::numeric,
      (v_quote->>'volume')::bigint,
      now()
    )
    ON CONFLICT (symbol) DO UPDATE SET
      name = EXCLUDED.name,
      price = EXCLUDED.price,
      change = EXCLUDED.change,
      change_percent = EXCLUDED.change_percent,
      volume = EXCLUDED.volume,
      updated_at = EXCLUDED.updated_at;
    
    v_inserted_count := v_inserted_count + 1;
  END LOOP;

  -- Verificar se é hora de fechar candle diário (após 17h)
  IF EXTRACT(HOUR FROM now() AT TIME ZONE 'America/Sao_Paulo') >= 17 
     AND NOT is_daily_closure_done(v_today) THEN
    
    -- Inserir candles diários a partir de quotes_latest
    INSERT INTO market_candles_daily (symbol, date, open, high, low, close, volume)
    SELECT 
      symbol,
      v_today,
      price, -- Simplificado: usando preço atual para todos os campos OHLC
      price,
      price,
      price,
      volume
    FROM quotes_latest
    ON CONFLICT (symbol, date) DO NOTHING;
    
    -- Registrar fechamento
    INSERT INTO daily_closure_log (date, symbols_count)
    VALUES (v_today, v_inserted_count)
    ON CONFLICT (date) DO NOTHING;
  END IF;

  -- Processar indicadores macro se presentes
  IF p_data->'macro' IS NOT NULL AND p_data->'macro' != 'null'::jsonb THEN
    IF p_data->'macro'->'selic' IS NOT NULL THEN
      INSERT INTO macro_indicators (indicator_name, value, date)
      VALUES ('SELIC', (p_data->'macro'->>'selic')::numeric, v_today)
      ON CONFLICT (indicator_name, date) DO UPDATE SET value = EXCLUDED.value;
    END IF;
    
    IF p_data->'macro'->'cdi' IS NOT NULL THEN
      INSERT INTO macro_indicators (indicator_name, value, date)
      VALUES ('CDI', (p_data->'macro'->>'cdi')::numeric, v_today)
      ON CONFLICT (indicator_name, date) DO UPDATE SET value = EXCLUDED.value;
    END IF;
    
    IF p_data->'macro'->'usdBrl'->'buy' IS NOT NULL THEN
      INSERT INTO macro_indicators (indicator_name, value, date)
      VALUES ('USD_BRL', (p_data->'macro'->'usdBrl'->>'buy')::numeric, v_today)
      ON CONFLICT (indicator_name, date) DO UPDATE SET value = EXCLUDED.value;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'quotesProcessed', v_inserted_count
  );
END;
$$;