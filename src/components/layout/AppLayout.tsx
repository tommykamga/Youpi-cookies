"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { useSessionHeartbeat } from "@/hooks/useSessionHeartbeat";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";

    const toggleSidebar = () => {
        console.log('🚀 Toggle burger:', !sidebarOpen);
        setSidebarOpen(prev => !prev);
    };

    // Auto-close on route change
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    // Close outside click + Escape
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sidebarOpen && !(event.target as Element).closest('.sidebar-container') && !(event.target as Element).closest('button')) {
                setSidebarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [sidebarOpen]);

    // Active account polling (checks every 60s if the user is still active)
    useAuthGuard(60_000);

    // Inactivity logout (30 mins)
    useInactivityLogout();

    // Session heartbeat (tracking active users)
    useSessionHeartbeat();

    // If login page, just return children without the layout
    if (isLoginPage) {
        return <div className="min-h-screen bg-[var(--background)]">{children}</div>;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[var(--background)]">
            {/* HEADER FIXE MOBILE (Custom) */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 md:hidden h-16 transition-all duration-300">
                <div className="flex items-center justify-between px-4 h-full">
                    <h1 className="font-bold text-xl text-[var(--cookie-brown)]">Youpi Cookies</h1>

                    {/* BURGER ANIMÉ → CROIX */}
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-all focus:outline-none"
                        aria-label="Menu"
                    >
                        <div className="w-6 h-5 relative flex flex-col justify-between overflow-hidden">
                            <div className={`w-6 h-0.5 bg-gray-900 transition-all duration-300 origin-center ${sidebarOpen ? 'absolute top-1/2 -translate-y-1/2 rotate-45' : 'relative'}`} />
                            <div className={`w-6 h-0.5 bg-gray-900 transition-all duration-300 ${sidebarOpen ? 'opacity-0 translate-x-full' : 'relative opacity-100'}`} />
                            <div className={`w-6 h-0.5 bg-gray-900 transition-all duration-300 origin-center ${sidebarOpen ? 'absolute top-1/2 -translate-y-1/2 -rotate-45' : 'relative'}`} />
                        </div>
                    </button>
                </div>
            </header>

            {/* OVERLAY FOND NOIR */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full pt-16 md:pt-0">
                <Header onMenuClick={toggleSidebar} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
                    <ErrorBoundary>
                        {children}
                    </ErrorBoundary>
                </main>
            </div>
        </div>
    );
}
