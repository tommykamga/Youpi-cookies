"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { X, Save, Calendar, User, Flag, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Task, User as AppUser, Role } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";

interface TaskEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Partial<Task> | null;
    onSave: (updatedTask: Partial<Task>) => void;
    onDelete?: (id: string) => void;
    onDuplicate?: (task: Partial<Task>) => void;
}

// Removed mockUsers

export default function TaskEditModal({ isOpen, onClose, task, onSave, onDelete, onDuplicate }: TaskEditModalProps) {
    const supabase = createClient();
    const [formData, setFormData] = useState<Partial<Task>>({});
    const [employees, setEmployees] = useState<{ id: string, fullName: string }[]>([]);
    const { data: employeesData, error: employeesError, isLoading: loadingEmployees } = useSWR(
        isOpen ? 'active_employees' : null,
        async () => {
            const { data, error } = await supabase
                .from('employees')
                .select('id, fullName')
                .eq('active', true)
                .order('fullName');
            if (error) throw error;
            return data as { id: string, fullName: string }[];
        },
        {
            revalidateOnFocus: false, // Don't refetch on tab focus to save DB calls
            dedupingInterval: 60000,  // Cache for 1 minute before refetching on modal open
        }
    );

    useEffect(() => {
        if (employeesData) {
            setEmployees(employeesData);
        }
    }, [employeesData]);

    useEffect(() => {
        if (task) {
            setFormData(task);
        } else {
            // Default for new task
            setFormData({
                priority: 'medium',
                status: 'todo'
            });
        }
    }, [task, isOpen]);

    const handleChange = (field: keyof Task, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">
                                {task?.id ? "Modifier Tâche" : "Nouvelle Tâche"}
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                                <input
                                    type="text"
                                    value={formData.title || ""}
                                    onChange={(e) => handleChange("title", e.target.value)}
                                    placeholder="Ex: Relancer client..."
                                    className="w-full p-3 text-lg font-medium border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                    autoFocus
                                />
                            </div>

                            {/* Row 1: Assignee & Date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <User className="h-4 w-4" /> Assigné à
                                    </label>
                                    <select
                                        value={formData.assigned_to || ""}
                                        onChange={(e) => handleChange("assigned_to", e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                    >
                                        <option value="">Non assigné</option>
                                        {employees.map(p => (
                                            <option key={p.id} value={p.fullName}>{p.fullName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" /> Échéance
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.due_date || ""}
                                        onChange={(e) => handleChange("due_date", e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Priority & Status */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <Flag className="h-4 w-4" /> Priorité
                                    </label>
                                    <div className="flex gap-2">
                                        {(['low', 'medium', 'high'] as const).map(p => (
                                            <button
                                                key={p}
                                                onClick={() => handleChange("priority", p)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${formData.priority === p
                                                    ? p === 'high' ? 'bg-red-100 border-red-200 text-red-700'
                                                        : p === 'medium' ? 'bg-orange-100 border-orange-200 text-orange-700'
                                                            : 'bg-green-100 border-green-200 text-green-700'
                                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {p === 'high' ? 'Haute' : p === 'medium' ? 'Moyenne' : 'Basse'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" /> Statut
                                    </label>
                                    <select
                                        value={formData.status || "todo"}
                                        onChange={(e) => handleChange("status", e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                    >
                                        <option value="todo">À faire</option>
                                        <option value="in_progress">En cours</option>
                                        <option value="done">Terminée</option>
                                    </select>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm h-24 resize-none focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                    placeholder="Détails supplémentaires..."
                                    value={formData.description || ""}
                                    onChange={(e) => handleChange("description", e.target.value)}
                                ></textarea>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50 rounded-b-2xl mt-auto">
                            {task?.id && onDelete && (
                                <button
                                    onClick={() => onDelete(task.id!)}
                                    className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-2"
                                >
                                    Supprimer
                                </button>
                            )}
                            <div className="flex gap-3 ml-auto">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                                >
                                    Annuler
                                </button>
                                {task?.id && onDuplicate && (
                                    <button
                                        onClick={() => onDuplicate(formData)}
                                        className="px-4 py-2 text-[var(--cookie-brown)] hover:bg-orange-50 rounded-lg font-medium border border-transparent hover:border-orange-100"
                                    >
                                        Dupliquer
                                    </button>
                                )}
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
