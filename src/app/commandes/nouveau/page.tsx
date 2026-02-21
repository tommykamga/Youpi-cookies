
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from "lucide-react";
import { formatPrice } from "@/config/currency";
import { createClient } from "@/lib/supabase";
import { Product, Customer } from "@/types";

export default function NewOrderPage() {
    const router = useRouter();
    const supabase = createClient();
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [items, setItems] = useState<{ productId: string; quantity: number }[]>([]);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [status, setStatus] = useState("new");
    const [notes, setNotes] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const [prodRes, custRes] = await Promise.all([
                supabase.from('products').select('*').order('name'),
                supabase.from('customers').select('*').order('name')
            ]);

            if (prodRes.data) setProducts(prodRes.data);
            if (custRes.data) setCustomers(custRes.data);
        };
        fetchData();
    }, [supabase]);

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

    const handleSave = async () => {
        if (!selectedCustomer) {
            alert("Veuillez sélectionner un client");
            return;
        }
        if (items.length === 0) {
            alert("Veuillez ajouter au moins un produit");
            return;
        }

        // Confirm if stock warnings exist
        if (stockWarnings.length > 0) {
            const ok = window.confirm(
                "⚠️ Certaines quantités dépassent le stock disponible.\nVoulez-vous quand même valider la commande ?"
            );
            if (!ok) return;
        }

        setIsSaving(true);
        try {
            // 1. Create Order ID (Format: CMD-YYYYMMDD-XXXX)
            const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const orderId = `CMD-${dateStr}-${randomSuffix}`;

            // Get current user
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            // 2. Insert Order
            const { error: orderError } = await supabase.from('orders').insert({
                id: orderId,
                customer_id: selectedCustomer,
                total_amount: calculateTotal(),
                status: status,
                delivery_date: deliveryDate || null,
                notes: notes,
                user_id: userId || null,
                created_at: new Date().toISOString()
            });

            if (orderError) throw orderError;

            // 3. Insert Order Items
            const orderItems = items.map(item => {
                const product = products.find(p => p.id === item.productId);
                return {
                    order_id: orderId,
                    product_id: item.productId,
                    quantity: item.quantity,
                    unit_price: product?.price || 0
                };
            });

            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
            if (itemsError) throw itemsError;

            alert("Commande créée avec succès !");
            router.refresh();
            router.push("/commandes");
        } catch (error: any) {
            console.error("Error creating order:", error.message, error.details);
            alert(`Erreur lors de la création de la commande: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/commandes" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-2xl font-bold text-[var(--cookie-brown)]">Nouvelle Commande</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Form */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Client Selection */}
                    <div className="card">
                        <h3 className="font-bold text-gray-800 mb-4">Informations Client</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                                <select
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                    value={selectedCustomer}
                                    onChange={(e) => setSelectedCustomer(e.target.value)}
                                >
                                    <option value="">Sélectionner un client...</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.company_name || c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de livraison</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                        value={deliveryDate}
                                        onChange={(e) => setDeliveryDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="new">Nouvelle</option>
                                        <option value="preparing">En préparation</option>
                                        <option value="advance">Avance payée</option>
                                        <option value="ready">Prête</option>
                                        <option value="delivered">Livrée</option>
                                        <option value="paid">Payée</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Product Selection */}
                    <div className="card">
                        <h3 className="font-bold text-gray-800 mb-4">Produits</h3>
                        <div className="flex gap-2 mb-4">
                            <select
                                className="flex-1 p-2 border border-gray-200 rounded-lg"
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
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 rounded-lg flex items-center"
                            >
                                <Plus className="h-5 w-5" />
                            </button>
                        </div>

                        {items.length > 0 ? (
                            <div className="space-y-2">
                                {items.map(item => {
                                    const product = products.find(p => p.id === item.productId);
                                    return (
                                        <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{product?.name}</p>
                                                <p className="text-sm text-gray-500">{formatPrice(product?.price)} / unité</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity || ""}
                                                    onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                                                    className="w-16 p-1 border border-gray-200 rounded text-center"
                                                />
                                                <span className="font-bold w-20 text-right">
                                                    {formatPrice((product?.price || 0) * (item.quantity || 0))}
                                                </span>
                                                <button
                                                    onClick={() => removeItem(item.productId)}
                                                    className="text-red-400 hover:text-red-600 p-1"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-4">Aucun produit ajouté</p>
                        )}

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
                                    Cette alerte n'empêche pas la création de la commande.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Summary */}
                <div className="space-y-6">
                    <div className="card bg-[var(--cookie-cream)] border-orange-100">
                        <h3 className="font-bold text-[var(--cookie-brown)] mb-4">Résumé</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Sous-total</span>
                                <span className="font-medium">{formatPrice(calculateTotal())}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">TVA (0%)</span>
                                <span className="font-medium">-</span>
                            </div>
                            <div className="pt-3 border-t border-orange-200 flex justify-between text-lg font-bold text-[var(--cookie-brown)]">
                                <span>Total</span>
                                <span>{formatPrice(calculateTotal())}</span>
                            </div>
                        </div>

                        {/* Stock warnings in summary */}
                        {stockWarnings.length > 0 && (
                            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg space-y-1">
                                {stockWarnings.map((w, i) => (
                                    <p key={i} className="text-[11px] text-red-600">⚠️ {w}</p>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full mt-6 btn-primary flex justify-center items-center gap-2 py-3 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {isSaving ? "Enregistrement..." : "Enregistrer la commande"}
                        </button>
                    </div>

                    <div className="card">
                        <h3 className="font-bold text-gray-800 mb-2">Notes Internes</h3>
                        <textarea
                            className="w-full p-2 border border-gray-200 rounded-lg text-sm h-32 resize-none"
                            placeholder="Instructions spéciales, code porte, etc."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        ></textarea>
                    </div>
                </div>
            </div>
        </div>
    );
}
