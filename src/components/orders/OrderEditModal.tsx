"use client";

import { X, Save, Plus, Trash2, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { Order, Product } from "@/types";
import { formatPrice } from "@/config/currency";
import { createClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

interface OrderEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Partial<Order> | null;
    onSave: (updatedOrder: Partial<Order>) => void;
}

// Removed mockProducts array

// Use a small helper for order item type safely
type OrderItemInput = { productId: string; quantity: number };

export default function OrderEditModal({ isOpen, onClose, order, onSave }: OrderEditModalProps) {
    const supabase = createClient();
    const [formData, setFormData] = useState<Partial<Order>>({});
    const [items, setItems] = useState<OrderItemInput[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState("");

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
            setFormData(order);
            // Map existing items or default to empty
            if (order.items) {
                setItems(order.items.map(item => ({
                    productId: item.product_id,
                    quantity: item.quantity
                })));
            } else {
                setItems([]);
            }
        }
    }, [order]);

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
        if (qty < 1) return;
        setItems(items.map(i => i.productId === id ? { ...i, quantity: qty } : i));
    };

    const calculateTotal = () => {
        return items.reduce((acc, item) => {
            const product = products.find(p => p.id === item.productId);
            return acc + (product ? product.price * item.quantity : 0);
        }, 0);
    };

    const handleSave = () => {
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
                        className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Modifier Commande</h2>
                                <p className="text-sm text-gray-500">#{formData.id}</p>
                            </div>
                            <button
                                onClick={onClose}
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
                                            {formData.customer?.name || "Client Inconnu"}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input
                                            type="date"
                                            value={formData.created_at ? new Date(formData.created_at).toISOString().split('T')[0] : ""}
                                            onChange={(e) => handleChange("created_at", e.target.value)}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                        />
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
                                            onClick={addItem}
                                            className="btn-primary flex items-center justify-center p-2 rounded-lg"
                                        >
                                            <Plus className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {items.length === 0 && (
                                        <div className="text-center py-8 text-gray-400 text-sm">Aucun produit dans cette commande.</div>
                                    )}
                                    {items.map(item => {
                                        const product = products.find(p => p.id === item.productId);
                                        return (
                                            <div key={item.productId} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 text-sm">{product?.name}</p>
                                                    <p className="text-xs text-gray-500">{formatPrice(product?.price)}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value))}
                                                        className="w-16 p-1 border border-gray-200 rounded text-center text-sm"
                                                    />
                                                    <div className="text-right w-20">
                                                        <span className="font-bold text-sm">
                                                            {formatPrice((product?.price || 0) * item.quantity)}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(item.productId)}
                                                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 mt-auto rounded-b-2xl">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <span className="text-gray-600 font-medium">Total:</span>
                                <span className="text-xl font-bold text-[var(--cookie-brown)]">
                                    {formatPrice(calculateTotal())}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all" title="Générer PDF">
                                    <FileText className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 shadow-lg hover:shadow-xl transform transition-all hover:-translate-y-0.5"
                                >
                                    <Save className="h-4 w-4" />
                                    Sauvegarder
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
