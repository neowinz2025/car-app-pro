/*
  # Add Admin Role Hierarchy System

  1. Changes
    - Add `role` column to `admins` table with two levels:
      - 'super_admin': Full access including API Keys configuration (developer)
      - 'admin': Can view data and manage users, but no API Keys access
    - Set default role to 'admin'
    - Update existing admin to 'super_admin' if exists
  
  2. Security
    - No RLS changes needed as admins table already has proper policies
    - Role validation happens in application layer
*/

DO $$
BEGIN
  -- Add role column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admins' AND column_name = 'role'
  ) THEN
    ALTER TABLE admins ADD COLUMN role text NOT NULL DEFAULT 'admin';
    
    -- Add check constraint for valid roles
    ALTER TABLE admins ADD CONSTRAINT admins_role_check 
      CHECK (role IN ('super_admin', 'admin'));
    
    -- Update first admin to super_admin (if exists)
    UPDATE admins 
    SET role = 'super_admin' 
    WHERE id = (SELECT id FROM admins ORDER BY created_at ASC LIMIT 1);
  END IF;
END $$;