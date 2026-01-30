/*
  # Create Admin Authentication Table

  1. New Tables
    - `admins`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password` (text) - simple password storage
      - `created_at` (timestamp)
      - `last_login` (timestamp)

  2. Security
    - Enable RLS on `admins` table
    - Add policy for admins to read their own data

  3. Initial Data
    - Insert admin user: hugo200 / 96156643
*/

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all admin data"
  ON admins
  FOR SELECT
  USING (true);

-- Insert default admin user
INSERT INTO admins (username, password)
VALUES ('hugo200', '96156643')
ON CONFLICT (username) DO NOTHING;