import { useState } from "react";
import { X, Save, Loader2, Shield, Eye, EyeOff } from "lucide-react";
import { Role } from "@/types";
import { createUser } from "@/app/actions/users"; // Import Server Action

interface UserCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
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

export default function UserCreateModal({ isOpen, onClose, onSave }: UserCreateModalProps) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<Role>('production');
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fullName || !email || !password) {
            alert("Veuillez remplir tous les champs obligatoires.");
            return;
        }

        setLoading(true);

        try {
            // Call Server Action
            const result = await createUser({
                email,
                fullName,
                role,
                password
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            // Reset form
            setFullName("");
            setEmail("");
            setRole('production');
            setPassword("");

            onSave(); // Refresh list and show toast in parent
            onClose();
        } catch (error: any) {
            console.error("Error creating user:", error);
            alert(error.message || "Erreur lors de la création de l'utilisateur.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-800">Nouvel Utilisateur</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Jean Dupont"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="jean@youpi.com"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                        />
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rôle <span className="text-red-500">*</span></label>
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

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe provisoire <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="******"
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
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
                            Créer l'utilisateur
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
