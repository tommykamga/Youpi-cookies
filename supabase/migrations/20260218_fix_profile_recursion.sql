-- Create a SECURITY DEFINER function to check admin role without triggering RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop problematic policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Enable insert for users based on id" ON profiles;

-- Create correct policies using the secure function
-- 1. VIEW: Users can see their own profile. Admin can see everyone.
CREATE POLICY "Enable read access for authenticated users" ON profiles
    FOR SELECT
    USING (
        auth.uid() = id
        OR
        public.is_admin()
    );

-- 2. UPDATE: Users can update their own profile.
CREATE POLICY "Enable update for users based on id" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 3. INSERT: Users can insert their own profile
CREATE POLICY "Enable insert for users based on id" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
