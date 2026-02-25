-- ==========================================
-- FEATURE: USER SESSIONS TRACKING (Realtime)
-- ==========================================

-- 1. Create the user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address TEXT,
    UNIQUE(user_id) -- Only one active tracking session per user in this simple implementation
);

-- 2. Setup RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can update their own session heartbeat
DROP POLICY IF EXISTS "Users can insert their own session" ON public.user_sessions;
CREATE POLICY "Users can insert their own session" ON public.user_sessions 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own session" ON public.user_sessions;
CREATE POLICY "Users can update their own session" ON public.user_sessions 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can read all sessions
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;
CREATE POLICY "Admins can view all sessions" ON public.user_sessions 
    FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin', 'manager')));

-- Users can read their own session (required for upsert to work properly sometimes)
DROP POLICY IF EXISTS "Users can view their own session" ON public.user_sessions;
CREATE POLICY "Users can view their own session" ON public.user_sessions 
    FOR SELECT TO authenticated 
    USING (auth.uid() = user_id);

-- Admins can delete sessions (e.g., Force Logout)
DROP POLICY IF EXISTS "Admins can delete sessions" ON public.user_sessions;
CREATE POLICY "Admins can delete sessions" ON public.user_sessions 
    FOR DELETE TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND LOWER(role) IN ('super_admin', 'gerant', 'admin', 'manager')));

-- 3. Enable Realtime
-- This requires adding the table to the supabase_realtime publication
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;

-- 4. Create the force_logout_user RPC (if not exists)
CREATE OR REPLACE FUNCTION public.force_logout_user(target_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    DELETE FROM auth.refresh_tokens WHERE user_id = target_user_id;
    DELETE FROM auth.sessions WHERE user_id = target_user_id;
    -- Also clear from the tracker table
    DELETE FROM public.user_sessions WHERE user_id = target_user_id;
END;
$$;
