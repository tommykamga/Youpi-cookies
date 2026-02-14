
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { formatPrice } from "@/config/currency";

// Mock Products
const mockProducts = [
    { id: "1", name: "Gaufres fines rhum (110g)", price: 1500 },
    { id: "2", name: "Gaufres fines chocolats (110g)", price: 1800 },
    { id: "3", name: "Gaufres fines rhum (220g)", price: 2800 },
    { id: "4", name: "Gaufres fines chocolats (220g)", price: 3200 },
];

export default function NewOrderPage() {
    const [items, setItems] = useState<{ productId: string; quantity: number }[]>([]);
    const [selectedProduct, setSelectedProduct] = useState("");

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
            const product = mockProducts.find(p => p.id === item.productId);
            return acc + (product ? product.price * item.quantity : 0);
        }, 0);
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
                                <select className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none">
                                    <option value="">Sélectionner un client...</option>
                                    <option value="1">Alice Dupont</option>
                                    <option value="2">Boulangerie Paul</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de livraison</label>
                                    <input type="date" className="w-full p-2 border border-gray-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select className="w-full p-2 border border-gray-200 rounded-lg" defaultValue="new">
                                        <option value="new">Nouvelle</option>
                                        <option value="preparing">En préparation</option>
                                        <option value="advance">Avance payée</option>
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
                                {mockProducts.map(p => (
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
                                    const product = mockProducts.find(p => p.id === item.productId);
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
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value))}
                                                    className="w-16 p-1 border border-gray-200 rounded text-center"
                                                />
                                                <span className="font-bold w-20 text-right">
                                                    {formatPrice((product!.price * item.quantity))}
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

                        <button className="w-full mt-6 btn-primary flex justify-center items-center gap-2 py-3">
                            <Save className="h-4 w-4" />
                            Enregistrer la commande
                        </button>
                    </div>

                    <div className="card">
                        <h3 className="font-bold text-gray-800 mb-2">Notes Internes</h3>
                        <textarea
                            className="w-full p-2 border border-gray-200 rounded-lg text-sm h-32 resize-none"
                            placeholder="Instructions spéciales, code porte, etc."
                        ></textarea>
                    </div>
                </div>
            </div>
        </div>
    );
}
