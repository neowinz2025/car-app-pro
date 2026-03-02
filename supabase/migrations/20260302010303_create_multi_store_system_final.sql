/*
  # Sistema Multi-Lojas com Hierarquia de Permissões

  1. Nova Tabela `stores`
    - `id` (uuid, primary key)
    - `name` (text) - Nome da loja
    - `logo_url` (text, optional) - URL do logo da loja
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
    - `is_active` (boolean) - Status da loja

  2. Alterações na Tabela `users`
    - Adicionar constraint de role para SUPER_ADMIN, ADMIN, OPERADOR
    - `store_id` (uuid, foreign key) - Loja vinculada (null para SUPER_ADMIN)

  3. Alterações em outras tabelas
    - `damaged_vehicles` - adicionar store_id
    - `plate_records` - adicionar store_id
    - `plate_sessions` - adicionar store_id
    - `physical_count_reports` - adicionar store_id

  4. Security
    - Enable RLS on `stores` table
    - Add policies based on user roles
    - Update RLS policies for all tables to respect store boundaries
*/

-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add the new constraint with new roles (data already updated via execute_sql)
ALTER TABLE users ADD CONSTRAINT valid_role 
  CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'OPERADOR'));

-- Add store_id to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'store_id'
  ) THEN
    ALTER TABLE users ADD COLUMN store_id uuid REFERENCES stores(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add store_id to damaged_vehicles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'damaged_vehicles' AND column_name = 'store_id'
  ) THEN
    ALTER TABLE damaged_vehicles ADD COLUMN store_id uuid REFERENCES stores(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add store_id to plate_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plate_records' AND column_name = 'store_id'
  ) THEN
    ALTER TABLE plate_records ADD COLUMN store_id uuid REFERENCES stores(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add store_id to plate_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plate_sessions' AND column_name = 'store_id'
  ) THEN
    ALTER TABLE plate_sessions ADD COLUMN store_id uuid REFERENCES stores(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add store_id to physical_count_reports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'physical_count_reports' AND column_name = 'store_id'
  ) THEN
    ALTER TABLE physical_count_reports ADD COLUMN store_id uuid REFERENCES stores(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_damaged_vehicles_store_id ON damaged_vehicles(store_id);
CREATE INDEX IF NOT EXISTS idx_plate_records_store_id ON plate_records(store_id);
CREATE INDEX IF NOT EXISTS idx_plate_sessions_store_id ON plate_sessions(store_id);
CREATE INDEX IF NOT EXISTS idx_physical_count_reports_store_id ON physical_count_reports(store_id);

-- Enable RLS on stores table
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Stores policies
CREATE POLICY "SUPER_ADMIN can manage all stores"
  ON stores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.cpf = current_user
      AND users.role = 'SUPER_ADMIN'
      AND users.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.cpf = current_user
      AND users.role = 'SUPER_ADMIN'
      AND users.active = true
    )
  );

CREATE POLICY "Users can view their own store"
  ON stores FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT store_id FROM users
      WHERE users.cpf = current_user
      AND store_id IS NOT NULL
      AND users.active = true
    )
  );

CREATE POLICY "Anyone can view active stores"
  ON stores FOR SELECT
  TO anon
  USING (is_active = true);

-- Update users RLS policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;

CREATE POLICY "SUPER_ADMIN can manage all users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.cpf = current_user
      AND u.role = 'SUPER_ADMIN'
      AND u.active = true
    )
  );

CREATE POLICY "ADMIN can view users in their store"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.cpf = current_user
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
      AND u.active = true
      AND (u.role = 'SUPER_ADMIN' OR u.store_id = users.store_id)
    )
  );

CREATE POLICY "ADMIN can insert users in their store"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.cpf = current_user
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
      AND u.active = true
      AND (u.role = 'SUPER_ADMIN' OR u.store_id = users.store_id)
    )
  );

CREATE POLICY "ADMIN can update users in their store"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.cpf = current_user
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
      AND u.active = true
      AND (u.role = 'SUPER_ADMIN' OR u.store_id = users.store_id)
    )
  );

-- Update damaged_vehicles RLS policies
DROP POLICY IF EXISTS "Admins can view all damaged vehicles" ON damaged_vehicles;
DROP POLICY IF EXISTS "Admins can insert damaged vehicles" ON damaged_vehicles;
DROP POLICY IF EXISTS "Admins can delete damaged vehicles" ON damaged_vehicles;

