"use client";

import { useState, useEffect } from "react";
import { Activity, LogOut, Clock, Loader2 } from "lucide-react";
import { getActiveSessions, forceLogout } from "@/app/actions/users";
import { createClient } from "@/lib/supabase/client";

interface ActiveSession {
    id: string;
    email: string;
    last_sign_in_at: string;
    full_name: string;
    role: string;
}

export default function ActiveSessions() {
    const [sessions, setSessions] = useState<ActiveSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSessions = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getActiveSessions();
            if (result.success && result.sessions) {
                setSessions(result.sessions);
            } else {
                setError(result.error || "Impossible de charger les sessions");
            }
        } catch (err: any) {
            setError(err.message || "Erreur inattendue");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();

        const supabase = createClient();

        // Setup Realtime subscription on user_sessions table
        const channel = supabase
            .channel('realtime_sessions')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'user_sessions' },
                () => {
                    fetchSessions();
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'user_sessions' },
                () => {
                    fetchSessions();
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'user_sessions' },
                () => {
                    fetchSessions();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleForceLogout = async (userId: string, userName: string) => {
        if (!confirm(`Forcer la déconnexion de ${userName} ? Sa session sera invalidée.`)) return;

        try {
            const result = await forceLogout(userId);
            if (result.success) {
                alert(`Déconnexion forcée pour ${userName}`);
                fetchSessions(); // Rafraîchir la liste
            } else {
                alert(`Erreur : ${result.error}`);
            }
        } catch (err: any) {
            alert(`Erreur inattendue : ${err.message}`);
        }
    };

    const getElapsedTime = (dateString: string) => {
        const diff = Date.now() - new Date(dateString).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}j`;
    };

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                <Activity className="h-5 w-5" />
                <p className="text-sm font-medium">Erreur sessions : {error}</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--cookie-brown)]/20 overflow-hidden">
            <div className="bg-[var(--cookie-brown)]/5 px-4 py-3 border-b border-[var(--cookie-brown)]/10 flex justify-between items-center">
                <div className="flex items-center gap-2 text-[var(--cookie-brown)] font-bold">
                    <Activity className="h-4 w-4" />
                    Utilisateurs connectés (live)
                </div>
                {!loading && (
                    <span className="text-xs font-medium bg-white px-2 py-1 rounded-full text-[var(--cookie-brown)] shadow-sm">
                        {sessions.length} connecté{sessions.length > 1 ? 's' : ''} (24h)
                    </span>
                )}
            </div>

            <div className="p-0">
                {loading ? (
                    <div className="p-6 flex justify-center items-center">
                        <Loader2 className="h-5 w-5 animate-spin text-[var(--cookie-brown)]" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                        Aucun utilisateur connecté récemment.
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                        {sessions.map(session => (
                            <li key={session.id} className="p-3 hover:bg-gray-50 flex items-center justify-between transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-[var(--cookie-brown)]/10 flex justify-center items-center text-[var(--cookie-brown)] font-bold text-xs">
                                        {session.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {session.full_name} <span className="text-xs text-gray-500 font-normal">({session.role})</span>
                                        </p>
                                        <div className="flex items-center gap-1 text-xs text-green-600 mt-0.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                            depuis {getElapsedTime(session.last_sign_in_at)}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleForceLogout(session.id, session.full_name)}
                                    className="flex items-center gap-1 text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                    title="Forcer la déconnexion"
                                >
                                    <LogOut className="h-3 w-3" />
                                    <span>Déconnecter</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
