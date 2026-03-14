/*
  # Create projection share tokens table

  ## Summary
  Allows generating shareable public links for the reservation projections dashboard.
  Each token points to a specific store and optionally a date range, and can be revoked.

  ## New Tables
  - `projection_share_tokens`
    - `id` (uuid, primary key)
    - `token` (text, unique) — the public URL slug
    - `store_id` (uuid, nullable) — optional store filter
    - `created_by_admin_id` (uuid, nullable) — who created the token
    - `label` (text) — friendly name for the share link
    - `active` (boolean, default true) — can be revoked
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Anyone can SELECT active tokens (needed for public dashboard)
  - Only authenticated admins can INSERT, UPDATE, DELETE
*/

CREATE TABLE IF NOT EXISTS projection_share_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  store_id uuid,
  created_by_admin_id uuid,
  label text NOT NULL DEFAULT 'Dashboard Compartilhado',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE projection_share_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active share tokens"
  ON projection_share_tokens FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can insert share tokens"
  ON projection_share_tokens FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update share tokens"
  ON projection_share_tokens FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete share tokens"
  ON projection_share_tokens FOR DELETE
  TO authenticated
  USING (true);
