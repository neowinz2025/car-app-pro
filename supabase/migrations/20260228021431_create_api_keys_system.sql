/*
  # Create API Keys Management System

  1. New Tables
    - `plate_recognizer_api_keys`
      - `id` (uuid, primary key)
      - `api_key` (text, encrypted API key)
      - `name` (text, friendly name for the key)
      - `usage_count` (integer, current usage count)
      - `monthly_limit` (integer, limit per month - default 2500)
      - `reset_date` (date, when the counter resets)
      - `active` (boolean, whether the key is active)
      - `priority` (integer, order of key rotation)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `plate_recognizer_api_keys` table
    - Add policy for service role to manage keys
    - No direct user access to API keys

  3. Functions
    - Function to get next available API key
    - Function to increment usage count
*/

CREATE TABLE IF NOT EXISTS plate_recognizer_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key text NOT NULL,
  name text NOT NULL DEFAULT '',
  usage_count integer NOT NULL DEFAULT 0,
  monthly_limit integer NOT NULL DEFAULT 2500,
  reset_date date NOT NULL DEFAULT (CURRENT_DATE + interval '1 month'),
  active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE plate_recognizer_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage API keys"
  ON plate_recognizer_api_keys
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_api_keys_active_priority 
  ON plate_recognizer_api_keys(active, priority) 
  WHERE active = true;

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

  IF v_usage_count >= v_monthly_limit THEN
    UPDATE plate_recognizer_api_keys
    SET active = false, updated_at = now()
    WHERE id = v_key_id;
    
    RETURN QUERY SELECT * FROM get_next_api_key();
    RETURN;
  END IF;

  RETURN QUERY SELECT v_key_id, v_api_key;
END;
$$;

CREATE OR REPLACE FUNCTION increment_api_key_usage(p_key_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE plate_recognizer_api_keys
  SET 
    usage_count = usage_count + 1,
    updated_at = now()
  WHERE id = p_key_id;
END;
$$;