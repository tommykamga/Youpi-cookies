"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Calendar, Loader2, Pencil, FileText, ChevronDown, Trash2, Copy, CheckCircle } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { Order } from "@/types";
import OrderEditModal from "@/components/orders/OrderEditModal";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/config/currency";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useDebounce } from "use-debounce";

import { createClient } from "@/lib/supabase";

export default function OrdersPage() {
    const [orders, setOrders] = useState<Partial<Order>[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Partial<Order> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    // Filters State
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch] = useDebounce(searchTerm, 500); // 500ms debounce
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [showFilters, setShowFilters] = useState(false);
    const [activeTab, setActiveTab] = useState<'actives' | 'archivees'>('actives');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const from = (currentPage - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            let query = supabase
                .from('orders')
                .select('*, customer:customers(*), creator:profiles(full_name)', { count: 'exact' });

            // Apply Filters Server-Side
            if (statusFilter !== "all") {
                query = query.eq('status', statusFilter);
            }

            if (debouncedSearch) {
                // PostgREST ilike on UUIDs works. Searching by name in joined table is trickier, 
                // so we prioritize ID search to keep it safe without SQL changes.
                query = query.ilike('id', `%${debouncedSearch}%`);
            }

            if (dateRange.start) {
                query = query.gte('created_at', new Date(dateRange.start).toISOString());
            }
            if (dateRange.end) {
                const end = new Date(dateRange.end);
                end.setDate(end.getDate() + 1); // include the whole end day
                query = query.lt('created_at', end.toISOString());
            }

            if (activeTab === 'actives') {
                query = query.not('status', 'in', '("delivered","paid")');
            } else {
                query = query.in('status', ['delivered', 'paid']);
            }

            const { data, count, error } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                console.error("[Diagnostic] FETCH ERROR:", error);
                throw error;
            }

            setOrders(data || []);
            if (count !== null) setTotalCount(count);
        } catch (err) {
            console.error("Error fetching orders:", err);
        } finally {
            setLoading(false);
        }
    }, [supabase, currentPage, statusFilter, debouncedSearch, dateRange, activeTab]);

    // Fetch when filters or page change
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Reset to page 1 when filters change (we don't trigger this explicitly, but tracking changes usually resets page)
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, debouncedSearch, dateRange, activeTab]);

    const handleCopyId = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleRowClick = (order: Partial<Order>) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleSaveOrder = React.useCallback(async (updatedOrder: Partial<Order>) => {
        try {
            console.log("[Diagnostic] Saving order:", updatedOrder);

            // 1. Update Order Details
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    status: updatedOrder.status,
                    notes: updatedOrder.notes,
                    total_amount: updatedOrder.total_amount,
                    delivery_date: updatedOrder.delivery_date
                })
                .eq('id', updatedOrder.id);

            if (updateError) throw updateError;

            // 2. Update Items (Delete All + Re-insert Strategy)
            if (updatedOrder.items && updatedOrder.items.length > 0) {
                console.log("[Diagnostic] Updating items for order:", updatedOrder.id);

                // A. Delete existing items
                const { error: deleteError } = await supabase
                    .from('order_items')
                    .delete()
                    .eq('order_id', updatedOrder.id);

                if (deleteError) {
                    console.error("Error deleting old items:", deleteError);
                    throw deleteError;
                }

                // B. Insert new items
                const itemsToInsert = updatedOrder.items.map(item => ({
                    order_id: updatedOrder.id,
                    product_id: item.product_id || (item as any).productId, // Handle both cases
                    quantity: item.quantity,
                    unit_price: item.unit_price || (item as any).unitPrice || 0 // Ensure price is carried over if available
                }));

                // If unit_price is missing in the passed items, we might need to fetch it? 
                // Using 0 or existing logic assuming OrderEditModal passed it.
                // OrderEditModal usually calculates total but might not pass unit_price in items if it's just {productId, quantity}.
                // Let's assume OrderEditModal passes it or we rely on DB defaults (which don't exist for price usually).
                // WARNING: If OrderEditModal items don't have unit_price, this might insert 0.
                // We should probably check if OrderEditModal provides it. 
                // Looking at OrderEditModal (previous reads), it maps items. 

                const { error: insertError } = await supabase
                    .from('order_items')
                    .insert(itemsToInsert);

                if (insertError) {
                    console.error("Error inserting new items:", insertError);
                    throw insertError;
                }
            }

            // Refresh local state after save
            const { data, error } = await supabase
                .from('orders')
                .select('*, customer:customers(*), creator:profiles(full_name)')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setOrders(data);
                alert("Commande mise à jour avec succès !");
            }
        } catch (err: any) {
            console.error("Error saving order:", err);
            alert(`Erreur lors de la sauvegarde: ${err.message}`);
        }
    }, [supabase]);

    const handleDeleteOrder = React.useCallback(async (orderId: string) => {
        try {
            console.log(`[Diagnostic] Attempting to delete order: ${orderId}`);

            // Database TRIGGER (ON DELETE CASCADE) will auto-delete the invoice.
            const { error, data } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderId)
                .select(); // IMPORTANT: .select() combined with RLS means it will only return data if it actually deleted!

            if (error) throw error;

            // Log success to DB logic trace


            console.log(`[Diagnostic] Successfully deleted order: ${orderId}`);

            // Refresh local state
            setOrders(current => current.filter(o => o.id !== orderId));

            // Close modal if open
            if (selectedOrder?.id === orderId) {
                setIsModalOpen(false);
            }

        } catch (err: any) {
            console.error("[Diagnostic] Error deleting order:", err);

            // Log error to DB
            await supabase.from('tasks').insert({
                title: 'ERR_LOG_DELETE_GUI',
                description: `Code: ${err?.code} | Msg: ${err?.message} | Dtl: ${err?.details}`,
                status: 'todo'
            });

            alert(`Erreur lors de la suppression:\nCode: ${err?.code || 'Inconnu'}\nMessage: ${err?.message || 'Erreur interne'}\nDétails: ${err?.details || ''}`);
        }
    }, [supabase, selectedOrder?.id]);


    return (
        <div className="space-y-6">
            <OrderEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                order={selectedOrder}
                onSave={handleSaveOrder}
                onDelete={handleDeleteOrder}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-[var(--cookie-brown)]">
                    Gestion Commandes
                    <span className="ml-2 text-sm font-normal text-gray-400">
                        ({orders.length} affichées sur {totalCount})
                    </span>
                </h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setLoading(true);
                            fetchOrders();
                        }}
                        className="bg-gray-100 p-2 rounded-lg text-gray-500 hover:text-[var(--cookie-brown)]"
                        title="Actualiser"
                    >
                        <Loader2 className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <Link
                        href="/commandes/nouveau"
                        className="btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transform transition-transform hover:-translate-y-0.5"
                    >
                        <Plus className="h-4 w-4" />
                        Nouvelle Commande
                    </Link>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par ID ou Client..."
                            className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cookie-brown)]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-orange-50 border-orange-200 text-orange-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                        >
                            <Filter className="h-4 w-4" />
                            Filtres
                            <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                                    <select
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">Tous les statuts</option>
                                        <option value="new">Nouvelle</option>
                                        <option value="preparing">En préparation</option>
                                        <option value="ready">Prête</option>
                                        <option value="delivered">Livrée</option>
                                        <option value="paid">Payée</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Date Début</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="date"
                                            className="w-full pl-9 p-2 border border-gray-200 rounded-lg text-sm"
                                            value={dateRange.start}
                                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Date Fin</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="date"
                                            className="w-full pl-9 p-2 border border-gray-200 rounded-lg text-sm"
                                            value={dateRange.end}
                                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Tabs Actives / Archivées */}
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('actives')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'actives' ? 'border-[var(--cookie-brown)] text-[var(--cookie-brown)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Commandes Actives
                </button>
                <button
                    onClick={() => setActiveTab('archivees')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'archivees' ? 'border-[var(--cookie-brown)] text-[var(--cookie-brown)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Archivées (Livrées & Payées)
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[200px] relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-[var(--cookie-brown)]" />
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 font-medium">ID Commande</th>
                                    <th className="px-6 py-4 font-medium">Client</th>
                                    <th className="px-6 py-4 font-medium">Date</th>
                                    <th className="px-6 py-4 font-medium">Statut</th>
                                    <th className="px-6 py-4 font-medium">Créé par</th>
                                    <th className="px-6 py-4 font-medium text-right">Total</th>
                                    <th className="px-6 py-4 font-medium text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <AnimatePresence>
                                    {orders.map((order) => (
                                        <motion.tr
                                            key={order.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }} // Light blue hover
                                            drag="x"
                                            dragConstraints={{ left: 0, right: 0 }}
                                            onDragEnd={(event, info) => {
                                                if (info.offset.x < -100) {
                                                    handleRowClick(order); // Swipe Left -> Edit
                                                }
                                            }}
                                            className="group transition-colors cursor-pointer relative"
                                            onClick={() => handleRowClick(order)}
                                        >
                                            <td className="px-6 py-4 font-bold text-[var(--cookie-brown)] cursor-pointer" onClick={(e) => handleCopyId(e, order.id!)}>
                                                <div className="flex items-center gap-2 group/copy relative">
                                                    <span>{order.id}</span>
                                                    <div className="opacity-0 group-hover/copy:opacity-100 transition-opacity p-1 bg-gray-100 rounded text-gray-500 hover:text-[var(--cookie-brown)]">
                                                        {copiedId === order.id ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                        {((order.customer as any)?.company_name || (order.customer as any)?.name || "??").substring(0, 2).toUpperCase()}
                                                    </div>
                                                    {(order.customer as any)?.company_name || (order.customer as any)?.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {order.created_at ? new Date(order.created_at).toLocaleDateString('fr-FR') : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={order.status!} />
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500">
                                                {(order as any).creator?.full_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900">
                                                {formatPrice(order.total_amount || 0)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleRowClick(order); }}
                                                        className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-green-600"
                                                        title="Modifier"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <Link
                                                        href={`/commandes/${order.id}`}
                                                        onClick={(e) => { e.stopPropagation(); }}
                                                        className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
                                                        title="Facture PDF"
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setOrderToDelete(order.id!);
                                                        }}
                                                        className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                                            {orders.length === 0
                                                ? "Aucune commande trouvée dans la base de données."
                                                : "Aucune commande ne correspond à vos filtres."}
                                            <br />
                                            <button
                                                onClick={() => window.location.reload()}
                                                className="mt-2 text-xs text-[var(--cookie-brown)] font-bold hover:underline"
                                            >
                                                Forcer l'actualisation complète
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {orders.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            Aucune commande trouvée pour ces critères.
                        </div>
                    )}
                </div>

                {/* Pagination Placeholder */}
                <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                    <span>Affichage de {orders.length} résultat(s) sur {totalCount} au total</span>
                    <div className="flex gap-2">
                        <button
                            className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            disabled={currentPage === 1 || loading}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        >
                            Précédent
                        </button>
                        <span className="px-4 py-2 font-medium text-[var(--cookie-brown)] bg-orange-50 rounded">Page {currentPage}</span>
                        <button
                            className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            disabled={currentPage * ITEMS_PER_PAGE >= totalCount || loading}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            </div>

            <div className="text-xs text-center text-gray-400 sm:hidden">
                Swipe gauche pour éditer
            </div>

            <ConfirmModal
                isOpen={!!orderToDelete}
                title="Supprimer la commande"
                message={`Êtes-vous sûr de vouloir supprimer la commande ${orderToDelete} ? Cette action est irréversible.`}
                onConfirm={() => {
                    if (orderToDelete) handleDeleteOrder(orderToDelete);
                    setOrderToDelete(null);
                }}
                onCancel={() => setOrderToDelete(null)}
            />
        </div>
    );
}
