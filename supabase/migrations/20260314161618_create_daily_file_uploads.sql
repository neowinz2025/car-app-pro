/*
  # Create Daily File Uploads System

  ## Summary
  This migration creates a system to persist daily file uploads (CSV/XLSX) and their
  extracted data in the database, organized by date and file type.

  ## New Tables

  ### `daily_file_uploads`
  Stores metadata about each uploaded file per day.
  - `id` (uuid, primary key)
  - `upload_date` (date) — the projection date this file belongs to
  - `file_type` (text) — 'reservations', 'projection', 'di', 'lv', 'no', 'cq'
  - `file_name` (text) — original file name
  - `uploaded_at` (timestamptz) — when it was uploaded
  - `row_count` (integer) — how many rows were extracted

  ### `daily_file_rows`
  Stores the extracted data rows from each file (category + count per date).
  - `id` (uuid, primary key)
  - `upload_id` (uuid, FK → daily_file_uploads)
  - `upload_date` (date) — denormalized for fast queries
  - `file_type` (text) — same as parent
  - `category` (text) — vehicle group (AM, B, C, etc.)
  - `count` (integer) — number of vehicles for this category

  ## Security
  - RLS enabled on both tables
  - Anonymous users can read, insert, delete (for daily operations without auth)

  ## Notes
  - Composite index on (upload_date, file_type) for fast date-based lookups
  - When a new file is uploaded for the same date+type, old rows are replaced
*/

CREATE TABLE IF NOT EXISTS daily_file_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_date date NOT NULL,
  file_type text NOT NULL,
  file_name text NOT NULL DEFAULT '',
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  row_count integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS daily_file_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid NOT NULL REFERENCES daily_file_uploads(id) ON DELETE CASCADE,
  upload_date date NOT NULL,
  file_type text NOT NULL,
  category text NOT NULL,
  count integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_daily_file_uploads_date_type ON daily_file_uploads(upload_date, file_type);
CREATE INDEX IF NOT EXISTS idx_daily_file_rows_date_type ON daily_file_rows(upload_date, file_type);
CREATE INDEX IF NOT EXISTS idx_daily_file_rows_upload_id ON daily_file_rows(upload_id);

ALTER TABLE daily_file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_file_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read file uploads"
  ON daily_file_uploads FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert file uploads"
  ON daily_file_uploads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can delete file uploads"
  ON daily_file_uploads FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read file rows"
  ON daily_file_rows FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert file rows"
  ON daily_file_rows FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can delete file rows"
  ON daily_file_rows FOR DELETE
  TO anon, authenticated
  USING (true);
