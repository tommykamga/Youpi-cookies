
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Search, Menu } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { User } from "@/types";

interface HeaderProps {
    onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const [user, setUser] = useState<User | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                if (profile) {
                    setUser({ ...profile, email: authUser.email });
                }
            }
        };
        fetchUser();
    }, []);

    return (
        <header className="h-16 border-b border-[var(--border-color)] bg-white px-6 flex items-center justify-between sticky top-0 z-10 hidden md:flex">
            <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cookie-brown)] w-64"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="relative p-2 hover:bg-gray-100 rounded-full">
                    <Bell className="h-5 w-5 text-gray-600" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                </button>
                <Link
                    href="/profil"
                    className="flex items-center gap-3 pl-4 border-l border-gray-200 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                >
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900">{user?.full_name || "Utilisateur"}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role || "Invité"}</p>
                    </div>
                    <div className="h-8 w-8 bg-[var(--cookie-brown)] rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            (user?.full_name?.charAt(0) || "U").toUpperCase()
                        )}
                    </div>
                </Link>
            </div>
        </header>
    );
}
