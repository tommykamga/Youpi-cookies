"use client";

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useSessionHeartbeat() {
    const supabase = createClient();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const updateHeartbeat = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) return;

                // Upsert the session for this user
                // We only track one active session per user for simplicity
                const { error } = await supabase
                    .from('user_sessions')
                    .upsert({
                        user_id: session.user.id,
                        last_seen_at: new Date().toISOString(),
                        user_agent: window.navigator.userAgent,
                    }, { onConflict: 'user_id' });

                if (error) {
                    console.error("Heartbeat error:", error);
                }
            } catch (err) {
                console.error("Failed to update heartbeat:", err);
            }
        };

        // Initial heartbeat on mount
        updateHeartbeat();

        // Set up recurring heartbeat
        intervalRef.current = setInterval(updateHeartbeat, HEARTBEAT_INTERVAL_MS);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [supabase]);
}
