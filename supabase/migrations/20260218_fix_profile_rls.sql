-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to be safe (idempotency)
DROP POLICY IF EXISTS "Enable read access for users based on id" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Enable insert for users based on id" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create comprehensive policies

-- 1. VIEW: Users can see their own profile. Admin can see everyone.
CREATE POLICY "Enable read access for authenticated users" ON profiles
    FOR SELECT
    USING (auth.uid() = id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 2. UPDATE: Users can update their own profile.
CREATE POLICY "Enable update for users based on id" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 3. INSERT: Users can insert their own profile (signup trigger mainly, but good to have)
CREATE POLICY "Enable insert for users based on id" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);