CREATE POLICY "SUPER_ADMIN can view all damaged vehicles"
  ON damaged_vehicles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.cpf = current_user
      AND users.role = 'SUPER_ADMIN'
      AND users.active = true
    )
  );

CREATE POLICY "Users can view damaged vehicles from their store"
  ON damaged_vehicles FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT store_id FROM users
      WHERE users.cpf = current_user
      AND store_id IS NOT NULL
      AND users.active = true
    )
  );

CREATE POLICY "Users can insert damaged vehicles in their store"
  ON damaged_vehicles FOR INSERT
  TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM users
      WHERE users.cpf = current_user
      AND store_id IS NOT NULL
      AND users.active = true
    )
  );

CREATE POLICY "ADMIN can delete damaged vehicles from their store"
  ON damaged_vehicles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.cpf = current_user
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
      AND u.active = true
      AND (u.role = 'SUPER_ADMIN' OR u.store_id = damaged_vehicles.store_id)
    )
  );

-- Update plate_records RLS policies
DROP POLICY IF EXISTS "Admins can view all plate records" ON plate_records;
DROP POLICY IF EXISTS "Admins can insert plate records" ON plate_records;

CREATE POLICY "SUPER_ADMIN can view all plate records"
  ON plate_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.cpf = current_user
      AND users.role = 'SUPER_ADMIN'
      AND users.active = true
    )
  );

CREATE POLICY "Users can view plate records from their store"
  ON plate_records FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT store_id FROM users
      WHERE users.cpf = current_user
      AND store_id IS NOT NULL
      AND users.active = true
    )
  );

CREATE POLICY "Users can insert plate records in their store"
  ON plate_records FOR INSERT
  TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM users
      WHERE users.cpf = current_user
      AND store_id IS NOT NULL
      AND users.active = true
    )
  );

-- Update plate_sessions RLS policies
DROP POLICY IF EXISTS "Admins can view all sessions" ON plate_sessions;
DROP POLICY IF EXISTS "Admins can insert sessions" ON plate_sessions;
DROP POLICY IF EXISTS "Admins can update sessions" ON plate_sessions;

CREATE POLICY "SUPER_ADMIN can manage all sessions"
  ON plate_sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.cpf = current_user
      AND users.role = 'SUPER_ADMIN'
      AND users.active = true
    )
  );

CREATE POLICY "Users can view sessions from their store"
  ON plate_sessions FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT store_id FROM users
      WHERE users.cpf = current_user
      AND store_id IS NOT NULL
      AND users.active = true
    )
  );

CREATE POLICY "Users can insert sessions in their store"
  ON plate_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM users
      WHERE users.cpf = current_user
      AND store_id IS NOT NULL
      AND users.active = true
    )
  );

CREATE POLICY "Users can update sessions in their store"
  ON plate_sessions FOR UPDATE
  TO authenticated
  USING (
    store_id IN (
      SELECT store_id FROM users
      WHERE users.cpf = current_user
      AND store_id IS NOT NULL
      AND users.active = true
    )
  );

-- Update physical_count_reports RLS policies
DROP POLICY IF EXISTS "Admins can view all reports" ON physical_count_reports;
DROP POLICY IF EXISTS "Admins can insert reports" ON physical_count_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON physical_count_reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON physical_count_reports;

CREATE POLICY "SUPER_ADMIN can manage all reports"
  ON physical_count_reports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.cpf = current_user
      AND users.role = 'SUPER_ADMIN'
      AND users.active = true
    )
  );

CREATE POLICY "Users can view reports from their store"
  ON physical_count_reports FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT store_id FROM users
      WHERE users.cpf = current_user
      AND store_id IS NOT NULL
      AND users.active = true
    )
  );

CREATE POLICY "Users can insert reports in their store"
  ON physical_count_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM users
      WHERE users.cpf = current_user
      AND store_id IS NOT NULL
      AND users.active = true
    )
  );

CREATE POLICY "Users can update reports in their store"
  ON physical_count_reports FOR UPDATE
  TO authenticated
  USING (
    store_id IN (
      SELECT store_id FROM users
      WHERE users.cpf = current_user
      AND store_id IS NOT NULL
      AND users.active = true
    )
  );

CREATE POLICY "ADMIN can delete reports from their store"
  ON physical_count_reports FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.cpf = current_user
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
      AND u.active = true
      AND (u.role = 'SUPER_ADMIN' OR u.store_id = physical_count_reports.store_id)
    )
  );