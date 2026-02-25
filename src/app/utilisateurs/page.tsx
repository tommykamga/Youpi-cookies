"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Filter, MoreHorizontal, Shield, Mail, Phone, Loader2, UserCheck, UserX, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { User } from "@/types";
import UserEditModal from "@/components/users/UserEditModal";
import UserCreateModal from "@/components/users/UserCreateModal";
import ActiveSessions from "@/components/users/ActiveSessions";
import { deleteUser } from "@/app/actions/users";

// Mock Users Data (Fallback)
// Mock Users Data (Fallback)
const mockUsers: User[] = [
    { id: "1", full_name: "Tommy (Admin)", role: "admin", email: "admin@youpi.com", active: true, created_at: new Date().toISOString() },
    { id: "2", full_name: "Jean (Production)", role: "manager", email: "jean@youpi.com", active: true, created_at: new Date().toISOString() },
    { id: "3", full_name: "Sophie (Vente)", role: "commercial", email: "sophie@youpi.com", active: false, created_at: new Date().toISOString() },
    { id: "4", full_name: "Paul (Logistique)", role: "preparateur", email: "paul@youpi.com", active: true, created_at: new Date().toISOString() },
];

export default function UsersPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const supabase = createClient();

    const fetchUsers = async () => {
        try {
            // Try fetching from 'profiles' first (standard Supabase pattern)
            let { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name');

            if (error || !data) {
                console.warn("Profiles table not found or empty, trying 'users'...");
                // Fallback to 'users' if 'profiles' fails
                const response = await supabase
                    .from('users')
                    .select('*')
                    .order('full_name');

                data = response.data;
                error = response.error;
            }

            if (error) {
                // If both fail, throw to catch block
                throw error;
            }

            if (data && data.length > 0) {
                setUsers(data);
            } else {
                // Fallback to mock data if DB is empty to avoid empty table lookup
                console.log("No users found in DB, using mock data for display.");
                setUsers(mockUsers);
            }
        } catch (err) {
            console.warn('Using mock data for Users (DB fetch failed or empty).');
            // Fallback to mock data on error so UI doesn't break
            setUsers(mockUsers);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();

        // Get current user ID for self-deletion protection
        supabase.auth.getUser().then(({ data }: { data: any }) => {
            if (data.user) setCurrentUserId(data.user.id);
        });
    }, []);

    const filteredUsers = users.filter(user =>
        (user.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--cookie-brown)]" />
            </div>
        );
    }

    const handleSaveUser = (updatedUser: User) => {
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const handleDeleteUser = async (user: User) => {
        if (user.id === currentUserId) {
            alert("Impossible de supprimer votre propre compte.");
            return;
        }

        if (!confirm(`Supprimer définitivement ${user.full_name || user.email} ?\n\nCette action est irréversible.`)) {
            return;
        }

        setDeletingId(user.id);
        try {
            const result = await deleteUser(user.id);
            if (!result.success) {
                alert(result.error || "Erreur lors de la suppression.");
            } else {
                setUsers(prev => prev.filter(u => u.id !== user.id));
                alert("Utilisateur supprimé avec succès.");
            }
        } catch (err: any) {
            alert(err.message || "Erreur inattendue.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <UserEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={selectedUser}
                onSave={handleSaveUser}
            />

            <UserCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={() => {
                    fetchUsers();
                    alert("Utilisateur créé avec succès !");
                }}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-[var(--cookie-brown)]">Utilisateurs</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transform transition-transform hover:-translate-y-0.5"
                >
                    <Plus className="h-4 w-4" />
                    Nouvel Utilisateur
                </button>
            </div>

            {/* Sessions Actives (Live) */}
            <div className="mb-8">
                <ActiveSessions />
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un utilisateur..."
                        className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cookie-brown)]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map(user => (
                    <div key={user.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                        <div className="w-20 h-20 rounded-full bg-[var(--cookie-cream)] flex items-center justify-center text-[var(--cookie-brown)] text-2xl font-bold mb-4">
                            {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <h3 className="font-bold text-lg text-gray-900">{user.full_name || "Utilisateur"}</h3>
                        <div className="flex items-center gap-2 text-sm text-[var(--cookie-brown)] font-medium mt-1 mb-4">
                            <Shield className="h-4 w-4" />
                            {user.role}
                        </div>

                        <div className="w-full space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-600">
                            <div className="flex items-center justify-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                {user.email}
                            </div>
                            <div className={`flex items-center justify-center gap-2 font-medium ${user.active !== false ? 'text-green-600' : 'text-red-600'}`}>
                                {user.active !== false ? (
                                    <>
                                        <UserCheck className="h-4 w-4" />
                                        Actif
                                    </>
                                ) : (
                                    <>
                                        <UserX className="h-4 w-4" />
                                        Inactif
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6 w-full">
                            <button
                                onClick={() => { setSelectedUser(user); setIsEditModalOpen(true); }}
                                className="flex-1 text-sm text-[var(--cookie-brown)] hover:text-[var(--cookie-brown)]/80 font-medium border border-[var(--cookie-brown)]/20 hover:bg-[var(--cookie-brown)]/5 px-4 py-2 rounded-lg transition-colors"
                            >
                                Gérer l'accès
                            </button>
                            <button
                                onClick={() => handleDeleteUser(user)}
                                disabled={user.id === currentUserId || deletingId === user.id}
                                className="text-sm text-red-500 hover:text-white hover:bg-red-500 font-medium border border-red-200 px-3 py-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title={user.id === currentUserId ? "Impossible de supprimer votre propre compte" : "Supprimer"}
                            >
                                {deletingId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
