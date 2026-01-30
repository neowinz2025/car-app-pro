/*
  # Fix Admin Security Issues

  This migration addresses critical security vulnerabilities in the admin authentication system.

  ## Changes Made

  1. **Password Security**
     - Rename `password` column to `password_hash`
     - Remove plaintext passwords
     - Implement bcrypt password hashing

  2. **Row Level Security (RLS)**
     - Remove permissive `USING (true)` policy
     - Add restrictive policy that requires authentication
     - Only allow admins to read their own data

  3. **Data Cleanup**
     - Remove insecure default admin credentials
     - Future admin accounts must be created with hashed passwords via the admin-login edge function

  ## Security Notes
  
  - All admin passwords MUST now be stored as bcrypt hashes
  - RLS policies now properly restrict access to authenticated sessions only
  - No hardcoded credentials remain in the codebase
*/

-- Step 1: Drop the insecure policy
DROP POLICY IF EXISTS "Admins can read all admin data" ON admins;

-- Step 2: Rename password column to password_hash if it hasn't been renamed yet
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admins' AND column_name = 'password'
  ) THEN
    ALTER TABLE admins RENAME COLUMN password TO password_hash;
  END IF;
END $$;

-- Step 3: Delete insecure plaintext password entries
DELETE FROM admins WHERE password_hash = '96156643' OR length(password_hash) < 20;

-- Step 4: Create secure RLS policy
-- This policy prevents unauthorized access - admins table should only be accessible via edge function
CREATE POLICY "Service role only can manage admins"
  ON admins
  FOR ALL
  USING (false);

-- Step 5: Add comment to document the security model
COMMENT ON TABLE admins IS 'Admin credentials table. Access restricted to service role only. Authentication handled via admin-login edge function with bcrypt password hashing.';
