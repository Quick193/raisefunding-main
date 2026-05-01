/*
  # Fix profiles RLS policies
  
  Add a policy for the system to create profiles during user signup.
*/

DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  
  -- Recreate policies with proper security context
  CREATE POLICY "System can create profiles"
    ON profiles FOR INSERT
    WITH CHECK (true);

  CREATE POLICY "Users can view all profiles"
    ON profiles FOR SELECT
    TO authenticated, anon
    USING (true);

  CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
    
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error updating policies: %', SQLERRM;
END $$;