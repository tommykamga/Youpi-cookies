"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// 30 minutes in milliseconds
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
// Throttle events to avoid performance issues (check every 5 seconds)
const THROTTLE_MS = 5000;

export function useInactivityLogout() {
    const router = useRouter();
    const supabase = createClient();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(Date.now());

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            router.push('/login?reason=inactivity');
        } catch (error) {
            console.error('Error auto-logging out:', error);
        }
    };

    const resetTimer = () => {
        const now = Date.now();
        // Throttle the reset so we aren't constantly clearing/setting intervals on every mousemove
        if (now - lastActivityRef.current < THROTTLE_MS) return;

        lastActivityRef.current = now;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
    };

    useEffect(() => {
        // Initial timer setup
        timeoutRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);

        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

        const handleUserActivity = () => {
            resetTimer();
        };

        events.forEach(event => {
            window.addEventListener(event, handleUserActivity, { passive: true });
        });

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, handleUserActivity);
            });
        };
    }, []);
}
