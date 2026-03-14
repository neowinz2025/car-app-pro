/*
  # Create Reservation Projections Table

  ## Summary
  Creates a table to support the "Projeção de Reservas Futuras" feature — a
  vehicle category demand-planning tool that replaces a manual spreadsheet.

  ## New Tables

  ### `reservation_projections`
  Stores per-category reservation forecast data:
  - `id` – UUID primary key
  - `category` – Vehicle category code (AM, AT, B, BS, etc.), unique
  - `reservations_count` – Number of future reservations entered by the operator
  - `no_show_rate` – Percentage of reservations expected not to show up (0–100)
  - `created_at` / `updated_at` – Automatic timestamps

  ## Notes
  1. The table is global (not per-store) since it is an operational planning tool
     managed in the admin panel.
  2. Estimated usage is computed on the frontend:
       estimated_usage = floor(reservations_count × (1 − no_show_rate / 100))
  3. RLS is enabled. Anonymous users can read and write (consistent with the
     rest of the admin panel which operates without Supabase auth sessions).
*/

CREATE TABLE IF NOT EXISTS reservation_projections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL UNIQUE,
  reservations_count integer NOT NULL DEFAULT 0,
  no_show_rate numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE reservation_projections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read reservation_projections"
  ON reservation_projections
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert reservation_projections"
  ON reservation_projections
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update reservation_projections"
  ON reservation_projections
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated read reservation_projections"
  ON reservation_projections
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert reservation_projections"
  ON reservation_projections
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update reservation_projections"
  ON reservation_projections
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
