"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Filter, Trash2, Edit2, Truck, Package, MapPin, Calendar, Banknote } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { DeliveryCost } from "@/types";
import DeliveryCostModal from "@/components/deliveries/DeliveryCostModal";
import { motion, AnimatePresence } from "framer-motion";

export default function DeliveriesPage() {
    const supabase = createClient();
    const [deliveries, setDeliveries] = useState<DeliveryCost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState<Partial<DeliveryCost> | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchDeliveries = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('delivery_costs')
            .select('*')
            .order('delivery_date', { ascending: false });

        if (data) setDeliveries(data as DeliveryCost[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const handleNew = () => {
        setSelectedDelivery(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: DeliveryCost) => {
        setSelectedDelivery(item);
        setIsModalOpen(true);
    };

    const handleSave = async (data: Partial<DeliveryCost>) => {
        if (!data.id) {
            const { data: inserted, error } = await supabase
                .from('delivery_costs')
                .insert([data])
                .select()
                .single();
            if (inserted) setDeliveries([inserted, ...deliveries]);
        } else {
            const { error } = await supabase
                .from('delivery_costs')
                .update(data)
                .eq('id', data.id);
            if (!error) {
                setDeliveries(prev => prev.map(d => d.id === data.id ? { ...d, ...data } as DeliveryCost : d));
            }
        }
        setIsModalOpen(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer cette livraison ?")) return;
        const { error } = await supabase.from('delivery_costs').delete().eq('id', id);
        if (!error) {
            setDeliveries(prev => prev.filter(d => d.id !== id));
        }
        setIsModalOpen(false);
    };

    const filteredDeliveries = useMemo(() => {
        return deliveries.filter(d =>
            d.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.order_id && d.order_id.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [deliveries, searchTerm]);

    const totalCost = filteredDeliveries.reduce((sum, d) => sum + (d.cost || 0), 0);

    return (
        <div className="space-y-6">
            <DeliveryCostModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                delivery={selectedDelivery}
                onSave={handleSave}
                onDelete={handleDelete}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--cookie-brown)]">Suivi Livraisons</h1>
                    <p className="text-sm text-gray-500">
                        {filteredDeliveries.length} livraisons • Total: {totalCost.toLocaleString('fr-FR')} FCFA
                    </p>
                </div>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--cookie-brown)] text-white rounded-full text-sm font-medium hover:bg-opacity-90 shadow-lg transition-all"
                >
                    <Plus className="h-4 w-4" />
                    Nouvelle Course
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Rechercher par destination, chauffeur, commande..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cookie-brown)]"
                />
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Transport</th>
                                <th className="px-6 py-4 font-medium">Trajet</th>
                                <th className="px-6 py-4 font-medium">Chauffeur</th>
                                <th className="px-6 py-4 font-medium text-right">Coût</th>
                                <th className="px-6 py-4 font-medium">Détails</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <AnimatePresence>
                                {filteredDeliveries.map(item => (
                                    <motion.tr
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-gray-50 group cursor-pointer"
                                        onClick={() => handleEdit(item)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {new Date(item.delivery_date).toLocaleDateString('fr-FR')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${item.transport_type === 'Moto' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                <Truck className="h-3 w-3" />
                                                {item.transport_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-xs">
                                                <span className="text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.origin}</span>
                                                <span className="font-medium text-gray-900 ml-4">↳ {item.destination}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{item.driver_name}</div>
                                            {item.driver_phone && <div className="text-xs text-gray-400">{item.driver_phone}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-[var(--cookie-brown)]">
                                            {item.cost?.toLocaleString('fr-FR')} FCFA
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {item.cartons ? <div className="flex items-center gap-1"><Package className="h-3 w-3" /> {item.cartons} ctns</div> : null}
                                            {item.order_id ? <div className="text-blue-600 font-medium">#{item.order_id}</div> : null}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-gray-400 hover:text-[var(--cookie-brown)] transition-colors">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {filteredDeliveries.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                        Aucune course trouvée.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
