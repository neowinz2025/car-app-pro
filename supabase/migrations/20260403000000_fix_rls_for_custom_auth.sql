-- Migration: Fix RLS for Custom Auth System
-- Description: Restores access for 'anon' role (public) to plate_records and plate_sessions, 
-- ensuring the custom login (LocalStorage-based) can still insert and read data.

-- 1. Plate Records Policies
DROP POLICY IF EXISTS "SUPER_ADMIN can view all plate records" ON public.plate_records;
DROP POLICY IF EXISTS "Users can view plate records from their store" ON public.plate_records;
DROP POLICY IF EXISTS "Users can insert plate records in their store" ON public.plate_records;

-- Allow public read (necessary for the app to see session plates)
CREATE POLICY "Allow public read access to records"
  ON public.plate_records FOR SELECT
  USING (true);

-- Allow public insert (custom auth sends requests as 'anon' role)
CREATE POLICY "Allow public insert access to records"
  ON public.plate_records FOR INSERT
  WITH CHECK (true);

-- 2. Plate Sessions Policies
DROP POLICY IF EXISTS "SUPER_ADMIN can manage all sessions" ON public.plate_sessions;
DROP POLICY IF EXISTS "Users can view sessions from their store" ON public.plate_sessions;
DROP POLICY IF EXISTS "Users can insert sessions in their store" ON public.plate_sessions;
DROP POLICY IF EXISTS "Users can update sessions in their store" ON public.plate_sessions;

-- Allow public read access to sessions
CREATE POLICY "Allow public read access to sessions"
  ON public.plate_sessions FOR SELECT
  USING (true);

-- Allow public insert access to sessions
CREATE POLICY "Allow public insert access to sessions"
  ON public.plate_sessions FOR INSERT
  WITH CHECK (true);

-- Allow public update access to sessions
CREATE POLICY "Allow public update access to sessions"
  ON public.plate_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 3. Ensure store_id allows NULL for session data if not yet associated
ALTER TABLE public.plate_records ALTER COLUMN store_id DROP NOT NULL;
ALTER TABLE public.plate_sessions ALTER COLUMN store_id DROP NOT NULL;

-- 4. Enable Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.plate_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.plate_sessions;
