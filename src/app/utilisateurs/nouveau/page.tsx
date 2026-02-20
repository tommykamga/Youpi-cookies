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

        try {
            // 1. Check if email already exists in the profiles table
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email.toLowerCase().trim())
                .maybeSingle();

            if (existing) {
                alert("Cet email est déjà enregistré. Utilisez la récupération de mot de passe si nécessaire.");
                setIsSaving(false);
                return;
            }

            // 2. Create User in Supabase Auth
            // The on_auth_user_created trigger auto-inserts into profiles table
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.toLowerCase().trim(),
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
                alert(`Erreur lors de la création du compte : ${authError.message}`);
                setIsSaving(false);
                return;
            }

            // 3. Detect Supabase fake-success (email exists but no error returned)
            if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
                alert("Cet email est déjà enregistré. Utilisez la récupération de mot de passe si nécessaire.");
                setIsSaving(false);
                return;
            }

            if (authData.user) {
                // Profile is auto-created by the DB trigger (on_auth_user_created)
                // No manual insert needed
                alert("Utilisateur créé avec succès !");
                router.push("/utilisateurs");
            } else {
                alert("La création du compte a échoué. Veuillez réessayer.");
            }
        } catch (err: any) {
            console.error('Unexpected error:', err);
            alert(`Erreur inattendue : ${err.message}`);
        } finally {
            setIsSaving(false);
        }
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
