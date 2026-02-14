"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Cookie,
    ShoppingBag,
    Package,
    FileText,
    Calendar,
    LogOut,
    Settings,
    Loader2
} from "lucide-react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase";
import { Role } from "@/types";

interface NavItem {
    name: string;
    href: string;
    icon: any;
    roles?: Role[]; // If empty, visible to all
}

const navigation: NavItem[] = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Commandes", href: "/commandes", icon: ShoppingBag },
    { name: "Contacts", href: "/contacts", icon: Users },
    { name: "Produits", href: "/produits", icon: Cookie },
    { name: "Stocks", href: "/stocks", icon: Package },
    { name: "Facturation", href: "/facturation", icon: FileText },
    { name: "Planning", href: "/planning", icon: Calendar },
    { name: "RH", href: "/rh", icon: Users, roles: ['admin', 'manager'] },
    { name: "Utilisateurs", href: "/utilisateurs", icon: Settings, roles: ['admin'] },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [userRole, setUserRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setUserRole(profile.role as Role);
                }
            }
            setLoading(false);
        };
        fetchUserRole();
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    // Filtered navigation
    const filteredNav = navigation.filter(item =>
        !item.roles || (userRole && item.roles.includes(userRole))
    );

    return (
        <aside className={`
            fixed top-0 left-0 w-[280px] h-full bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] border-r border-[#6D4C41] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0 md:static md:shadow-none
        `}>
            <div className="p-6 border-b border-[#6D4C41]">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Cookie className="h-8 w-8 text-[var(--cookie-accent)]" />
                    Youpi
                </h1>
                <p className="text-xs text-red-300 mt-1 uppercase tracking-widest font-bold">
                    {loading ? "Chargement..." : userRole || "Utilisateur"}
                </p>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto h-[calc(100vh-140px)]">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-white/50" />
                    </div>
                ) : (
                    filteredNav.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onClose}
                                className={clsx(
                                    "menu-link flex items-center gap-3",
                                    isActive
                                        ? "bg-[var(--cookie-brown-light)] text-white"
                                        : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-white"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    })
                )}
            </nav>

            <div className="absolute bottom-0 w-full p-4 border-t border-[#6D4C41] bg-[var(--sidebar-bg)]">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors text-sm font-medium text-red-300"
                >
                    <LogOut className="h-5 w-5" />
                    Déconnexion
                </button>
            </div>
        </aside>
    );
}
