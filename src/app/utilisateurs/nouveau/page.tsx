"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Role } from "@/types";

const roles: Role[] = ['admin', 'manager', 'commercial', 'production', 'preparateur', 'cutting', 'cooking', 'packaging'];

export default function NewUserPage() {
    const router = useRouter();
    const supabase = createClient();
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<Role>("production");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fullName || !email || !password) {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        setIsSaving(true);

        // 1. Create User in Supabase Auth (Client-side limitation: this signs in the user)
        // ideally this should be a server action or use supabase-admin
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                }
            }
        });

        if (authError) {
            console.error('Error creating auth user:', authError);
            alert(`Erreur Auth: ${authError.message}`);
            setIsSaving(false);
            return;
        }

        if (authData.user) {
            // 2. Insert into 'users' table (assuming it's separate from auth.users and we need to sync manually or via trigger)
            // If there's a trigger, this might fail with duplicate key, so check implementation.
            // For now, let's assume we need to insert manually if no trigger exists.

            const { error: dbError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    email: email,
                    full_name: fullName,
                    role: role,
                    // created_at is automatic
                });

            if (dbError) {
                console.error('Error creating user profile:', dbError);
                // If the error is duplicate key, it means a trigger handled it.
                if (dbError.code !== '23505') {
                    alert(`Erreur DB: ${dbError.message}`);
                    setIsSaving(false);
                    return;
                }
            }

            alert("Utilisateur créé avec succès !");
            router.push("/utilisateurs");
        }

        setIsSaving(false);
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/utilisateurs" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-2xl font-bold text-[var(--cookie-brown)]">Nouvel Utilisateur</h1>
            </div>

            <div className="card">
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom Complet <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Jean Dupont"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                        <input
                            type="email"
                            required
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="jean@youpi.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rôle <span className="text-red-500">*</span></label>
                        <select
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                            value={role}
                            onChange={(e) => setRole(e.target.value as Role)}
                        >
                            {roles.map(r => (
                                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe provisoire <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="******"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères.</p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                        <Link
                            href="/utilisateurs"
                            className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="btn-primary flex items-center gap-2 px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
