"use client";

import { useState, useEffect } from "react";
import { X, Save, User, Banknote, Calendar, Eye, EyeOff, Briefcase, FileText, Trash2, Copy, Archive, Edit2 } from "lucide-react";
import { Employee, EmployeeRole } from "@/types";
import { formatPrice } from "@/config/currency";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";

interface EmployeeEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Partial<Employee> | null;
    onSave: (updated: Partial<Employee>) => void;
    onDelete?: (id: string) => void;
    onArchive?: (id: string) => void;
    // Mock permission: allow viewing salary? usually true for admin/gerant
    canViewSalary?: boolean;
}

const ROLES: EmployeeRole[] = [
    'Administrateur', 'GERANT', 'Responsable Commercial',
    'Responsable production et qualité', 'Vendeur',
    'Découpe pâte', 'Cuisson', 'Conditionnement'
];

export default function EmployeeEditModal({ isOpen, onClose, employee, onSave, onDelete, onArchive, canViewSalary = true }: EmployeeEditModalProps) {
    const supabase = createClient();
    const [formData, setFormData] = useState<Partial<Employee>>({});
    const [showSalary, setShowSalary] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'contract' | 'history'>('info');

    const [isAddingPayment, setIsAddingPayment] = useState(false);
    const [editingPaymentIndex, setEditingPaymentIndex] = useState<number | null>(null);
    const [newPayment, setNewPayment] = useState({ date: new Date().toISOString().split('T')[0], amount: 0 });

    useEffect(() => {
        const fetchHistory = async () => {
            if (employee?.id) {
                const { data } = await supabase
                    .from('employee_payments')
                    .select('*')
                    .eq('employee_id', employee.id)
                    .order('date', { ascending: false });
                if (data) setFormData(prev => ({ ...prev, paymentHistory: data }));
            }
        };

        if (employee) {
            setFormData(employee);
            fetchHistory();
        } else {
            setFormData({
                active: true,
                role: 'Vendeur',
                hireDate: new Date().toISOString().split('T')[0]
            });
        }
    }, [employee, isOpen, supabase]);

    useEffect(() => {
        if (isAddingPayment && formData.salary) {
            setNewPayment(prev => ({ ...prev, amount: formData.salary || 0 }));
        }
    }, [isAddingPayment, formData.salary]);

    const handleChange = (field: keyof Employee, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    const confirmAddPayment = async () => {
        if (!formData.id) return;

        if (editingPaymentIndex !== null && formData.paymentHistory && formData.paymentHistory[editingPaymentIndex]?.id) {
            // Update existing payment
            const paymentId = formData.paymentHistory[editingPaymentIndex].id;
            const { data, error } = await supabase
                .from('employee_payments')
                .update({ amount: newPayment.amount, date: newPayment.date })
                .eq('id', paymentId)
                .select();

            if (data && data.length > 0) {
                const updatedHistory = [...formData.paymentHistory];
                updatedHistory[editingPaymentIndex] = data[0];
                updatedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setFormData(prev => ({
                    ...prev,
                    paymentHistory: updatedHistory,
                    lastPaymentDate: updatedHistory[0]?.date
                }));
                // Also update lastPaymentDate on employee if it's the latest
                await supabase.from('employees').update({ lastPaymentDate: updatedHistory[0].date }).eq('id', formData.id);
            }
        } else {
            // Insert new payment
            const { data, error } = await supabase
                .from('employee_payments')
                .insert([{
                    employee_id: formData.id,
                    amount: newPayment.amount,
                    date: newPayment.date
                }])
                .select();

            if (data && data.length > 0) {
                const updatedHistory = [...(formData.paymentHistory || []), data[0]];
                updatedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setFormData(prev => ({
                    ...prev,
                    paymentHistory: updatedHistory,
                    lastPaymentDate: newPayment.date // new payment might not be the latest if backdated, but assuming it usually is or sorted above takes care of history; we should probably take updatedHistory[0].date
                }));

                // Update lastPaymentDate on employee
                await supabase.from('employees').update({ lastPaymentDate: updatedHistory[0].date }).eq('id', formData.id);
            }
        }

        setIsAddingPayment(false);
        setEditingPaymentIndex(null);
        setNewPayment({ date: new Date().toISOString().split('T')[0], amount: formData.salary || 0 });
    };

    const handleDeletePayment = async (index: number) => {
        if (!formData.paymentHistory) return;
        const paymentToDelete = formData.paymentHistory[index];

        if (confirm("Êtes-vous sûr de vouloir supprimer ce paiement ?")) {
            if (paymentToDelete.id) {
                await supabase.from('employee_payments').delete().eq('id', paymentToDelete.id);
            }
            const updatedHistory = [...formData.paymentHistory];
            updatedHistory.splice(index, 1);

            // Recompute last payment date
            const newLastPaymentDate = updatedHistory.length > 0 ? updatedHistory[0].date : null;

            setFormData(prev => ({
                ...prev,
                paymentHistory: updatedHistory,
                lastPaymentDate: newLastPaymentDate
            }));

            if (formData.id) {
                await supabase.from('employees').update({ lastPaymentDate: newLastPaymentDate }).eq('id', formData.id);
            }
        }
    };

    const startEditPayment = (index: number, payment: { date: string, amount: number }) => {
        setNewPayment({ ...payment });
        setEditingPaymentIndex(index);
        setIsAddingPayment(true);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {employee?.id ? "Fiche Employé" : "Nouvel Employé"}
                                </h2>
                                <p className="text-sm text-gray-500">{formData.fullName || "Nouvel arrivant"}</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 px-6">
                            {(['info', 'contract', 'history'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                        ? "border-[var(--cookie-brown)] text-[var(--cookie-brown)]"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    {tab === 'info' ? 'Informations' : tab === 'contract' ? 'Contrat & Salaire' : 'Historique'}
                                </button>
                            ))}
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {activeTab === 'info' && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400">
                                            {formData.fullName?.charAt(0) || <User />}
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom Complet</label>
                                            <input
                                                type="text"
                                                value={formData.fullName || ""}
                                                onChange={(e) => handleChange("fullName", e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={formData.email || ""}
                                                onChange={(e) => handleChange("email", e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                            <input
                                                type="tel"
                                                value={formData.phone || ""}
                                                onChange={(e) => handleChange("phone", e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes RH (Privé)</label>
                                        <textarea
                                            value={formData.notes || ""}
                                            onChange={(e) => handleChange("notes", e.target.value)}
                                            className="w-full p-2 border border-gray-200 rounded-lg h-24 resize-none"
                                            placeholder="Notes internes..."
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'contract' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                        <span className="text-sm font-medium text-gray-700">Statut Actif</span>
                                        <button
                                            onClick={() => handleChange("active", !formData.active)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.active ? 'bg-green-500' : 'bg-gray-300'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.active ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Poste / Rôle</label>
                                        <select
                                            value={formData.role || ""}
                                            onChange={(e) => handleChange("role", e.target.value)}
                                            className="w-full p-2 border border-gray-200 rounded-lg"
                                        >
                                            {ROLES.map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'entrée</label>
                                            <input
                                                type="date"
                                                value={formData.hireDate || ""}
                                                onChange={(e) => handleChange("hireDate", e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date de sortie (si applicable)</label>
                                            <input
                                                type="date"
                                                value={formData.exitDate || ""}
                                                min={formData.hireDate || ""}
                                                onChange={(e) => handleChange("exitDate", e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    {canViewSalary && (
                                        <div className="pt-4 border-t border-gray-100">
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                <Banknote className="h-4 w-4 text-green-600" /> Salaire Mensuel (Net)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showSalary ? "number" : "password"}
                                                    value={formData.salary || ""}
                                                    onChange={(e) => handleChange("salary", Number(e.target.value))}
                                                    className="w-full p-2 pr-10 border border-gray-200 rounded-lg font-mono"
                                                    disabled={!canViewSalary}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSalary(!showSalary)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showSalary ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">Visible uniquement par Administrateur et GÉRANT.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="space-y-4">
                                    <h3 className="font-medium text-gray-900 mb-2">Historique des paiements</h3>
                                    {formData.paymentHistory && formData.paymentHistory.length > 0 ? (
                                        <div className="space-y-2">
                                            {formData.paymentHistory.map((payment, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm font-medium text-gray-700">{new Date(payment.date).toLocaleDateString('fr-FR')}</span>
                                                        <span className="text-sm font-mono text-gray-900">{formatPrice(payment.amount)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => startEditPayment(idx, payment)}
                                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePayment(idx)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-gray-400 py-4 italic">Aucun historique disponible</p>
                                    )}
                                    {isAddingPayment ? (
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                                                    <input
                                                        type="date"
                                                        value={newPayment.date}
                                                        onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Montant</label>
                                                    <input
                                                        type="number"
                                                        value={newPayment.amount}
                                                        onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setIsAddingPayment(false);
                                                        setEditingPaymentIndex(null);
                                                        setNewPayment({ date: new Date().toISOString().split('T')[0], amount: formData.salary || 0 });
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg bg-white"
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                    onClick={confirmAddPayment}
                                                    className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm"
                                                >
                                                    {editingPaymentIndex !== null ? 'Modifier' : 'Ajouter'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsAddingPayment(true)}
                                            className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                                        >
                                            + Ajouter un paiement manuel
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50 rounded-b-2xl mt-auto">
                            {employee?.id && (
                                <div className="flex gap-2">
                                    {onArchive && formData.active && (
                                        <button
                                            onClick={() => {
                                                if (confirm(`Voulez-vous archiver l'employé ${formData.fullName} ?`)) {
                                                    onArchive(employee.id!);
                                                }
                                            }}
                                            className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg tooltip"
                                            title="Archiver"
                                        >
                                            <Archive className="h-4 w-4" />
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => onDelete(employee.id!)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            )}
                            <div className="flex gap-3 ml-auto">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="btn-primary px-6 py-2 shadow-lg hover:shadow-xl flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    Enregistrer
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
