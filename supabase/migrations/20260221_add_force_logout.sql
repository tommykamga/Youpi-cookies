-- Force logout a user by deleting all their sessions and refresh tokens
CREATE OR REPLACE FUNCTION public.force_logout_user(target_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Needs to run as superuser or have access to auth schema
AS $$
BEGIN
    DELETE FROM auth.refresh_tokens WHERE user_id = target_user_id;
    DELETE FROM auth.sessions WHERE user_id = target_user_id;
    RETURN true;
END;
$$;
