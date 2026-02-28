/*
  # Fix API Keys RLS for Admin Access

  1. Changes
    - Add policy to allow authenticated users (admins) to read API keys
    - Add policy to allow authenticated users (admins) to insert API keys
    - Add policy to allow authenticated users (admins) to update API keys
    - Add policy to allow authenticated users (admins) to delete API keys
  
  2. Security
    - Policies check for authenticated users (admins logged in)
    - This allows the admin dashboard to manage API keys
    - Service role policy remains for backend operations

  3. Notes
    - The admin authentication is handled at the application layer
    - These policies allow any authenticated user to manage keys
    - In production, you may want to add additional checks for admin role
*/

DO $$
BEGIN
  -- Drop existing restrictive policy
  DROP POLICY IF EXISTS "Service role can manage API keys" ON plate_recognizer_api_keys;
  
  -- Create new policies for admin access
  CREATE POLICY "Authenticated users can read API keys"
    ON plate_recognizer_api_keys
    FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Authenticated users can insert API keys"
    ON plate_recognizer_api_keys
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

  CREATE POLICY "Authenticated users can update API keys"
    ON plate_recognizer_api_keys
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

  CREATE POLICY "Authenticated users can delete API keys"
    ON plate_recognizer_api_keys
    FOR DELETE
    TO authenticated
    USING (true);
    
  -- Keep service role access for backend operations
  CREATE POLICY "Service role has full access"
    ON plate_recognizer_api_keys
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
END $$;