/*
  # Add available_vehicles and projection columns to reservation_projections

  ## Changes
  - Adds `available_vehicles` (DI/NO) – number of available/returned vehicles for the category
  - Adds `projection` – number of vehicles expected to return (devoluções previstas)

  ## Notes
  1. Both columns default to 0 to preserve existing rows
  2. The TOTAL column (sobra/falta) is computed on the frontend:
       total = available_vehicles + projection - estimated_usage_from_reservations
     Positive = surplus (blue), Negative = shortage (red)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservation_projections' AND column_name = 'available_vehicles'
  ) THEN
    ALTER TABLE reservation_projections ADD COLUMN available_vehicles integer NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservation_projections' AND column_name = 'projection'
  ) THEN
    ALTER TABLE reservation_projections ADD COLUMN projection integer NOT NULL DEFAULT 0;
  END IF;
END $$;
