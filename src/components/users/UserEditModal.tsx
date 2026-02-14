import { useState, useEffect } from "react";
import { X, Save, Loader2, Shield, UserCheck, UserX, Phone, Lock } from "lucide-react";
import { User, Role } from "@/types";
import { updateUser } from "@/app/actions/users"; // Import Server Action

interface UserEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onSave: (updatedUser: User) => void;
}

const ROLES: { value: Role; label: string }[] = [
    { value: 'admin', label: 'Administrateur' },
    { value: 'manager', label: 'Manager' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'production', label: 'Responsable Production' },
    { value: 'preparateur', label: 'Préparateur' },
    { value: 'cutting', label: 'Découpe' },
    { value: 'cooking', label: 'Cuisson' },
    { value: 'packaging', label: 'Conditionnement' },
];

export default function UserEditModal({ isOpen, onClose, user, onSave }: UserEditModalProps) {
    const [role, setRole] = useState<Role>('production');
    const [isActive, setIsActive] = useState(true);
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState(""); // New field
    const [confirmPassword, setConfirmPassword] = useState(""); // New field

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setRole(user.role);
            setIsActive(user.active ?? true);
            setFullName(user.full_name || "");
            setPhone(user.phone || "");
            setPassword(""); // Reset password fields
            setConfirmPassword("");
        }
    }, [user]);

    if (!isOpen || !user) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password && password !== confirmPassword) {
            alert("Les mots de passe ne correspondent pas");
            return;
        }

        setLoading(true);

        try {
            // Call Server Action
            const result = await updateUser(user.id, {
                fullName,
                role,
                active: isActive,
                phone,
                password: password || undefined // Only send if changed
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            onSave({
                ...user,
                role,
                active: isActive,
                full_name: fullName,
                phone: phone
            });
            onClose();
            alert("Utilisateur mis à jour avec succès !");
        } catch (error: any) {
            console.error("Error updating user:", error);
            alert(error.message || "Erreur lors de la mise à jour de l'utilisateur.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-800">Gérer l'accès</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4">
                    {/* User Info Read-only */}
                    <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[var(--cookie-brown)] text-white flex items-center justify-center text-lg font-bold">
                            {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-bold text-gray-900 truncate">{user.full_name || "Utilisateur"}</p>
                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        </div>
                    </div>

                    {/* Name Edit */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                        />
                    </div>

                    {/* Phone Edit */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+237 6..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as Role)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none appearance-none bg-white"
                            >
                                {ROLES.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Active Status Toggle */}
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                            {isActive ? (
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                    <UserCheck className="h-5 w-5" />
                                </div>
                            ) : (
                                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                    <UserX className="h-5 w-5" />
                                </div>
                            )}
                            <div>
                                <p className="font-medium text-gray-900 text-sm">Statut du compte</p>
                                <p className="text-xs text-gray-500">
                                    {isActive ? "Actif" : "Bloqué"}
                                </p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>

                    {/* Password Reset Section (Admin Only) */}
                    <div className="border-t border-gray-100 pt-4 mt-2">
                        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Lock className="h-4 w-4 text-[var(--cookie-brown)]" />
                            Réinitialiser le mot de passe
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Nouveau mot de passe"
                                    className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                />
                            </div>
                            <div>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirmer"
                                    className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 italic">Laisser vide pour ne pas changer.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex items-center gap-2 px-6 py-2 text-sm"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
