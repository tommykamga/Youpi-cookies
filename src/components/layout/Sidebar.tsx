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
    permission?: string;
}

// Permission helper
const getUserPermissions = (role: Role | null) => {
    // Fallback permissions if role fetch fails (minimal access)
    if (!role) return ['dashboard', 'orders', 'products'];

    const roleLower = role.toLowerCase();

    // Admin sees everything
    if (roleLower === 'admin') {
        return ['dashboard', 'orders', 'contacts', 'products', 'stocks', 'billing', 'planning', 'rh', 'users'];
    }

    // Manager sees everything except users
    if (roleLower === 'manager' || roleLower === 'gérant') {
        return ['dashboard', 'orders', 'contacts', 'products', 'stocks', 'billing', 'planning', 'rh'];
    }

    // Default roles (Production, Sales, etc.)
    return ['dashboard', 'orders', 'contacts', 'products', 'stocks', 'billing', 'planning'];
};

const navigation: NavItem[] = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, permission: 'dashboard' },
    { name: "Commandes", href: "/commandes", icon: ShoppingBag, permission: 'orders' },
    { name: "Contacts", href: "/contacts", icon: Users, permission: 'contacts' },
    { name: "Produits", href: "/produits", icon: Cookie, permission: 'products' },
    { name: "Stocks", href: "/stocks", icon: Package, permission: 'stocks' },
    { name: "Facturation", href: "/facturation", icon: FileText, permission: 'billing' },
    { name: "Planning", href: "/planning", icon: Calendar, permission: 'planning' },
    { name: "Livraisons", href: "/livraisons", icon: Package, permission: 'orders' },
    { name: "RH", href: "/rh", icon: Users, permission: 'rh' },
    { name: "Utilisateurs", href: "/utilisateurs", icon: Settings, permission: 'users' },
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
                // Try fetching from 'profiles'
                let { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                // Fallback to 'users' if 'profiles' fails (404/error)
                if (error || !profile) {
                    console.warn('🔍 Profiles fetch failed, trying users table...', error?.message);
                    const { data: userTable } = await supabase
                        .from('users')
                        .select('role')
                        .eq('id', user.id)
                        .single();
                    if (userTable) profile = userTable;
                }

                if (profile) {
                    setUserRole(profile.role as Role);
                }

                // 🔍 USER DEBUG SNIPPET
                console.log('🔍 USER DEBUG:', {
                    role_in_db: profile?.role,
                    email: user?.email,
                    id: user?.id,
                    permissions: getUserPermissions(profile?.role as Role)
                });
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

    // Filtered navigation using the new helper
    const userPermissions = getUserPermissions(userRole);
    const filteredNav = navigation.filter(item =>
        !item.permission || userPermissions.includes(item.permission)
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
                                    "menu-link group transition-all duration-200",
                                    isActive
                                        ? "bg-[var(--cookie-brown-light)] text-white shadow-md translate-x-1"
                                        : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-white hover:translate-x-1"
                                )}
                            >
                                <div className={clsx(
                                    "flex-shrink-0 flex items-center justify-center w-6 h-6 transition-transform group-hover:scale-110",
                                    isActive ? "text-[var(--cookie-accent)]" : "text-white/70"
                                )}>
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <span className="font-medium truncate">{item.name}</span>
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
