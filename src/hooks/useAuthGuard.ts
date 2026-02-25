'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

/**
 * Hook that periodically checks if the current user's account is still active.
 * If the account is deactivated, signs out immediately and redirects to login.
 * 
 * @param intervalMs - Polling interval in milliseconds (default: 60 seconds)
 */
export function useAuthGuard(intervalMs = 60_000) {
    const router = useRouter();
    useEffect(() => {
        const supabase = createClient();

        const checkActive = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('active')
                .eq('id', session.user.id)
                .single();

            if (profile?.active === false) {
                await supabase.auth.signOut();
                router.replace('/login?deactivated=1');
            }
        };

        // Check on mount
        checkActive();

        // Poll periodically
        const id = setInterval(checkActive, intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);
}
