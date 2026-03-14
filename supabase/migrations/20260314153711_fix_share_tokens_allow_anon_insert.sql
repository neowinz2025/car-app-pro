/*
  # Fix projection_share_tokens RLS to allow anonymous inserts

  ## Problem
  The app uses custom authentication (not Supabase Auth), so auth.uid() is always null.
  The INSERT policy restricted to `authenticated` role blocked all inserts.

  ## Changes
  - Drop the old INSERT, UPDATE, DELETE policies that required authenticated role
  - Replace with policies that allow anon role as well (the app validates access via admin session)
*/

DROP POLICY IF EXISTS "Authenticated users can insert share tokens" ON projection_share_tokens;
DROP POLICY IF EXISTS "Authenticated users can update share tokens" ON projection_share_tokens;
DROP POLICY IF EXISTS "Authenticated users can delete share tokens" ON projection_share_tokens;

CREATE POLICY "Anyone can insert share tokens"
  ON projection_share_tokens FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update share tokens"
  ON projection_share_tokens FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete share tokens"
  ON projection_share_tokens FOR DELETE
  USING (true);
