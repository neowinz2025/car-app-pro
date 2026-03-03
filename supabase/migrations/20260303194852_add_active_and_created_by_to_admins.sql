/*
  # Add active and created_by columns to admins table

  1. Modified Tables
    - `admins`
      - `active` (boolean, default true) - Whether admin account is active
      - `created_by` (text, nullable) - Username of admin who created this account

  2. Notes
    - Existing admins will have active = true by default
    - created_by will be null for existing admins
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admins' AND column_name = 'active'
  ) THEN
    ALTER TABLE admins ADD COLUMN active boolean NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admins' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE admins ADD COLUMN created_by text;
  END IF;
END $$;
