/*
  # Add PDF URL to Damaged Vehicles

  1. Changes
    - Add `pdf_url` column to `damaged_vehicles` table to store the generated PDF report
    - Add `pdf_generated_at` timestamp to track when the PDF was created

  2. Notes
    - PDFs will be generated after photos are uploaded to save storage space
    - PDF serves as a compact, printable record for customer disputes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'damaged_vehicles' AND column_name = 'pdf_url'
  ) THEN
    ALTER TABLE damaged_vehicles ADD COLUMN pdf_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'damaged_vehicles' AND column_name = 'pdf_generated_at'
  ) THEN
    ALTER TABLE damaged_vehicles ADD COLUMN pdf_generated_at timestamptz;
  END IF;
END $$;
