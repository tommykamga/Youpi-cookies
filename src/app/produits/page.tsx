"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Filter, MoreHorizontal, Package, Edit, Trash2, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/types";
import { formatPrice } from "@/config/currency";
import { createClient } from "@/lib/supabase";

// Mock Data (Fallback)
export const mockProducts: Product[] = [
    { id: "1", name: "Gaufres fines rhum (110g)", price: 1500, stock: 150, alert_threshold: 20, unit: "110g", image_url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&q=80" },
    { id: "2", name: "Gaufres fines chocolats (110g)", price: 1800, stock: 85, alert_threshold: 20, unit: "110g", image_url: "https://images.unsplash.com/photo-1562007908-17c67e8724db?w=500&q=80" },
    { id: "3", name: "Gaufres fines rhum (220g)", price: 2800, stock: 12, alert_threshold: 15, unit: "200g", image_url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&q=80" },
    { id: "4", name: "Gaufres fines chocolats (220g)", price: 3200, stock: 200, alert_threshold: 15, unit: "200g", image_url: "https://images.unsplash.com/photo-1562007908-17c67e8724db?w=500&q=80" },
    { id: "5", name: "Gaufres vanille (110g)", price: 1400, stock: 0, alert_threshold: 20, unit: "110g", image_url: "https://images.unsplash.com/photo-1612203985729-1cfa233d45da?w=500&q=80" },
];

export default function ProductsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Try 'products' first
                let { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .order('name');

                if (error || !data) {
                    // Try 'produits' (French table name strategy)
                    const response = await supabase
                        .from('produits')
                        .select('*')
                        .order('name');

                    if (!response.error && response.data) {
                        setProducts(response.data);
                        setLoading(false);
                        return;
                    }
                }

                if (data && data.length > 0) {
                    setProducts(data);
                } else {
                    console.log("No products found in DB (or tables missing), using mock data.");
                    setProducts(mockProducts);
                }
            } catch (err) {
                console.warn("Using mock data for Products (DB fetch failed or empty).");
                setProducts(mockProducts);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--cookie-brown)]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-[var(--cookie-brown)]">Produits</h1>
                <Link
                    href="/produits/nouveau"
                    className="btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transform transition-transform hover:-translate-y-0.5"
                >
                    <Plus className="h-4 w-4" />
                    Nouveau Produit
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un produit..."
                        className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cookie-brown)]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-600">
                        <Filter className="h-4 w-4" />
                        Filtrer
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-600">
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredProducts.map((product) => (
                        <motion.div
                            key={product.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group relative flex flex-col"
                        >
                            {/* Product Image */}
                            <div className="h-48 w-full bg-gray-100 relative overflow-hidden">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-[var(--cookie-cream)]">
                                        <Package className="h-16 w-16 opacity-50" />
                                    </div>
                                )}

                                {/* Quick Actions Overlay */}
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link
                                        href={`/produits/${product.id}`}
                                        className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-600 hover:text-[var(--cookie-brown)] shadow-sm hover:shadow"
                                        title="Modifier"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Link>
                                    <button
                                        className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-600 hover:text-red-500 shadow-sm hover:shadow"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Stock Badge */}
                                <div className="absolute top-2 left-2">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold shadow-sm ${product.stock <= (product.alert_threshold || 10)
                                        ? 'bg-red-500 text-white'
                                        : 'bg-green-500 text-white'
                                        }`}>
                                        {product.stock} en stock
                                    </span>
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-800 text-lg leading-tight line-clamp-2" title={product.name}>
                                        {product.name}
                                    </h3>
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 uppercase font-medium">Prix Unitaire</span>
                                        <span className="font-bold text-[var(--cookie-brown)] text-lg">
                                            {formatPrice(product.price)}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-gray-400 uppercase font-medium block">Unité</span>
                                        <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block">
                                            {product.unit || "-"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
