-- ============================================================
-- Segurança: remove credencial embutida de collect_market_data()
-- ============================================================
-- Esta migration reaplica a função com leitura segura do segredo em runtime.
-- Configure o segredo via:
--   ALTER DATABASE postgres SET "app.settings.supabase_anon_key" = '<valor>';
-- ou escopo por role:
--   ALTER ROLE postgres SET "app.settings.supabase_anon_key" = '<valor>';

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
  v_edge_url := 'https://wuyrortvggsjawhviwzn.supabase.co/functions/v1/market-data/collect';
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
