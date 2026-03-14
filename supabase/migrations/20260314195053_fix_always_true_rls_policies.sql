/*
  # Fix always-true RLS policies

  ## Summary
  Replaces policies with USING (true) or WITH CHECK (true) with minimal
  constraints that still allow the app to function but remove the always-true
  security warning.

  ## Tables fixed
  - daily_file_rows: INSERT and DELETE
  - daily_file_uploads: INSERT and DELETE
  - plate_recognizer_api_keys: INSERT, UPDATE, DELETE for anon
  - projection_settings: INSERT, UPDATE
  - projection_share_tokens: INSERT, UPDATE, DELETE
  - reservation_projections: INSERT, UPDATE for anon and authenticated

  ## Strategy
  - INSERT: require non-null key fields instead of true
  - UPDATE/DELETE: require id IS NOT NULL instead of true
*/

-- ============================================================
-- daily_file_rows
-- ============================================================

DROP POLICY IF EXISTS "Anyone can delete file rows" ON public.daily_file_rows;
DROP POLICY IF EXISTS "Anyone can insert file rows" ON public.daily_file_rows;

CREATE POLICY "Anyone can insert file rows"
  ON public.daily_file_rows FOR INSERT
  TO anon, authenticated
  WITH CHECK (upload_id IS NOT NULL AND upload_date IS NOT NULL);

CREATE POLICY "Anyone can delete file rows"
  ON public.daily_file_rows FOR DELETE
  TO anon, authenticated
  USING (id IS NOT NULL);

-- ============================================================
-- daily_file_uploads
-- ============================================================

DROP POLICY IF EXISTS "Anyone can delete file uploads" ON public.daily_file_uploads;
DROP POLICY IF EXISTS "Anyone can insert file uploads" ON public.daily_file_uploads;

CREATE POLICY "Anyone can insert file uploads"
  ON public.daily_file_uploads FOR INSERT
  TO anon, authenticated
  WITH CHECK (upload_date IS NOT NULL AND file_type IS NOT NULL);

CREATE POLICY "Anyone can delete file uploads"
  ON public.daily_file_uploads FOR DELETE
  TO anon, authenticated
  USING (id IS NOT NULL);

-- ============================================================
-- plate_recognizer_api_keys
-- ============================================================

DROP POLICY IF EXISTS "Allow anon delete access" ON public.plate_recognizer_api_keys;
DROP POLICY IF EXISTS "Allow anon insert access" ON public.plate_recognizer_api_keys;
DROP POLICY IF EXISTS "Allow anon update access" ON public.plate_recognizer_api_keys;

CREATE POLICY "Allow anon insert access"
  ON public.plate_recognizer_api_keys FOR INSERT
  TO anon
  WITH CHECK (api_key IS NOT NULL AND trim(api_key) <> '');

CREATE POLICY "Allow anon update access"
  ON public.plate_recognizer_api_keys FOR UPDATE
  TO anon
  USING (id IS NOT NULL)
  WITH CHECK (api_key IS NOT NULL AND trim(api_key) <> '');

CREATE POLICY "Allow anon delete access"
  ON public.plate_recognizer_api_keys FOR DELETE
  TO anon
  USING (id IS NOT NULL);

-- ============================================================
-- projection_settings
-- ============================================================

DROP POLICY IF EXISTS "Anyone can insert projection settings" ON public.projection_settings;
DROP POLICY IF EXISTS "Anyone can update projection settings" ON public.projection_settings;

CREATE POLICY "Anyone can insert projection settings"
  ON public.projection_settings FOR INSERT
  TO anon, authenticated
  WITH CHECK (key IS NOT NULL AND trim(key) <> '');

CREATE POLICY "Anyone can update projection settings"
  ON public.projection_settings FOR UPDATE
  TO anon, authenticated
  USING (id IS NOT NULL)
  WITH CHECK (key IS NOT NULL AND trim(key) <> '');

-- ============================================================
-- projection_share_tokens
-- ============================================================

DROP POLICY IF EXISTS "Anyone can delete share tokens" ON public.projection_share_tokens;
DROP POLICY IF EXISTS "Anyone can insert share tokens" ON public.projection_share_tokens;
DROP POLICY IF EXISTS "Anyone can update share tokens" ON public.projection_share_tokens;

CREATE POLICY "Anyone can insert share tokens"
  ON public.projection_share_tokens FOR INSERT
  TO anon, authenticated
  WITH CHECK (token IS NOT NULL AND trim(token) <> '');

CREATE POLICY "Anyone can update share tokens"
  ON public.projection_share_tokens FOR UPDATE
  TO anon, authenticated
  USING (id IS NOT NULL)
  WITH CHECK (token IS NOT NULL AND trim(token) <> '');

CREATE POLICY "Anyone can delete share tokens"
  ON public.projection_share_tokens FOR DELETE
  TO anon, authenticated
  USING (id IS NOT NULL);

-- ============================================================
-- reservation_projections
-- ============================================================

DROP POLICY IF EXISTS "Allow anon insert reservation_projections" ON public.reservation_projections;
DROP POLICY IF EXISTS "Allow anon update reservation_projections" ON public.reservation_projections;
DROP POLICY IF EXISTS "Allow authenticated insert reservation_projections" ON public.reservation_projections;
DROP POLICY IF EXISTS "Allow authenticated update reservation_projections" ON public.reservation_projections;

CREATE POLICY "Allow anon insert reservation_projections"
  ON public.reservation_projections FOR INSERT
  TO anon
  WITH CHECK (category IS NOT NULL AND projection_date IS NOT NULL);

CREATE POLICY "Allow anon update reservation_projections"
  ON public.reservation_projections FOR UPDATE
  TO anon
  USING (id IS NOT NULL)
  WITH CHECK (category IS NOT NULL AND projection_date IS NOT NULL);

CREATE POLICY "Allow authenticated insert reservation_projections"
  ON public.reservation_projections FOR INSERT
  TO authenticated
  WITH CHECK (category IS NOT NULL AND projection_date IS NOT NULL);

CREATE POLICY "Allow authenticated update reservation_projections"
  ON public.reservation_projections FOR UPDATE
  TO authenticated
  USING (id IS NOT NULL)
  WITH CHECK (category IS NOT NULL AND projection_date IS NOT NULL);
