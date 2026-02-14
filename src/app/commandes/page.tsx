"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Filter, MoreHorizontal, FileText, Copy, ArrowRight, Pencil, Calendar, X, ChevronDown } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { Order } from "@/types";
import OrderEditModal from "@/components/orders/OrderEditModal";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/config/currency";

// Mock Data (Expanded for testing)
const initialMockOrders: Partial<Order>[] = [
    {
        id: "CMD-001",
        customer: { name: "Alice Dupont" } as any,
        total_amount: 15000,
        status: "new",
        created_at: "2023-10-25",
        items: [
            { product_id: "1", quantity: 5 } as any,
            { product_id: "2", quantity: 2 } as any
        ]
    },
    {
        id: "CMD-002",
        customer: { name: "Boulangerie Paul" } as any,
        total_amount: 45000,
        status: "preparing",
        created_at: "2023-10-25",
        items: [{ product_id: "2", quantity: 20 } as any]
    },
    {
        id: "CMD-003",
        customer: { name: "Jean Martin" } as any,
        total_amount: 8500,
        status: "ready",
        created_at: "2023-10-24",
        items: [{ product_id: "3", quantity: 2 } as any]
    },
    {
        id: "CMD-004",
        customer: { name: "Café de la Gare" } as any,
        total_amount: 120000,
        status: "delivered",
        created_at: "2023-10-24",
        items: [{ product_id: "4", quantity: 15 } as any]
    },
    {
        id: "CMD-005",
        customer: { name: "Sophie Martin" } as any,
        total_amount: 22000,
        status: "paid",
        created_at: "2023-10-23",
        items: [{ product_id: "5", quantity: 10 } as any]
    },
    {
        id: "CMD-123",
        customer: { name: "Dupont" } as any,
        total_amount: 250000, // 250€ approx 164000F but sticking to user request "250€" visual equivalent
        status: "preparing",
        created_at: "2023-10-26",
        items: [
            { product_id: "2", quantity: 50, product: { name: "Chocolat" } } as any,
            { product_id: "5", quantity: 20, product: { name: "Vanille" } } as any
        ],
        notes: "Commande test demandée."
    }
];

export default function OrdersPage() {
    const [orders, setOrders] = useState(initialMockOrders);
    const [selectedOrder, setSelectedOrder] = useState<Partial<Order> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filters State
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [showFilters, setShowFilters] = useState(false);

    // Filter Logic
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch =
                order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === "all" || order.status === statusFilter;

            let matchesDate = true;
            if (dateRange.start && order.created_at) {
                matchesDate = matchesDate && new Date(order.created_at) >= new Date(dateRange.start);
            }
            if (dateRange.end && order.created_at) {
                matchesDate = matchesDate && new Date(order.created_at) <= new Date(dateRange.end);
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [orders, searchTerm, statusFilter, dateRange]);

    const handleRowClick = (order: Partial<Order>) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleSaveOrder = (updatedOrder: Partial<Order>) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        // Also perform DB update here
        console.log("Saved order:", updatedOrder);
    };

    const handleDuplicate = (order: Partial<Order>) => {
        const newOrder = {
            ...order,
            id: `CMD-${Math.floor(Math.random() * 1000)}`, // New ID
            status: 'new' as const,
            created_at: new Date().toISOString().split('T')[0]
        };
        setOrders([newOrder, ...orders]);
        alert(`Commande dupliquée: ${newOrder.id}`);
    };

    return (
        <div className="space-y-6">
            <OrderEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                order={selectedOrder}
                onSave={handleSaveOrder}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-[var(--cookie-brown)]">Gestion Commandes</h1>
                <Link
                    href="/commandes/nouveau"
                    className="btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transform transition-transform hover:-translate-y-0.5"
                >
                    <Plus className="h-4 w-4" />
                    Nouvelle Commande
                </Link>
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

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium">ID Commande</th>
                                <th className="px-6 py-4 font-medium">Client</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Statut</th>
                                <th className="px-6 py-4 font-medium text-right">Total</th>
                                <th className="px-6 py-4 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <AnimatePresence>
                                {filteredOrders.map((order) => (
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
                                            } else if (info.offset.x > 100) {
                                                handleDuplicate(order); // Swipe Right -> Duplicate
                                            }
                                        }}
                                        className="group transition-colors cursor-pointer relative"
                                        onClick={() => handleRowClick(order)}
                                    >
                                        <td className="px-6 py-4 font-bold text-[var(--cookie-brown)]">
                                            {order.id}
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                    {order.customer?.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                {order.customer?.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{order.created_at}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={order.status!} />
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                                            {formatPrice(order.total_amount)}
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
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); /* PDF Logic */ }}
                                                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
                                                    title="Facture PDF"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDuplicate(order); }}
                                                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-[var(--cookie-accent)]"
                                                    title="Dupliquer"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>

                    {filteredOrders.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            Aucune commande trouvée pour ces critères.
                        </div>
                    )}
                </div>

                {/* Pagination Placeholder */}
                <div className="p-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                    <span>Affichage {filteredOrders.length} résultats</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Précédent</button>
                        <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Suivant</button>
                    </div>
                </div>
            </div>

            <div className="text-xs text-center text-gray-400 sm:hidden">
                Swipe gauche pour éditer • Swipe droite pour dupliquer
            </div>
        </div>
    );
}
