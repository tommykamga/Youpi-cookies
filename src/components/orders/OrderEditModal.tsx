"use client";

import { X, Plus, Trash2, Save, FileText, Loader2, Pencil } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Order, Product } from "@/types";
import { formatPrice } from "@/config/currency";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { createClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

interface OrderEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Partial<Order> | null;
    onSave: (updatedOrder: Partial<Order>) => void;
    onDelete?: (orderId: string) => void;
}

// Removed mockProducts array

// Use a small helper for order item type safely
type OrderItemInput = { productId: string; quantity: number };

export default function OrderEditModal({ isOpen, onClose, order, onSave, onDelete }: OrderEditModalProps) {
    const supabase = createClient();
    const [formData, setFormData] = useState<Partial<Order>>({});
    const [items, setItems] = useState<OrderItemInput[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Fetch Products for the dropdown
    useEffect(() => {
        const fetchProducts = async () => {
            const { data } = await supabase.from('products').select('*').order('name');
            if (data) setProducts(data);
        };
        if (isOpen) fetchProducts();
    }, [isOpen, supabase]);

    // Initialize form when order changes
    useEffect(() => {
        if (order) {
            console.log("[OrderEditModal] Initializing with order:", order);
            setFormData(order);

            // Fetch items explicitly for this order
            const fetchItems = async () => {
                if (!order.id) return;

                const { data, error } = await supabase
                    .from('order_items')
                    .select('*')
                    .eq('order_id', order.id);

                if (error) {
                    console.error("[OrderEditModal] Error fetching items:", error);
                    return;
                }

                if (data && data.length > 0) {
                    console.log("[OrderEditModal] Fetched items:", data);
                    setItems(data.map((item: any) => ({
                        productId: item.product_id,
                        quantity: item.quantity
                    })));
                } else {
                    console.log("[OrderEditModal] No items found in DB.");
                    setItems([]);
                }
            };

            fetchItems();
        }
    }, [order, supabase]);

    const handleChange = (field: keyof Order, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addItem = () => {
        if (!selectedProduct) return;
        const exists = items.find(i => i.productId === selectedProduct);
        if (exists) {
            setItems(items.map(i => i.productId === selectedProduct ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setItems([...items, { productId: selectedProduct, quantity: 1 }]);
        }
        setSelectedProduct("");
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.productId !== id));
    };

    const updateQuantity = (id: string, qty: number) => {
        if (isNaN(qty) || qty < 0) return;
        setItems(items.map(i => i.productId === id ? { ...i, quantity: qty } : i));
    };

    const calculateTotal = () => {
        return items.reduce((acc, item) => {
            const product = products.find(p => p.id === item.productId);
            return acc + (product ? product.price * item.quantity : 0);
        }, 0);
    };

    // Stock warnings
    const stockWarnings = useMemo(() => {
        return items
            .map(item => {
                const product = products.find(p => p.id === item.productId);
                if (product && item.quantity > product.stock) {
                    return `${product.name} : qté demandée (${item.quantity}) > stock disponible (${product.stock})`;
                }
                return null;
            })
            .filter(Boolean) as string[];
    }, [items, products]);

    // Reset form state and close modal
    const handleCancel = () => {
        setFormData(order ?? {});
        setItems([]);
        setSelectedProduct("");
        onClose();
    };

    const handleSave = () => {
        // Confirm if stock warnings exist
        if (stockWarnings.length > 0) {
            const ok = window.confirm(
                "⚠️ Certaines quantités dépassent le stock disponible.\nVoulez-vous quand même valider la commande ?"
            );
            if (!ok) return;
        }

        // Construct updated order object
        const updatedOrder = {
            ...formData,
            total_amount: calculateTotal(),
            items: items.map(i => {
                const p = products.find(prod => prod.id === i.productId);
                return {
                    id: Math.random().toString(36).substr(2, 9), // temp id, should be handled by DB
                    order_id: formData.id || "",
                    product_id: i.productId,
                    quantity: i.quantity,
                    unit_price: p?.price || 0,
                    product: p as any
                };
            })
        };
        onSave(updatedOrder);
        onClose();
    };

    if (!isOpen || !order) return null;

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCancel}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Modifier Commande</h2>
                                    <p className="text-sm text-gray-500">#{formData.id}</p>
                                </div>
                                <button
                                    onClick={handleCancel}
                                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-8">
                                {/* Top Row: Client & Status */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Client</label>
                                            <div className="font-medium text-gray-900 text-lg">
                                                {formData.customer?.company_name || formData.customer?.name || "Client Inconnu"}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Date Création</label>
                                                <div className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-500 text-sm">
                                                    {formData.created_at ? new Date(formData.created_at).toLocaleDateString('fr-FR') : '-'}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Date Livraison</label>
                                                <input
                                                    type="date"
                                                    value={formData.delivery_date ? new Date(formData.delivery_date).toISOString().split('T')[0] : ""}
                                                    onChange={(e) => handleChange("delivery_date", e.target.value)}
                                                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => handleChange("status", e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)]"
                                            >
                                                <option value="new">Nouvelle</option>
                                                <option value="preparing">En préparation</option>
                                                <option value="ready">Prête</option>
                                                <option value="delivered">Livrée</option>
                                                <option value="invoiced">Facturée</option>
                                                <option value="paid">Payée</option>
                                                <option value="advance">Avance payée</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                            <textarea
                                                className="w-full p-2 border border-gray-200 rounded-lg text-sm h-20 resize-none focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                                placeholder="Notes internes..."
                                                value={formData.notes || ""}
                                                onChange={(e) => handleChange("notes", e.target.value)}
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* Products Section */}
                                <div>
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        Produits & Quantités
                                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{items.length} articles</span>
                                    </h3>

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                                        <div className="flex gap-2">
                                            <select
                                                className="flex-1 p-2 border border-gray-200 rounded-lg text-sm"
                                                value={selectedProduct}
                                                onChange={(e) => setSelectedProduct(e.target.value)}
                                            >
                                                <option value="">Ajouter un produit...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} - {formatPrice(p.price)}</option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={addItem}
                                                className="btn-primary flex items-center justify-center p-2 rounded-lg"
                                            >
                                                <Plus className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                        <AnimatePresence>
                                            {items.map(item => {
                                                const product = products.find(p => p.id === item.productId);
                                                if (!product) return null;
                                                return (
                                                    <motion.div
                                                        key={item.productId}
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-[var(--cookie-brown)] transition-colors group"
                                                    >
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-800">{product.name}</div>
                                                            <div className="text-sm text-[var(--cookie-brown)]">{formatPrice(product.price)} / unité</div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                                                                >
                                                                    -
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.quantity === 0 ? "" : item.quantity.toString()}
                                                                    onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                                                                    className="w-12 text-center bg-transparent border-none focus:ring-0 font-medium text-gray-900"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                                    className="w-8 h-8 flex items-center justify-center text-[var(--cookie-brown)] hover:bg-[var(--cookie-brown)] hover:text-white rounded transition-colors"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                            <div className="w-24 text-right font-bold text-gray-900">
                                                                {formatPrice(product.price * item.quantity)}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItem(item.productId)}
                                                                className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                        {items.length === 0 && (
                                            <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 flex flex-col items-center gap-2">
                                                <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center">
                                                    <Plus className="h-6 w-6 text-gray-400" />
                                                </div>
                                                <p>Aucun produit ajouté</p>
                                                <p className="text-xs text-gray-400">Sélectionnez un produit ci-dessus pour commencer</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Stock warnings */}
                                    {stockWarnings.length > 0 && (
                                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
                                            {stockWarnings.map((w, i) => (
                                                <p key={i} className="text-xs text-red-600 flex items-start gap-1">
                                                    <span className="shrink-0">⚠️</span>
                                                    <span>{w}</span>
                                                </p>
                                            ))}
                                            <p className="text-[11px] text-red-400 italic mt-1">
                                                Cette alerte n'empêche pas la sauvegarde de la commande.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Actions */}
                                <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 mt-auto rounded-b-2xl">
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <span className="text-gray-600 font-medium">Total:</span>
                                        <span className="text-xl font-bold text-[var(--cookie-brown)]">
                                            {formatPrice(calculateTotal())}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (order?.id) window.open(`/commandes/${order.id}`, '_blank');
                                            }}
                                            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all" title="Générer PDF">
                                            <FileText className="h-5 w-5" />
                                        </button>
                                        {onDelete && order && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setShowDeleteConfirm(true);
                                                }}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all"
                                                title="Supprimer la commande"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 shadow-lg hover:shadow-xl transform transition-all hover:-translate-y-0.5"
                                        >
                                            <Save className="h-4 w-4" />
                                            Sauvegarder
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                title="Supprimer la commande"
                message="Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible."
                onConfirm={() => {
                    if (onDelete && order?.id) {
                        onDelete(order.id);
                        onClose();
                    }
                }}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </>
    );
}
