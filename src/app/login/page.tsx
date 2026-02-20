"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Cookie, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(
        searchParams.get('deactivated') === '1'
            ? "Votre compte a été désactivé. Merci de contacter l'administrateur."
            : null
    );

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                console.error("Sign-in error details:", signInError);
                setError(signInError.message || "Identifiants incorrects ou problème de connexion.");
            } else if (authData.user) {
                // Check if account is active
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('active')
                    .eq('id', authData.user.id)
                    .single();

                if (profile?.active === false) {
                    await supabase.auth.signOut();
                    setError("Votre compte est désactivé. Merci de contacter l'administrateur.");
                } else {
                    router.push("/");
                    router.refresh();
                }
            }
        } catch (err: any) {
            console.error("Unexpected login error:", err);
            setError("Une erreur inattendue est survenue.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-[#EEDCC8] rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#D7B99D] rounded-full blur-3xl opacity-30" />

            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Logo Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-xl mb-4 group hover:scale-110 transition-transform duration-300">
                        <Cookie className="h-12 w-12 text-[#8D6E63] animate-bounce" />
                    </div>
                    <h1 className="text-4xl font-black text-[#5D4037] tracking-tight">Youpi <span className="text-[#8D6E63]">Cookies</span></h1>
                    <p className="text-[#A1887F] mt-2 font-medium">Gestion PME & Production</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm animate-in shake duration-300">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-[#5D4037] mb-2 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A1887F]" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-[#EEDCC8] rounded-2xl shadow-sm focus:ring-4 focus:ring-[#8D6E63]/10 focus:border-[#8D6E63] outline-none transition-all placeholder:text-[#D7B99D]"
                                    placeholder="admin@youpi.com"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2 ml-1">
                                <label className="text-sm font-bold text-[#5D4037]">Mot de passe</label>
                                <button type="button" className="text-xs font-bold text-[#8D6E63] hover:text-[#5D4037] transition-colors">
                                    Oublié ?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A1887F]" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-[#EEDCC8] rounded-2xl shadow-sm focus:ring-4 focus:ring-[#8D6E63]/10 focus:border-[#8D6E63] outline-none transition-all placeholder:text-[#D7B99D]"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#8D6E63] hover:bg-[#5D4037] text-white rounded-2xl font-bold shadow-lg shadow-[#8D6E63]/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-70"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <span className="text-lg">Se connecter</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-[#FDF8F3] text-center">
                        <p className="text-xs text-[#A1887F]">
                            Accès réservé au personnel de <br />
                            <span className="font-bold text-[#5D4037]">Yélélé Digit Mark SARL</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>}>
            <LoginForm />
        </Suspense>
    );
}
