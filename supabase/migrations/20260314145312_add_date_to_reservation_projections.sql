/*
  # Add projection_date to reservation_projections

  ## Summary
  Changes the table from a single global row per category to one row per category per date,
  enabling operators to view and compare projections across different dates.

  ## Changes
  1. Add `projection_date` column (date type, defaults to today)
  2. Drop the old UNIQUE constraint on `category` alone
  3. Add a new UNIQUE constraint on `(category, projection_date)`
  4. Backfill existing rows with today's date

  ## Notes
  - Existing data is preserved; rows without a date get today's date
  - The upsert on the frontend must now conflict on (category, projection_date)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservation_projections' AND column_name = 'projection_date'
  ) THEN
    ALTER TABLE reservation_projections ADD COLUMN projection_date date NOT NULL DEFAULT CURRENT_DATE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'reservation_projections'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'reservation_projections_category_key'
  ) THEN
    ALTER TABLE reservation_projections DROP CONSTRAINT reservation_projections_category_key;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'reservation_projections'
      AND constraint_name = 'reservation_projections_category_date_key'
  ) THEN
    ALTER TABLE reservation_projections
      ADD CONSTRAINT reservation_projections_category_date_key UNIQUE (category, projection_date);
  END IF;
END $$;
