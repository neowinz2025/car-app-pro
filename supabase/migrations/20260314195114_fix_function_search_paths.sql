/*
  # Fix mutable search_path in functions

  ## Summary
  Sets a fixed search_path on the three functions that had a mutable
  search_path. A mutable search_path allows an attacker with CREATE privileges
  to place objects in a schema that shadows pg_catalog, potentially hijacking
  built-in functions. Setting `search_path = ''` and using fully-qualified names
  eliminates this risk.

  ## Functions fixed
  - public.update_user_password_updated_at
  - public.get_next_api_key
  - public.increment_api_key_usage
*/

CREATE OR REPLACE FUNCTION public.update_user_password_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_next_api_key()
RETURNS TABLE(key_id uuid, api_key text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
    public.plate_recognizer_api_keys.api_key,
    public.plate_recognizer_api_keys.usage_count,
    public.plate_recognizer_api_keys.monthly_limit,
    public.plate_recognizer_api_keys.reset_date
  INTO
    v_key_id,
    v_api_key,
    v_usage_count,
    v_monthly_limit,
    v_reset_date
  FROM public.plate_recognizer_api_keys
  WHERE active = true
  ORDER BY priority ASC, usage_count ASC
  LIMIT 1;

  IF v_key_id IS NULL THEN
    RAISE EXCEPTION 'No API keys available';
  END IF;

  IF CURRENT_DATE >= v_reset_date THEN
    UPDATE public.plate_recognizer_api_keys
    SET
      usage_count = 0,
      reset_date = CURRENT_DATE + interval '1 month',
      updated_at = now()
    WHERE id = v_key_id;

    v_usage_count := 0;
  END IF;

  IF v_usage_count >= v_monthly_limit THEN
    UPDATE public.plate_recognizer_api_keys
    SET active = false, updated_at = now()
    WHERE id = v_key_id;

    RETURN QUERY SELECT * FROM public.get_next_api_key();
    RETURN;
  END IF;

  RETURN QUERY SELECT v_key_id, v_api_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_api_key_usage(p_key_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.plate_recognizer_api_keys
  SET
    usage_count = usage_count + 1,
    updated_at = now()
  WHERE id = p_key_id;
END;
$$;
