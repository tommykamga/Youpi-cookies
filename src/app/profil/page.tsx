"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, Lock, Save, Loader2, Camera, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { User as UserType } from "@/types";

export default function ProfilePage() {
    const [user, setUser] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [passwordUpdating, setPasswordUpdating] = useState(false);
    const supabase = createClient();

    // Form States
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    // Password States
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (authUser) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', authUser.id)
                        .single();

                    if (profile) {
                        setUser({ ...profile, email: authUser.email });
                        setFullName(profile.full_name || "");
                        setPhone(profile.phone || "");
                        setAvatarUrl(profile.avatar_url || "");
                    }
                } else {
                    // Fallback Mock for Demo if not logged in
                    const mockUser: UserType = {
                        id: "mock-1",
                        email: "admin@youpi.com",
                        full_name: "Tommy (Admin)",
                        role: "admin",
                        phone: "699000000",
                        active: true,
                        created_at: new Date().toISOString(),
                        avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    };
                    setUser(mockUser);
                    setFullName(mockUser.full_name || "");
                    setPhone(mockUser.phone || "");
                    setAvatarUrl(mockUser.avatar_url || "");
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);

        try {
            if (user?.id === "mock-1") {
                // Mock Update
                await new Promise(resolve => setTimeout(resolve, 1000));
                setUser(prev => prev ? ({ ...prev, full_name: fullName, phone, avatar_url: avatarUrl }) : null);
                alert("Profil mis à jour (Simulation)");
            } else {
                // Real Update
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        full_name: fullName,
                        phone: phone,
                        avatar_url: avatarUrl
                    })
                    .eq('id', user?.id);

                if (error) throw error;
                alert("Profil mis à jour avec succès");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Erreur lors de la mise à jour");
        } finally {
            setUpdating(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("Les mots de passe ne correspondent pas");
            return;
        }

        setPasswordUpdating(true);
        try {
            if (user?.id === "mock-1") {
                // Mock
                await new Promise(resolve => setTimeout(resolve, 1000));
                alert("Mot de passe modifié (Simulation)");
            } else {
                const { error } = await supabase.auth.updateUser({
                    password: newPassword
                });
                if (error) throw error;
                alert("Mot de passe modifié avec succès");
            }
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            console.error("Error updating password:", error);
            alert("Erreur lors du changement de mot de passe");
        } finally {
            setPasswordUpdating(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        // Here we would implement real Supabase Storage upload
        // For now, we'll simulate a local preview
        const objectUrl = URL.createObjectURL(file);
        setAvatarUrl(objectUrl);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--cookie-brown)]" />
            </div>
        );
    }

    if (!user) return <div className="text-center py-12">Utilisateur non trouvé</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-[var(--cookie-brown)] to-[var(--cookie-brown-light)] opacity-10"></div>

                <div className="relative mb-4 mt-4 group">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100 mx-auto">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[var(--cookie-cream)] text-[var(--cookie-brown)]">
                                <span className="text-4xl font-bold">{user.full_name?.charAt(0) || user.email.charAt(0)}</span>
                            </div>
                        )}
                    </div>
                    <label className="absolute bottom-1 right-1 bg-[var(--cookie-brown)] text-white p-2.5 rounded-full cursor-pointer hover:bg-[var(--cookie-brown-light)] shadow-lg transition-transform hover:scale-110">
                        <Camera className="h-5 w-5" />
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </label>
                </div>

                <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
                <div className="flex items-center gap-2 text-[var(--cookie-brown)] font-medium mt-2 bg-[var(--cookie-cream)] px-4 py-1 rounded-full">
                    <Shield className="h-4 w-4" />
                    {user.role}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Info Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <User className="h-5 w-5 text-[var(--cookie-brown)]" />
                        Informations Personnelles
                    </h2>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+237 6..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={updating}
                                className="w-full btn-primary flex items-center justify-center gap-2 py-2.5"
                            >
                                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Mettre à jour
                            </button>
                        </div>
                    </form>
                </div>

                {/* Security Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Lock className="h-5 w-5 text-[var(--cookie-brown)]" />
                        Sécurité
                    </h2>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={passwordUpdating || !newPassword}
                                className="w-full bg-gray-900 text-white hover:bg-gray-800 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {passwordUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                                Changer le mot de passe
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 bg-blue-50 p-4 rounded-lg flex gap-3 text-sm text-blue-700">
                        <Shield className="h-5 w-5 flex-shrink-0" />
                        <p>
                            Pour votre sécurité, nous recommandons d'utiliser un mot de passe fort contenant des lettres, des chiffres et des symboles.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
