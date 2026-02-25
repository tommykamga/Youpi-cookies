"use client";

import { useState, useEffect } from "react";
import { X, Save, Calendar, Truck, User, Phone, MapPin, Package, FileText } from "lucide-react";
import { DeliveryCost } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

interface DeliveryCostModalProps {
    isOpen: boolean;
    onClose: () => void;
    delivery: Partial<DeliveryCost> | null;
    onSave: (data: Partial<DeliveryCost>) => void;
    onDelete?: (id: string) => void;
}

export default function DeliveryCostModal({ isOpen, onClose, delivery, onSave, onDelete }: DeliveryCostModalProps) {
    const [formData, setFormData] = useState<Partial<DeliveryCost>>({});

    useEffect(() => {
        if (delivery) {
            setFormData(delivery);
        } else {
            setFormData({
                delivery_date: new Date().toISOString().split('T')[0],
                origin: 'Nkolbong',
                transport_type: 'Moto',
                driver_name: '',
                destination: '',
                cost: 0
            });
        }
    }, [delivery, isOpen]);

    const handleChange = (field: keyof DeliveryCost, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
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
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">
                                {delivery?.id ? "Modifier Livraison" : "Nouvelle Livraison"}
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Date & Type */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" /> Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.delivery_date || ""}
                                        onChange={(e) => handleChange("delivery_date", e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <Truck className="h-4 w-4" /> Transport
                                    </label>
                                    <select
                                        value={formData.transport_type || "Moto"}
                                        onChange={(e) => handleChange("transport_type", e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                    >
                                        <option value="Moto">Moto</option>
                                        <option value="Taxi">Taxi</option>
                                    </select>
                                </div>
                            </div>

                            {/* Origin & Destination */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <MapPin className="h-4 w-4" /> Départ
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.origin || "Nkolbong"}
                                        onChange={(e) => handleChange("origin", e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <MapPin className="h-4 w-4" /> Destination
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Bastos..."
                                        value={formData.destination || ""}
                                        onChange={(e) => handleChange("destination", e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Driver Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <User className="h-4 w-4" /> Prestataire (Nom)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.driver_name || ""}
                                        onChange={(e) => handleChange("driver_name", e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <Phone className="h-4 w-4" /> Téléphone
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="+237..."
                                        value={formData.driver_phone || ""}
                                        onChange={(e) => handleChange("driver_phone", e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Cost & Cartons */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Coût (FCFA)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.cost || 0}
                                        onChange={(e) => handleChange("cost", parseFloat(e.target.value))}
                                        className="w-full p-2 border border-gray-200 rounded-lg font-mono text-right"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <Package className="h-4 w-4" /> Cartons
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.cartons || 0}
                                        onChange={(e) => handleChange("cartons", parserInt(e.target.value))}
                                        className="w-full p-2 border border-gray-200 rounded-lg text-right"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> Commande (ID)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="CMD-..."
                                        value={formData.order_id || ""}
                                        onChange={(e) => handleChange("order_id", e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm h-20 resize-none"
                                    placeholder="Détails supplémentaires..."
                                    value={formData.notes || ""}
                                    onChange={(e) => handleChange("notes", e.target.value)}
                                ></textarea>
                            </div>

                            {/* Footer */}
                            <div className="pt-4 flex justify-between items-center bg-gray-50 -mx-6 -mb-6 p-6 rounded-b-2xl border-t border-gray-100">
                                {delivery?.id && onDelete && (
                                    <button
                                        type="button"
                                        onClick={() => onDelete(delivery.id!)}
                                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                                    >
                                        Supprimer
                                    </button>
                                )}
                                <div className="flex gap-3 ml-auto">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary px-6 py-2 shadow-lg hover:shadow-xl flex items-center gap-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        Enregistrer
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function parserInt(value: string): any {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
}
