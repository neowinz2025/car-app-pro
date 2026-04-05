-- Atualiza a função de rotação para considerar 90% do limite como teto de segurança
CREATE OR REPLACE FUNCTION get_next_api_key()
RETURNS TABLE (
  key_id uuid,
  api_key text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key_id uuid;
  v_api_key text;
  v_usage_count integer;
  v_monthly_limit integer;
  v_reset_date date;
BEGIN
  SELECT 
    id, 
    plate_recognizer_api_keys.api_key,
    plate_recognizer_api_keys.usage_count,
    plate_recognizer_api_keys.monthly_limit,
    plate_recognizer_api_keys.reset_date
  INTO 
    v_key_id, 
    v_api_key,
    v_usage_count,
    v_monthly_limit,
    v_reset_date
  FROM plate_recognizer_api_keys
  WHERE active = true
  ORDER BY priority ASC, usage_count ASC
  LIMIT 1;

  IF v_key_id IS NULL THEN
    RAISE EXCEPTION 'No API keys available';
  END IF;

  IF CURRENT_DATE >= v_reset_date THEN
    UPDATE plate_recognizer_api_keys
    SET 
      usage_count = 0,
      reset_date = CURRENT_DATE + interval '1 month',
      updated_at = now()
    WHERE id = v_key_id;
    
    v_usage_count := 0;
  END IF;

  -- Rotação de segurança configurada para 90%
  IF v_usage_count >= (v_monthly_limit * 0.90) THEN
    UPDATE plate_recognizer_api_keys
    SET active = false, updated_at = now()
    WHERE id = v_key_id;
    
    RETURN QUERY SELECT * FROM get_next_api_key();
    RETURN;
  END IF;

  RETURN QUERY SELECT v_key_id, v_api_key;
END;
$$;
