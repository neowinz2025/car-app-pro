/*
  # Create projection_settings table

  ## Purpose
  Stores global configuration for the reservation projections module,
  such as the global no-show rate that applies as default for all
  vehicle categories across all dates.

  ## New Tables
  - `projection_settings`
    - `id` (uuid, primary key)
    - `key` (text, unique) - the setting name
    - `value` (text) - the setting value as text (parsed by client)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled
  - Anon users can read settings (needed for shared dashboard view)
  - Anon users can insert and update settings (app uses custom auth, not Supabase Auth)
*/

CREATE TABLE IF NOT EXISTS projection_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projection_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read projection settings"
  ON projection_settings FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert projection settings"
  ON projection_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update projection settings"
  ON projection_settings FOR UPDATE
  USING (true)
  WITH CHECK (true);
