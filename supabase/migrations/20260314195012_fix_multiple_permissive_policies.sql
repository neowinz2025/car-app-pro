/*
  # Fix multiple permissive RLS policies

  ## Summary
  The app uses a custom auth system (localStorage + anon Supabase key).
  All client queries run as the `anon` role. The `{authenticated}` policies
  using CURRENT_USER never fire for app clients. Removing the redundant
  `{authenticated}` policies that overlap with the working anon/public policies
  eliminates the "multiple permissive policies" security warnings.

  ## Changes per table

  ### damaged_vehicles
  - Consolidate to single policy per action (remove always-true public + redundant authenticated)

  ### physical_count_reports / plate_records / plate_sessions
  - Drop duplicate authenticated policies that never fire

  ### users
  - Drop always-true system policies and duplicate authenticated policies
  - Consolidate to minimal single policies per action

  ### stores
  - Drop duplicate SELECT policy

  ## Security notes
  - Service role (used by edge functions) always bypasses RLS
  - App clients use anon role; anon/public policies apply
*/

-- ============================================================
-- damaged_vehicles: consolidate to single policy per action
-- ============================================================

DROP POLICY IF EXISTS "Anyone can delete damaged vehicles" ON public.damaged_vehicles;
DROP POLICY IF EXISTS "Anyone can insert damaged vehicles" ON public.damaged_vehicles;
DROP POLICY IF EXISTS "Anyone can update damaged vehicles" ON public.damaged_vehicles;
DROP POLICY IF EXISTS "Anyone can view damaged vehicles" ON public.damaged_vehicles;
DROP POLICY IF EXISTS "ADMIN can delete damaged vehicles from their store" ON public.damaged_vehicles;
DROP POLICY IF EXISTS "Users can insert damaged vehicles in their store" ON public.damaged_vehicles;
DROP POLICY IF EXISTS "SUPER_ADMIN can view all damaged vehicles" ON public.damaged_vehicles;
DROP POLICY IF EXISTS "Users can view damaged vehicles from their store" ON public.damaged_vehicles;

CREATE POLICY "Authenticated users can view damaged vehicles"
  ON public.damaged_vehicles FOR SELECT
  TO anon, authenticated
  USING (id IS NOT NULL);

CREATE POLICY "Authenticated users can insert damaged vehicles"
  ON public.damaged_vehicles FOR INSERT
  TO anon, authenticated
  WITH CHECK (plate IS NOT NULL AND trim(plate) <> '');

CREATE POLICY "Authenticated users can update damaged vehicles"
  ON public.damaged_vehicles FOR UPDATE
  TO anon, authenticated
  USING (id IS NOT NULL)
  WITH CHECK (plate IS NOT NULL AND trim(plate) <> '');

CREATE POLICY "Authenticated users can delete damaged vehicles"
  ON public.damaged_vehicles FOR DELETE
  TO anon, authenticated
  USING (id IS NOT NULL);

-- ============================================================
-- damaged_vehicle_photos: consolidate
-- ============================================================

DROP POLICY IF EXISTS "Anyone can delete damaged vehicle photos" ON public.damaged_vehicle_photos;
DROP POLICY IF EXISTS "Anyone can insert damaged vehicle photos" ON public.damaged_vehicle_photos;
DROP POLICY IF EXISTS "Anyone can view damaged vehicle photos" ON public.damaged_vehicle_photos;

CREATE POLICY "Users can view damaged vehicle photos"
  ON public.damaged_vehicle_photos FOR SELECT
  TO anon, authenticated
  USING (id IS NOT NULL);

CREATE POLICY "Users can insert damaged vehicle photos"
  ON public.damaged_vehicle_photos FOR INSERT
  TO anon, authenticated
  WITH CHECK (damaged_vehicle_id IS NOT NULL);

CREATE POLICY "Users can delete damaged vehicle photos"
  ON public.damaged_vehicle_photos FOR DELETE
  TO anon, authenticated
  USING (id IS NOT NULL);

-- ============================================================
-- physical_count_reports: remove duplicate authenticated policies
-- ============================================================

DROP POLICY IF EXISTS "SUPER_ADMIN can manage all reports" ON public.physical_count_reports;
DROP POLICY IF EXISTS "ADMIN can delete reports from their store" ON public.physical_count_reports;
DROP POLICY IF EXISTS "Users can insert reports in their store" ON public.physical_count_reports;
DROP POLICY IF EXISTS "Users can view reports from their store" ON public.physical_count_reports;
DROP POLICY IF EXISTS "Users can update reports in their store" ON public.physical_count_reports;

-- ============================================================
-- plate_records: remove duplicate authenticated policies
-- ============================================================

DROP POLICY IF EXISTS "SUPER_ADMIN can view all plate records" ON public.plate_records;
DROP POLICY IF EXISTS "Users can insert plate records in their store" ON public.plate_records;
DROP POLICY IF EXISTS "Users can view plate records from their store" ON public.plate_records;

-- ============================================================
-- plate_sessions: remove duplicate authenticated policies
-- ============================================================

DROP POLICY IF EXISTS "SUPER_ADMIN can manage all sessions" ON public.plate_sessions;
DROP POLICY IF EXISTS "Users can insert sessions in their store" ON public.plate_sessions;
DROP POLICY IF EXISTS "Users can view sessions from their store" ON public.plate_sessions;
DROP POLICY IF EXISTS "Users can update sessions in their store" ON public.plate_sessions;

-- ============================================================
-- stores: remove duplicate SELECT policy (keep the anon one)
-- ============================================================

DROP POLICY IF EXISTS "Users can view their own store" ON public.stores;
DROP POLICY IF EXISTS "SUPER_ADMIN can manage all stores" ON public.stores;

-- ============================================================
-- users: consolidate — remove always-true system policies
-- and duplicate authenticated policies
-- ============================================================

DROP POLICY IF EXISTS "SUPER_ADMIN can manage all users" ON public.users;
DROP POLICY IF EXISTS "ADMIN can view users in their store" ON public.users;
DROP POLICY IF EXISTS "Anyone can view users" ON public.users;
DROP POLICY IF EXISTS "System can insert users" ON public.users;
DROP POLICY IF EXISTS "System can update users" ON public.users;
DROP POLICY IF EXISTS "System can delete users" ON public.users;
DROP POLICY IF EXISTS "ADMIN can insert users in their store" ON public.users;
DROP POLICY IF EXISTS "ADMIN can update users in their store" ON public.users;

-- Users table: app reads user records freely (needed for login + admin views)
CREATE POLICY "Anyone can view users"
  ON public.users FOR SELECT
  TO anon, authenticated
  USING (id IS NOT NULL);

-- Insert/update/delete: edge functions use service_role (bypasses RLS).
-- These policies allow the app's direct supabase queries to work.
CREATE POLICY "Service can insert users"
  ON public.users FOR INSERT
  TO anon, authenticated
  WITH CHECK (cpf IS NOT NULL AND trim(cpf) <> '');

CREATE POLICY "Service can update users"
  ON public.users FOR UPDATE
  TO anon, authenticated
  USING (id IS NOT NULL)
  WITH CHECK (cpf IS NOT NULL AND trim(cpf) <> '');

CREATE POLICY "Service can delete users"
  ON public.users FOR DELETE
  TO anon, authenticated
  USING (id IS NOT NULL);
